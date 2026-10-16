import { createParser } from 'eventsource-parser';

export type ConversationItem = { id: string; lastActivityAt: string };
export type ConversationPage = { items: ConversationItem[]; nextCursor: string | null };
export type Turn = {
  id: string;
  text: string;
  acceptedAt: string;
  status: 'pending' | 'answered' | 'failed' | 'interrupted';
  answer?: string;
  error?: string;
  finishedAt?: string;
};
export type Conversation = {
  id: string;
  createdAt: string;
  lastActivityAt: string;
  turns: Turn[];
};
export type TurnResult =
  | { status: 'answered'; conversationId: string; turnId: string; answer: string }
  | { status: 'failed'; conversationId: string | null; error: string }
  | { status: 'interrupted'; conversationId: string | null };

export class PublicHttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function string(value: unknown): value is string { return typeof value === 'string'; }

function requireObject(value: unknown, description: string): Record<string, unknown> {
  const record = object(value);
  if (!record) throw new Error(`Risposta ${description} non valida.`);
  return record;
}

export function backendUrl(value: string): URL {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('URL del backend non valido.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('L’URL del backend deve essere HTTP(S), senza credenziali, query o frammento.');
  }
  url.pathname = url.pathname.replace(/\/?$/, '/');
  return url;
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { throw new Error('Risposta JSON del backend non valida.'); }
}

async function ensureSuccess(response: Response): Promise<unknown> {
  const body = await readJson(response);
  if (!response.ok) {
    const error = object(body)?.error;
    throw new PublicHttpError(response.status, string(error) ? error : `Errore HTTP ${response.status}.`);
  }
  return body;
}

export class AmbrogioBackend {
  constructor(private readonly base: URL, private readonly request: typeof fetch = fetch) {}

  private endpoint(path: string): URL { return new URL(path, this.base); }

  async list(cursor?: string): Promise<ConversationPage> {
    const url = this.endpoint('api/conversations');
    if (cursor !== undefined) url.searchParams.set('cursor', cursor);
    const response = await this.request(url, { headers: { Accept: 'application/json' } });
    const body = requireObject(await ensureSuccess(response), 'dell’elenco');
    if (!Array.isArray(body.items) || !(body.nextCursor === null || string(body.nextCursor))) {
      throw new Error('Risposta dell’elenco non valida.');
    }
    const items = body.items.map((item: unknown) => {
      const entry = requireObject(item, 'dell’elenco');
      if (!string(entry.id) || !string(entry.lastActivityAt)) throw new Error('Voce dell’elenco non valida.');
      return { id: entry.id, lastActivityAt: entry.lastActivityAt };
    });
    return { items, nextCursor: body.nextCursor };
  }

  async history(conversationId: string): Promise<Conversation> {
    const response = await this.request(this.endpoint(`api/conversations/${encodeURIComponent(conversationId)}`),
      { headers: { Accept: 'application/json' } });
    const body = requireObject(await ensureSuccess(response), 'dello storico');
    if (!string(body.id) || !string(body.createdAt) || !string(body.lastActivityAt) || !Array.isArray(body.turns)) {
      throw new Error('Risposta dello storico non valida.');
    }
    const turns = body.turns.map((value: unknown): Turn => {
      const turn = requireObject(value, 'dello storico');
      if (!string(turn.id) || !string(turn.text) || !string(turn.acceptedAt)
        || !['pending', 'answered', 'failed', 'interrupted'].includes(String(turn.status))) {
        throw new Error('Turno dello storico non valido.');
      }
      const status = turn.status as Turn['status'];
      if (status === 'answered' && !string(turn.answer)) throw new Error('Risposta del turno non valida.');
      if (status === 'failed' && !string(turn.error)) throw new Error('Errore del turno non valido.');
      return { id: turn.id, text: turn.text, acceptedAt: turn.acceptedAt, status,
        ...(string(turn.answer) ? { answer: turn.answer } : {}),
        ...(string(turn.error) ? { error: turn.error } : {}),
        ...(string(turn.finishedAt) ? { finishedAt: turn.finishedAt } : {}) };
    });
    return { id: body.id, createdAt: body.createdAt, lastActivityAt: body.lastActivityAt, turns };
  }

  async send(text: string, conversationId: string | null, onDelta: (delta: string) => void): Promise<TurnResult> {
    if (!text.trim()) throw new Error('Scrivi un messaggio non vuoto.');
    const payload = JSON.stringify({ text, ...(conversationId ? { conversationId } : {}) });
    if (Buffer.byteLength(payload, 'utf8') > 65_536) throw new Error('Messaggio troppo grande (massimo 64 KiB).');
    const response = await this.request(this.endpoint('api/conversations/turns'), {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: payload,
    });
    if (!response.ok) {
      await ensureSuccess(response);
      throw new Error(`Errore HTTP ${response.status}.`);
    }
    if (!response.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')
      || response.headers.get('x-vercel-ai-ui-message-stream') !== 'v1' || !response.body) {
      throw new Error('Il backend non ha restituito il flusso UI atteso.');
    }

    let streamConversationId: string | null = conversationId;
    let turnId: string | null = null;
    let answer = '';
    let result: TurnResult | null = null;
    const parser = createParser({ onEvent(event) {
      if (event.data === '[DONE]' || result) return;
      let value: unknown;
      try { value = JSON.parse(event.data); } catch { throw new Error('Parte SSE non valida.'); }
      const part = requireObject(value, 'del flusso');
      if (part.type === 'start') {
        const metadata = object(part.messageMetadata);
        if (!string(metadata?.conversationId) || !string(metadata?.turnId)) {
          throw new Error('Identità del turno mancante nel flusso.');
        }
        streamConversationId = metadata.conversationId;
        turnId = metadata.turnId;
      } else if (part.type === 'text-delta') {
        if (!string(part.delta)) throw new Error('Incremento testuale non valido.');
        answer += part.delta;
        onDelta(part.delta);
      } else if (part.type === 'error') {
        result = { status: 'failed', conversationId: streamConversationId,
          error: string(part.errorText) ? part.errorText : 'Errore nel flusso.' };
      } else if (part.type === 'finish' && part.finishReason === 'stop'
        && object(part.messageMetadata)?.turnStatus === 'answered' && streamConversationId && turnId) {
        result = { status: 'answered', conversationId: streamConversationId, turnId, answer };
      }
    } });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value, { stream: true }));
      }
      parser.feed(decoder.decode());
      parser.reset({ consume: true });
    } catch {
      if (result) return result;
      return { status: 'interrupted', conversationId: streamConversationId };
    } finally {
      reader.releaseLock();
    }
    return result ?? { status: 'interrupted', conversationId: streamConversationId };
  }
}

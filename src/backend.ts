import { randomUUID } from 'node:crypto';

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

export type ClientIdentity = { clientId: string; name: string };
type Message = Record<string, unknown> & { type?: unknown };
type PendingTurn = {
  conversationId: string | null;
  turnId?: string;
  answer: string;
  streams: Set<number>;
  onDelta: (delta: string) => void;
  settle: (result: TurnResult) => void;
};

const protocol = 'ambrogio.v1';
const maxTextBytes = 65_536;
const readyTimeoutMs = 10_000;

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

/** The WebSocket address of the conversation channel under the backend base URL. */
export function sessionUrl(base: URL): URL {
  const url = new URL('api/session', base);
  url.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
  return url;
}

/** One `ambrogio.v1` session carrying the turns of every conversation. */
class ConversationSession {
  private readonly turns = new Map<string, PendingTurn>();
  private readonly streams = new Map<number, string>();
  private nextStream = 1;
  closed = false;

  private constructor(private readonly socket: WebSocket) {
    socket.addEventListener('message', event => this.receive(event.data));
    socket.addEventListener('close', () => this.release());
    socket.addEventListener('error', () => { /* the close event concludes pending turns */ });
  }

  static async open(url: URL, identity: ClientIdentity): Promise<ConversationSession> {
    const socket = new WebSocket(url, protocol);
    socket.binaryType = 'arraybuffer';
    const session = new ConversationSession(socket);
    await new Promise<void>((resolve, reject) => {
      const fail = () => { clearTimeout(timer); reject(new Error('Impossibile collegarsi al backend.')); };
      const timer = setTimeout(() => { socket.close(); fail(); }, readyTimeoutMs);
      socket.addEventListener('close', fail, { once: true });
      socket.addEventListener('open', () => {
        if (socket.protocol !== protocol) { socket.close(); return; }
        socket.send(JSON.stringify({ type: 'session.hello', clientId: identity.clientId, name: identity.name }));
      }, { once: true });
      socket.addEventListener('message', event => {
        if (typeof event.data !== 'string') return;
        let message: unknown;
        try { message = JSON.parse(event.data); } catch { return; }
        if (object(message)?.type !== 'session.ready') return;
        clearTimeout(timer);
        socket.removeEventListener('close', fail);
        resolve();
      });
    });
    return session;
  }

  send(text: string, conversationId: string | null, onDelta: (delta: string) => void): Promise<TurnResult> {
    const requestId = randomUUID();
    const stream = this.nextStream++;
    return new Promise<TurnResult>(resolve => {
      this.turns.set(requestId, { conversationId, answer: '', streams: new Set(), onDelta,
        settle: result => { this.turns.delete(requestId); resolve(result); } });
      this.write({ type: 'input.start', requestId, stream, content: { type: 'text' }, reply: 'text',
        ...(conversationId ? { conversationId } : {}) });
      this.write({ type: 'input.chunk', requestId, text });
      this.write({ type: 'input.end', requestId });
    });
  }

  close(): void { this.socket.close(1000); }

  private write(message: Message): void {
    if (this.socket.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  private receive(data: unknown): void {
    if (typeof data !== 'string') return;
    let value: unknown;
    try { value = JSON.parse(data); } catch { return; }
    const message = object(value);
    if (!message || !string(message.type)) return;
    const turnFor = (requestId: unknown) => string(requestId) ? this.turns.get(requestId) : undefined;
    const byTurnId = (turnId: unknown) => [...this.turns.values()].find(turn => turn.turnId === turnId);
    switch (message.type) {
      case 'turn.accepted': {
        const turn = turnFor(message.requestId);
        if (turn && string(message.conversationId) && string(message.turnId)) {
          turn.conversationId = message.conversationId;
          turn.turnId = message.turnId;
        }
        return;
      }
      case 'output.start': {
        const turn = turnFor(message.requestId);
        if (turn && typeof message.stream === 'number') {
          this.streams.set(message.stream, message.requestId as string);
          turn.streams.add(message.stream);
        }
        return;
      }
      case 'output.chunk': {
        const requestId = typeof message.stream === 'number' ? this.streams.get(message.stream) : undefined;
        const turn = turnFor(requestId);
        if (turn && string(message.text)) { turn.answer += message.text; turn.onDelta(message.text); }
        return;
      }
      case 'output.end':
        if (typeof message.stream === 'number') this.streams.delete(message.stream);
        return;
      case 'turn.completed': {
        const turn = byTurnId(message.turnId);
        if (turn) turn.settle({ status: 'answered', conversationId: turn.conversationId!,
          turnId: turn.turnId!, answer: turn.answer });
        return;
      }
      case 'turn.failed': {
        const turn = byTurnId(message.turnId);
        if (turn) turn.settle({ status: 'failed', conversationId: turn.conversationId,
          error: string(message.message) ? message.message : 'Errore del turno.' });
        return;
      }
      case 'turn.interrupted': {
        const turn = byTurnId(message.turnId);
        if (turn) turn.settle({ status: 'interrupted', conversationId: turn.conversationId });
        return;
      }
      case 'turn.rejected': {
        const turn = turnFor(message.requestId);
        if (turn) turn.settle({ status: 'failed', conversationId: turn.conversationId,
          error: string(message.message) ? message.message : 'Turno rifiutato.' });
        return;
      }
      case 'session.error': {
        const turn = turnFor(message.requestId);
        if (turn) turn.settle({ status: 'failed', conversationId: turn.conversationId,
          error: `Errore del protocollo: ${string(message.message) ? message.message : 'messaggio non valido.'}` });
        return;
      }
      default:
        // Server messages outside turns that ask for an action are not supported by this client.
        if (string(message.id) && !message.type.startsWith('session.') && !message.type.startsWith('output.')
          && !message.type.startsWith('turn.')) {
          this.write({ type: 'client.result', id: message.id, ok: false, reason: 'unsupported' });
        }
    }
  }

  private release(): void {
    if (this.closed) return;
    this.closed = true;
    for (const turn of [...this.turns.values()]) {
      turn.settle({ status: 'interrupted', conversationId: turn.conversationId });
    }
  }
}

export class AmbrogioBackend {
  private session?: Promise<ConversationSession>;

  constructor(private readonly base: URL, private readonly identity: ClientIdentity,
    private readonly request: typeof fetch = fetch) {}

  private endpoint(path: string): URL { return new URL(path, this.base); }

  /** Close the conversation session, if one is open. */
  async close(): Promise<void> {
    const session = await this.session?.catch(() => undefined);
    session?.close();
  }

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
    if (Buffer.byteLength(text, 'utf8') > maxTextBytes) throw new Error('Messaggio troppo grande (massimo 64 KiB).');
    let session = await this.session?.catch(() => undefined);
    if (!session || session.closed) {
      this.session = ConversationSession.open(sessionUrl(this.base), this.identity);
      session = await this.session;
    }
    return session.send(text, conversationId, onDelta);
  }
}

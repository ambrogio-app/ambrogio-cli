import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { once } from 'node:events';
import { WebSocketServer, type WebSocket } from 'ws';

export type ClientMessage = Record<string, unknown> & { type: string };

/** A controlled turn: the script talks to the client through the helpers of `TurnContext`. */
export type TurnContext = Readonly<{
  requestId: string;
  conversationId?: string;
  text: string;
  socket: WebSocket;
  send(message: Record<string, unknown>): void;
  /** Send `turn.accepted` and return the turn id. */
  accept(conversationId: string, turnId: string): void;
  /** Send one text transmission made of the given chunks. */
  transmit(chunks: readonly string[], turnId?: string): void;
}>;

export type FakeBackend = Awaited<ReturnType<typeof startFakeBackend>>;

/**
 * HTTP GET routes plus an `ambrogio.v1` WebSocket on `/api/session`. Each completed request
 * (`input.end`) is handed to `onTurn`; every client message and hello is recorded.
 */
export async function startFakeBackend(options: Readonly<{
  http?: (request: IncomingMessage, response: ServerResponse) => void;
  onTurn?: (turn: TurnContext) => void | Promise<void>;
}> = {}) {
  const messages: ClientMessage[] = [];
  const hellos: ClientMessage[] = [];
  const sockets = new Set<WebSocket>();
  let nextStream = 1;
  const server = createServer((request, response) => {
    if (options.http) options.http(request, response);
    else response.writeHead(404).end();
  });
  const wss = new WebSocketServer({ noServer: true,
    handleProtocols: protocols => protocols.has('ambrogio.v1') ? 'ambrogio.v1' : false });
  server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/api/session') { socket.destroy(); return; }
    wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws, request));
  });
  wss.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    const open = new Map<string, { conversationId?: string; text: string }>();
    socket.on('message', (data, isBinary) => {
      if (isBinary) return;
      const message = JSON.parse(String(data)) as ClientMessage;
      messages.push(message);
      const send = (value: Record<string, unknown>) => socket.send(JSON.stringify(value));
      if (message.type === 'session.hello') {
        hellos.push(message);
        send({ type: 'session.ready', protocol: 'ambrogio.v1' });
      } else if (message.type === 'input.start') {
        open.set(message.requestId as string, { text: '',
          ...(typeof message.conversationId === 'string' ? { conversationId: message.conversationId } : {}) });
      } else if (message.type === 'input.chunk') {
        open.get(message.requestId as string)!.text += message.text as string;
      } else if (message.type === 'input.end') {
        const requestId = message.requestId as string;
        const request = open.get(requestId)!;
        open.delete(requestId);
        let acceptedTurn: string | undefined;
        void options.onTurn?.({ requestId, text: request.text, socket, send,
          ...(request.conversationId === undefined ? {} : { conversationId: request.conversationId }),
          accept(conversationId, turnId) {
            acceptedTurn = turnId;
            send({ type: 'turn.accepted', requestId, conversationId, turnId, text: request.text });
          },
          transmit(chunks, turnId = acceptedTurn) {
            const stream = nextStream++;
            send({ type: 'output.start', requestId, ...(turnId ? { turnId } : {}), stream, content: { type: 'text' } });
            for (const text of chunks) send({ type: 'output.chunk', stream, text });
            send({ type: 'output.end', stream });
          } });
      }
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No address');
  return {
    url: `http://127.0.0.1:${address.port}`,
    messages,
    hellos,
    sockets,
    starts: () => messages.filter(message => message.type === 'input.start'),
    async close() {
      for (const socket of sockets) socket.terminate();
      wss.close();
      server.closeAllConnections();
      server.close();
      await once(server, 'close');
    },
  };
}

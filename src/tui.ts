import terminalKit from 'terminal-kit';
import { AmbrogioBackend, type ClientIdentity, type Conversation, type ConversationItem, type TurnResult } from './backend.js';

// The document widgets in Terminal Kit 3 are absent from @types/terminal-kit.
const kit: any = terminalKit;
const term = terminalKit.terminal;

type Entry = { id: string; label: string };
type LocalTurn = { text: string; answer: string; status: 'streaming' | 'answered' | 'failed' | 'interrupted' };

function label(value: string, width = 52): string {
  const clean = value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > width ? `${clean.slice(0, width - 1)}…` : clean;
}

function errorText(value: unknown): string { return value instanceof Error ? value.message : String(value); }

export async function runTerminalChat(url: URL, identity: ClientIdentity): Promise<void> {
  const backend = new AmbrogioBackend(url, identity);
  const entries: Entry[] = [];
  let currentId: string | null = null;
  let currentLabel = 'Nuova chat';
  let history: Conversation | null = null;
  let localTurn: LocalTurn | null = null;
  let nextCursor: string | null = null;
  let busy = false;
  let closed = false;
  let status = 'Caricamento conversazioni…';
  let doc: any;
  let menu: any;
  let chat: any;
  let input: any;
  let header: any;
  let statusBox: any;
  let side = 0;
  let resizeTimer: NodeJS.Timeout | undefined;
  let finish!: () => void;
  const done = new Promise<void>(resolve => { finish = resolve; });

  function visibleEntries(): Entry[] {
    return [{ id: currentId ?? '__draft', label: currentLabel },
      ...entries.filter(entry => entry.id !== currentId)];
  }

  function conversationText(): string {
    const lines: string[] = [];
    for (const turn of history?.turns ?? []) {
      lines.push(`Tu: ${turn.text}`);
      switch (turn.status) {
        case 'pending': lines.push('Ambrogio: In elaborazione. Aggiorna manualmente più tardi.'); break;
        case 'answered': lines.push(`Ambrogio: ${turn.answer}`); break;
        case 'failed': lines.push(`Errore: ${turn.error}`); break;
        case 'interrupted': lines.push('Risposta interrotta.'); break;
      }
      lines.push('');
    }
    if (localTurn) {
      lines.push(`Tu: ${localTurn.text}`);
      if (localTurn.status === 'streaming') lines.push(`Ambrogio: ${localTurn.answer || 'In elaborazione…'}`);
      else if (localTurn.status === 'answered') lines.push(`Ambrogio: ${localTurn.answer}`);
      else if (localTurn.status === 'failed') lines.push(`Errore: ${localTurn.answer}`);
      else lines.push('Risposta interrotta. Aggiorna manualmente più tardi.');
    }
    return lines.join('\n') || 'Scrivi un messaggio per iniziare questa chat.';
  }

  function renderChat(): void {
    if (closed || !chat) return;
    chat.setContent(conversationText());
    chat.scrollToBottom();
  }

  function renderStatus(): void { if (!closed) statusBox?.setContent(` ${status}`); }

  function renderMenu(focus = false): void {
    if (closed || !doc || term.width < 70 || term.height < 14) return;
    const keepFocus = focus || Boolean(menu && doc.focusElement && menu.isAncestorOf(doc.focusElement));
    const selected = menu?.focusChild?.value;
    menu?.destroy();
    menu = new kit.ColumnMenu({ parent: doc, x: 1, y: 3, width: side - 2,
      maxHeight: Math.max(3, term.height - 7),
      items: visibleEntries().map(entry => ({ value: entry.id,
        content: label(entry.label || entry.id.slice(0, 8), side - 5) })),
      buttonBlurAttr: { color: 'white', bgColor: 'black' },
      buttonFocusAttr: { color: 'black', bgColor: 'cyan', bold: true },
    });
    menu.on('submit', (id: string) => { void openChat(id); });
    if (keepFocus) menu.focusValue(selected ?? currentId ?? '__draft');
  }

  function onKey(key: string): void {
    if (key === 'CTRL_Q' || key === 'CTRL_C') close();
    else if (key === 'TAB') {
      const inMenu = Boolean(menu && doc?.focusElement && menu.isAncestorOf(doc.focusElement));
      if (inMenu) doc.giveFocusTo(input);
      else menu?.focusValue(currentId ?? '__draft');
    }
    else if (key === 'CTRL_N') newChat();
    else if (key === 'CTRL_R') {
      void loadList(false);
      if (currentId) void openChat(currentId);
    }
    else if (key === 'CTRL_L' && nextCursor) void loadList(true);
  }

  function buildScreen(value = '', focusInput = false): void {
    if (closed) return;
    const sideFocused = !focusInput && Boolean(menu && doc?.focusElement && menu.isAncestorOf(doc.focusElement));
    doc?.destroy();
    term.clear();
    doc = (term as any).createDocument();
    doc.keyBindings.TAB = undefined;
    doc.on('key', onKey);
    menu = chat = input = header = statusBox = undefined;
    if (term.width < 70 || term.height < 14) {
      new kit.TextBox({ parent: doc, x: 1, y: 1, width: Math.max(1, term.width - 2), height: 3,
        content: 'Allarga il terminale ad almeno 70 colonne e 14 righe.\nLa chat corrente resta aperta.' });
      return;
    }
    side = Math.min(34, Math.max(24, Math.floor(term.width * 0.29)));
    const right = side + 2;
    const rightWidth = term.width - right - 2;
    new kit.TextBox({ parent: doc, x: 1, y: 0, width: side - 2, height: 1,
      content: ' AMBROGIO · Chat', textAttr: { color: 'cyan', bold: true } });
    new kit.TextBox({ parent: doc, x: side, y: 0, width: 1, height: term.height - 1,
      content: Array(term.height).fill('│').join('\n'), textAttr: { color: 'gray' } });
    header = new kit.TextBox({ parent: doc, x: right, y: 0, width: rightWidth, height: 1,
      content: label(currentLabel, rightWidth), textAttr: { color: 'cyan', bold: true } });
    statusBox = new kit.TextBox({ parent: doc, x: right, y: 1, width: rightWidth,
      height: 1, content: ` ${status}`, textAttr: { color: 'gray' } });
    chat = new kit.TextBox({ parent: doc, x: right, y: 3, width: rightWidth,
      height: term.height - 7, content: conversationText(), scrollable: true,
      lineWrap: true, wordWrap: true });
    chat.scrollToBottom();
    new kit.TextBox({ parent: doc, x: right, y: term.height - 4, width: rightWidth,
      height: 1, content: 'Scrivi un messaggio e premi Invio', textAttr: { color: 'gray' } });
    input = new kit.InlineInput({ parent: doc, x: right, y: term.height - 3,
      width: rightWidth, value, placeholder: 'Messaggio…', noEmpty: true,
      keyBindings: { ...kit.InlineInput.prototype.keyBindings, TAB: undefined, CTRL_R: undefined },
    });
    input.on('submit', (text: string) => { void send(text); });
    new kit.TextBox({ parent: doc, x: 1, y: term.height - 3, width: side - 2,
      height: 1, content: '↑↓ scegli · Invio apri',
      textAttr: { color: 'gray' } });
    new kit.TextBox({ parent: doc, x: 1, y: term.height - 1, width: term.width - 2,
      height: 1, content: ' Tab pannelli · ^N nuova · ^R aggiorna · ^L altre · ^Q esci',
      textAttr: { color: 'gray' } });
    renderMenu(sideFocused);
    if (!sideFocused) doc.giveFocusTo(input);
  }

  async function loadPreviews(items: readonly ConversationItem[]): Promise<void> {
    let index = 0;
    await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
      while (index < items.length && !closed) {
        const item = items[index++];
        if (!item) continue;
        let text = item.id.slice(0, 8);
        try { text = label((await backend.history(item.id)).turns[0]?.text ?? text); }
        catch { /* An unavailable history keeps the selectable ID fallback. */ }
        const entry = entries.find(entry => entry.id === item.id);
        if (entry) entry.label = text;
        if (currentId === item.id && currentLabel === item.id.slice(0, 8)) currentLabel = text;
        renderMenu();
      }
    }));
  }

  async function loadList(more = false): Promise<void> {
    if (busy || closed) return;
    try {
      const page = await backend.list(more ? nextCursor ?? undefined : undefined);
      if (!more) entries.length = 0;
      for (const item of page.items) {
        if (!entries.some(entry => entry.id === item.id)) entries.push({ id: item.id, label: item.id.slice(0, 8) });
      }
      nextCursor = page.nextCursor;
      status = more ? 'Altre conversazioni caricate.' : 'Conversazioni aggiornate.';
      renderMenu();
      renderStatus();
      await loadPreviews(page.items);
    } catch (error) { status = `Errore elenco: ${errorText(error)}`; renderStatus(); }
  }

  async function openChat(id: string): Promise<void> {
    if (busy || closed) return;
    if (id === '__draft') { newChat(); return; }
    try {
      const detail = await backend.history(id);
      currentId = id;
      currentLabel = label(detail.turns[0]?.text ?? id.slice(0, 8));
      history = detail;
      localTurn = null;
      status = 'Chat aperta.';
      buildScreen('', true);
    } catch (error) { status = `Errore apertura: ${errorText(error)}`; renderStatus(); }
  }

  function newChat(): void {
    if (busy) return;
    currentId = null;
    currentLabel = 'Nuova chat';
    history = null;
    localTurn = null;
    status = 'Nuova chat pronta.';
    buildScreen('', true);
  }

  async function send(text: string): Promise<void> {
    if (busy || closed || !text.trim()) return;
    const target = currentId;
    busy = true;
    input?.setValue('');
    input.disabled = true;
    if (!target) currentLabel = label(text);
    header?.setContent(label(currentLabel, term.width - side - 4));
    localTurn = { text, answer: '', status: 'streaming' };
    status = 'Ambrogio sta rispondendo…';
    renderMenu(); renderChat(); renderStatus();
    try {
      const result: TurnResult = await backend.send(text, target, delta => {
        if (localTurn) localTurn.answer += delta;
        renderChat();
      });
      if (result.conversationId) {
        currentId = result.conversationId;
        const known = entries.find(entry => entry.id === currentId);
        if (known) known.label = currentLabel;
        else entries.unshift({ id: currentId, label: currentLabel });
      }
      if (localTurn) {
        localTurn.status = result.status;
        localTurn.answer = result.status === 'interrupted' ? '' : result.status === 'answered' ? result.answer : result.error;
      }
      status = result.status === 'answered' ? 'Risposta conservata.' :
        result.status === 'failed' ? 'Il turno è terminato con errore.' : 'Risposta interrotta. Aggiorna manualmente.';
      if (currentId) {
        try { history = await backend.history(currentId); localTurn = null; }
        catch { /* Keep the local outcome until manual refresh. */ }
      }
    } catch (error) {
      if (localTurn) { localTurn.status = 'failed'; localTurn.answer = errorText(error); }
      status = 'Invio non riuscito.';
    } finally {
      busy = false;
      if (closed) return;
      if (input) input.disabled = false;
      renderMenu(); renderChat(); renderStatus();
      if (input) doc.giveFocusTo(input);
    }
  }

  function close(): void {
    if (closed) return;
    closed = true;
    if (resizeTimer) clearTimeout(resizeTimer);
    term.off('resize', onResize);
    doc?.destroy();
    doc = menu = chat = input = header = statusBox = undefined;
    term.grabInput(false);
    term.fullscreen(false);
    finish();
  }

  function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => buildScreen(input?.getValue() ?? ''), 35);
  }

  term.fullscreen(true);
  buildScreen();
  term.on('resize', onResize);
  void loadList();
  try { await done; }
  finally {
    if (!closed) close();
    await backend.close();
  }
}

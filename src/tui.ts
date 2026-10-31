import terminalKit from 'terminal-kit';
import { AmbrogioBackend, textRejection, type ClientIdentity, type Conversation, type ConversationItem, type TurnResult } from './backend.js';
import type { Texts } from './i18n.js';

// The document widgets in Terminal Kit 3 are absent from @types/terminal-kit.
const kit: any = terminalKit;
const term = terminalKit.terminal;

type Entry = { id: string; label: string };
type LocalTurn = { text: string; answer: string; status: 'streaming' | 'answered' | 'failed' | 'interrupted' };
/**
 * A chat as the right panel shows it. While `sending`, a turn of this chat waits for its outcome and the
 * chat accepts no other turn; the person can still move to another chat and send there.
 */
type ChatView = { id: string | null; label: string; history: Conversation | null; localTurn: LocalTurn | null;
  sending: boolean };

function label(value: string, width = 52): string {
  const clean = value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > width ? `${clean.slice(0, width - 1)}…` : clean;
}

function errorText(value: unknown): string { return value instanceof Error ? value.message : String(value); }

export async function runTerminalChat(url: URL, identity: ClientIdentity, t: Texts): Promise<void> {
  const backend = new AmbrogioBackend(url, identity, t);
  const entries: Entry[] = [];
  const draft = (): ChatView => ({ id: null, label: t.newChat, history: null, localTurn: null, sending: false });
  let view = draft();
  /** The chats with a turn waiting for its outcome, the current one included. */
  const sending = new Set<ChatView>();
  let nextCursor: string | null = null;
  let closed = false;
  let status = t.loading;
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
    return [{ id: view.id ?? '__draft', label: view.label },
      ...entries.filter(entry => entry.id !== view.id)];
  }

  function conversationText(): string {
    const lines: string[] = [];
    const { history, localTurn } = view;
    for (const turn of history?.turns ?? []) {
      lines.push(t.you(turn.text));
      switch (turn.status) {
        case 'pending': lines.push(t.pendingReopened); break;
        case 'answered': lines.push(`Ambrogio: ${turn.answer}`); break;
        case 'failed': lines.push(t.error(turn.error ?? '')); break;
        case 'interrupted': lines.push(t.interruptedStored); break;
      }
      lines.push('');
    }
    if (localTurn) {
      lines.push(t.you(localTurn.text));
      if (localTurn.status === 'streaming') lines.push(localTurn.answer ? `Ambrogio: ${localTurn.answer}` : t.streaming);
      else if (localTurn.status === 'answered') lines.push(`Ambrogio: ${localTurn.answer}`);
      else if (localTurn.status === 'failed') lines.push(t.error(localTurn.answer));
      else lines.push(t.interruptedLocal);
    }
    return lines.join('\n') || t.emptyChat;
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
    if (keepFocus) menu.focusValue(selected ?? view.id ?? '__draft');
  }

  function onKey(key: string): void {
    if (key === 'CTRL_Q' || key === 'CTRL_C') close();
    else if (key === 'TAB') {
      const inMenu = Boolean(menu && doc?.focusElement && menu.isAncestorOf(doc.focusElement));
      if (inMenu) doc.giveFocusTo(input);
      else menu?.focusValue(view.id ?? '__draft');
    }
    else if (key === 'CTRL_N') newChat();
    else if (key === 'CTRL_R') {
      void loadList(false);
      if (view.id) void openChat(view.id);
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
      new kit.TextBox({ parent: doc, x: 1, y: 1, width: Math.max(1, term.width - 2),
        height: Math.max(1, term.height - 2), content: t.terminalTooSmall, lineWrap: true, wordWrap: true });
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
      content: label(view.label, rightWidth), textAttr: { color: 'cyan', bold: true } });
    statusBox = new kit.TextBox({ parent: doc, x: right, y: 1, width: rightWidth,
      height: 1, content: ` ${status}`, textAttr: { color: 'gray' } });
    chat = new kit.TextBox({ parent: doc, x: right, y: 3, width: rightWidth,
      height: term.height - 7, content: conversationText(), scrollable: true,
      lineWrap: true, wordWrap: true });
    chat.scrollToBottom();
    new kit.TextBox({ parent: doc, x: right, y: term.height - 4, width: rightWidth,
      height: 1, content: t.inputLabel, textAttr: { color: 'gray' } });
    input = new kit.InlineInput({ parent: doc, x: right, y: term.height - 3,
      width: rightWidth, value, placeholder: t.inputPlaceholder, noEmpty: false,
      keyBindings: { ...kit.InlineInput.prototype.keyBindings, TAB: undefined, CTRL_R: undefined },
    });
    input.disabled = view.sending;
    input.on('submit', (text: string) => { void send(text); });
    new kit.TextBox({ parent: doc, x: 1, y: term.height - 3, width: side - 2,
      height: 1, content: t.sideKeys,
      textAttr: { color: 'gray' } });
    new kit.TextBox({ parent: doc, x: 1, y: term.height - 1, width: term.width - 2,
      height: 1, content: t.keys,
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
        if (view.id === item.id && view.label === item.id.slice(0, 8)) view.label = text;
        renderMenu();
      }
    }));
  }

  async function loadList(more = false): Promise<void> {
    if (closed) return;
    try {
      const page = await backend.list(more ? nextCursor ?? undefined : undefined);
      if (!more) entries.length = 0;
      for (const item of page.items) {
        if (!entries.some(entry => entry.id === item.id)) entries.push({ id: item.id, label: item.id.slice(0, 8) });
      }
      nextCursor = page.nextCursor;
      status = more ? t.moreLoaded : t.listRefreshed;
      renderMenu();
      renderStatus();
      await loadPreviews(page.items);
    } catch (error) { status = t.listError(errorText(error)); renderStatus(); }
  }

  async function openChat(id: string): Promise<void> {
    if (closed) return;
    if (id === '__draft') { newChat(); return; }
    // A chat whose turn is still being answered is shown as it is, with its input disabled.
    const answering = [...sending].find(chat => chat.id === id);
    if (answering) {
      view = answering;
      status = t.answering;
      buildScreen('', true);
      return;
    }
    try {
      const detail = await backend.history(id);
      if (closed) return;
      view = { id, label: label(detail.turns[0]?.text ?? id.slice(0, 8)), history: detail, localTurn: null,
        sending: false };
      status = t.chatOpened;
      buildScreen('', true);
    } catch (error) { status = t.openError(errorText(error)); renderStatus(); }
  }

  function newChat(): void {
    view = draft();
    status = t.newChatReady;
    buildScreen('', true);
  }

  /** Records the conversation of a chat in the sidebar list, keeping the chat's label. */
  function remember(chat: ChatView, id: string): void {
    chat.id = id;
    const known = entries.find(entry => entry.id === id);
    if (known) known.label = chat.label;
    else entries.unshift({ id, label: chat.label });
  }

  async function send(text: string): Promise<void> {
    const chat = view;
    // One turn at a time per chat: while a turn of this chat waits for its outcome, nothing else is sent.
    if (chat.sending || closed) return;
    // A text that cannot be sent stays in the input field; the status line shows why.
    const rejection = textRejection(text, t);
    if (rejection) { status = rejection; renderStatus(); return; }
    const target = chat.id;
    chat.sending = true;
    sending.add(chat);
    input?.setValue('');
    if (input) input.disabled = true;
    if (!target) chat.label = label(text);
    header?.setContent(label(chat.label, term.width - side - 4));
    chat.localTurn = { text, answer: '', status: 'streaming' };
    status = t.answering;
    renderMenu(); renderChat(); renderStatus();
    // The person can move to another chat while this one is answered: only the shown chat is drawn.
    const shown = () => chat === view && !closed;
    try {
      const result: TurnResult = await backend.send(text, target, delta => {
        if (chat.localTurn) chat.localTurn.answer += delta;
        if (shown()) renderChat();
      }, id => { remember(chat, id); if (!closed) renderMenu(); });
      if (result.conversationId) remember(chat, result.conversationId);
      if (chat.localTurn) {
        chat.localTurn.status = result.status;
        chat.localTurn.answer = result.status === 'interrupted' ? '' : result.status === 'answered' ? result.answer : result.error;
      }
      if (shown()) {
        status = result.status === 'answered' ? t.answerSaved :
          result.status === 'failed' ? t.turnFailed : t.turnInterrupted;
      }
      if (chat.id && shown()) {
        try { chat.history = await backend.history(chat.id); chat.localTurn = null; }
        catch { /* Keep the local outcome until manual refresh. */ }
      }
    } catch (error) {
      if (chat.localTurn) { chat.localTurn.status = 'failed'; chat.localTurn.answer = errorText(error); }
      if (shown()) status = t.sendFailed;
    } finally {
      chat.sending = false;
      sending.delete(chat);
      if (!closed) {
        renderMenu();
        if (chat === view) {
          if (input) input.disabled = false;
          renderChat(); renderStatus();
          if (input) doc.giveFocusTo(input);
        }
      }
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

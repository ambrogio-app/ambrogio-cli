/** Interface languages and the text catalogue of the terminal client. */
export type Language = 'it' | 'en';

export function isLanguage(value: string): value is Language { return value === 'it' || value === 'en'; }

/** The language of the system locale: the first non-empty of LC_ALL, LC_MESSAGES and LANG. */
export function systemLanguage(environment: NodeJS.ProcessEnv): Language {
  const locale = [environment.LC_ALL, environment.LC_MESSAGES, environment.LANG].find(value => value);
  return locale?.startsWith('it') ? 'it' : 'en';
}

export type LanguageChoice = { language: Language; invalid: boolean };

/**
 * The interface language from `--language`, then `AMBROGIO_LANGUAGE`, then the system locale.
 * An unsupported value is reported as invalid; `language` is then the one chosen without it.
 */
export function interfaceLanguage(option: string | undefined, environment: NodeJS.ProcessEnv): LanguageChoice {
  const variable = environment.AMBROGIO_LANGUAGE || undefined;
  const fallback = variable !== undefined && isLanguage(variable) ? variable : systemLanguage(environment);
  if (option !== undefined) {
    return isLanguage(option) ? { language: option, invalid: false } : { language: fallback, invalid: true };
  }
  return { language: fallback, invalid: variable !== undefined && !isLanguage(variable) };
}

export type Texts = {
  usage: string;
  invalidOptions: string;
  missingUrl: string;
  emptyClientId: string;
  notInteractive: string;
  clientName: (host: string) => string;
  newChat: string;
  loading: string;
  emptyChat: string;
  terminalTooSmall: string;
  inputLabel: string;
  inputPlaceholder: string;
  sideKeys: string;
  keys: string;
  you: (text: string) => string;
  pendingReopened: string;
  streaming: string;
  error: (detail: string) => string;
  interruptedStored: string;
  interruptedLocal: string;
  listRefreshed: string;
  moreLoaded: string;
  listError: (detail: string) => string;
  chatOpened: string;
  openError: (detail: string) => string;
  newChatReady: string;
  answering: string;
  answerSaved: string;
  turnFailed: string;
  turnInterrupted: string;
  sendFailed: string;
  invalidUrl: string;
  urlNotAllowed: string;
  invalidJson: string;
  httpError: (status: number) => string;
  conversationNotFound: string;
  invalidList: string;
  invalidListEntry: string;
  invalidHistory: string;
  invalidHistoryTurn: string;
  invalidTurnAnswer: string;
  invalidTurnError: string;
  cannotConnect: string;
  turnError: string;
  turnRejected: string;
  protocolError: (detail: string | undefined) => string;
  emptyMessage: string;
  messageTooLarge: string;
};

export const texts: Record<Language, Texts> = {
  it: {
    usage: 'Uso: pnpm start --server http://host:porta [--client-id identificativo] [--language it|en]\n'
      + 'Oppure imposta AMBROGIO_URL, AMBROGIO_CLIENT_ID e AMBROGIO_LANGUAGE.\n',
    invalidOptions: 'Opzioni non valide.',
    missingUrl: 'Indica l’URL del backend.',
    emptyClientId: 'L’identificativo del client non può essere vuoto.',
    notInteractive: 'Apri il client in un terminale interattivo.',
    clientName: host => `Terminale ${host}`,
    newChat: 'Nuova chat',
    loading: 'Caricamento conversazioni…',
    emptyChat: 'Scrivi un messaggio per iniziare questa chat.',
    terminalTooSmall: 'Allarga il terminale ad almeno 70 colonne e 14 righe.\nLa chat corrente resta aperta.',
    inputLabel: 'Scrivi un messaggio e premi Invio',
    inputPlaceholder: 'Messaggio…',
    sideKeys: '↑↓ scegli · Invio apri',
    keys: ' Tab pannelli · ^N nuova · ^R aggiorna · ^L altre · ^Q esci',
    you: text => `Tu: ${text}`,
    pendingReopened: 'Ambrogio: In elaborazione. Aggiorna manualmente più tardi.',
    streaming: 'Ambrogio: In elaborazione…',
    error: detail => `Errore: ${detail}`,
    interruptedStored: 'Risposta interrotta.',
    interruptedLocal: 'Risposta interrotta. Aggiorna manualmente più tardi.',
    listRefreshed: 'Conversazioni aggiornate.',
    moreLoaded: 'Altre conversazioni caricate.',
    listError: detail => `Errore elenco: ${detail}`,
    chatOpened: 'Chat aperta.',
    openError: detail => `Errore apertura: ${detail}`,
    newChatReady: 'Nuova chat pronta.',
    answering: 'Ambrogio sta rispondendo…',
    answerSaved: 'Risposta conservata.',
    turnFailed: 'Il turno è terminato con errore.',
    turnInterrupted: 'Risposta interrotta. Aggiorna manualmente.',
    sendFailed: 'Invio non riuscito.',
    invalidUrl: 'URL del backend non valido.',
    urlNotAllowed: 'L’URL del backend deve essere HTTP(S), senza credenziali, query o frammento.',
    invalidJson: 'Risposta JSON del backend non valida.',
    httpError: status => `Errore HTTP ${status}.`,
    conversationNotFound: 'Conversazione non trovata.',
    invalidList: 'Risposta dell’elenco non valida.',
    invalidListEntry: 'Voce dell’elenco non valida.',
    invalidHistory: 'Risposta dello storico non valida.',
    invalidHistoryTurn: 'Turno dello storico non valido.',
    invalidTurnAnswer: 'Risposta del turno non valida.',
    invalidTurnError: 'Errore del turno non valido.',
    cannotConnect: 'Impossibile collegarsi al backend.',
    turnError: 'Errore del turno.',
    turnRejected: 'Turno rifiutato.',
    protocolError: detail => `Errore del protocollo: ${detail ?? 'messaggio non valido.'}`,
    emptyMessage: 'Scrivi un messaggio non vuoto.',
    messageTooLarge: 'Messaggio troppo grande (massimo 64 KiB).',
  },
  en: {
    usage: 'Usage: pnpm start --server http://host:port [--client-id identifier] [--language it|en]\n'
      + 'Or set AMBROGIO_URL, AMBROGIO_CLIENT_ID and AMBROGIO_LANGUAGE.\n',
    invalidOptions: 'Invalid options.',
    missingUrl: 'Specify the backend URL.',
    emptyClientId: 'The client identifier must not be empty.',
    notInteractive: 'Open the client in an interactive terminal.',
    clientName: host => `Terminal ${host}`,
    newChat: 'New chat',
    loading: 'Loading conversations…',
    emptyChat: 'Write a message to start this chat.',
    terminalTooSmall: 'Enlarge the terminal to at least 70 columns and 14 rows.\nThe current chat stays open.',
    inputLabel: 'Type a message and press Enter',
    inputPlaceholder: 'Message…',
    sideKeys: '↑↓ select · Enter open',
    keys: ' Tab panels · ^N new · ^R refresh · ^L more · ^Q quit',
    you: text => `You: ${text}`,
    pendingReopened: 'Ambrogio: In progress. Refresh manually later.',
    streaming: 'Ambrogio: In progress…',
    error: detail => `Error: ${detail}`,
    interruptedStored: 'Response interrupted.',
    interruptedLocal: 'Response interrupted. Refresh manually later.',
    listRefreshed: 'Conversations refreshed.',
    moreLoaded: 'More conversations loaded.',
    listError: detail => `List error: ${detail}`,
    chatOpened: 'Chat opened.',
    openError: detail => `Error opening chat: ${detail}`,
    newChatReady: 'New chat ready.',
    answering: 'Ambrogio is answering…',
    answerSaved: 'Answer saved.',
    turnFailed: 'The turn ended with an error.',
    turnInterrupted: 'Response interrupted. Refresh manually.',
    sendFailed: 'Sending failed.',
    invalidUrl: 'Invalid backend URL.',
    urlNotAllowed: 'The backend URL must be HTTP(S), without credentials, query or fragment.',
    invalidJson: 'Invalid JSON response from the backend.',
    httpError: status => `HTTP error ${status}.`,
    conversationNotFound: 'Conversation not found.',
    invalidList: 'Invalid list response.',
    invalidListEntry: 'Invalid list entry.',
    invalidHistory: 'Invalid history response.',
    invalidHistoryTurn: 'Invalid history turn.',
    invalidTurnAnswer: 'Invalid turn answer.',
    invalidTurnError: 'Invalid turn error.',
    cannotConnect: 'Cannot connect to the backend.',
    turnError: 'Turn error.',
    turnRejected: 'Turn rejected.',
    protocolError: detail => `Protocol error: ${detail ?? 'invalid message.'}`,
    emptyMessage: 'Write a non-empty message.',
    messageTooLarge: 'Message too large (maximum 64 KiB).',
  },
};

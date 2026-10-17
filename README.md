# ambrogio-cli

Client conversazionale da terminale per Ambrogio. Questo repository possiede il modello Reqvire e le decisioni tecniche del client; il backend risiede in [`ambrogio-backend`](https://github.com/adrianofoschi/ambrogio-backend) e possiede il protocollo conversazionale `ambrogio.v1` e le API HTTP pubbliche.

## Stato

Il client TypeScript per Node.js 22 o successivo si avvia dal checkout con npm in un terminale interattivo di almeno 70 colonne e 14 righe. Terminal Kit mantiene l'elenco delle chat a sinistra e la conversazione corrente con il campo di scrittura a destra. All'avvio è selezionata «Nuova chat»; dopo il primo invio prende il nome dal primo messaggio. Le altre voci mostrano l'anteprima del primo messaggio caricata dagli storici HTTP pubblici. La conversazione rimane aperta durante i turni e la risposta progressiva. I turni viaggiano su una sessione WebSocket `ambrogio.v1` (`/api/session`), aperta al primo invio con il `WebSocket` integrato in Node.js; elenco e storico usano le GET HTTP.

La compatibilità con il backend è registrata in [`system-model/Contracts/TerminalConversation.md`](system-model/Contracts/TerminalConversation.md). Prima di implementare o aggiornare il client, controllare la versione di backend indicata lì e verificare protocollo e contratti HTTP con una prova di integrazione.

## Avvio

Con una versione di Node.js mantenuta, dalla radice del repository:

```bash
npm ci
npm run build
npm start -- --server http://127.0.0.1:3000
```

In alternativa, impostare `AMBROGIO_URL` e avviare con `npm start`. L'opzione `--server` prevale sulla variabile. Il client si presenta al backend come `cli-<nome host>`; per cambiarlo usare `--client-id` oppure `AMBROGIO_CLIENT_ID` (l'opzione prevale). Non esiste un URL predefinito. L'URL deve indicare la radice HTTP del backend (eventualmente sotto un prefisso di percorso). Scrivere nel campo a destra e premere Invio per inviare. `Tab` passa tra scrittura ed elenco; nell'elenco le frecce scelgono una chat e Invio la apre. `Ctrl+N` apre una nuova chat, `Ctrl+R` aggiorna elenco e chat corrente, `Ctrl+L` carica la pagina successiva e `Ctrl+Q` esce.

## Prove

```bash
npm test
npm run test:backend
```

`npm test` usa un backend locale controllato (HTTP e WebSocket `ambrogio.v1`) e una pseudo console (`script`, da util-linux) per verificare protocollo e schermata interattiva. `npm run test:backend` avvia il processo server completo del repository `ambrogio-backend` al commit `f262e924f7fdaa6635c0f4486f5aec1aa484e0a3`, che valida i messaggi con lo schema del protocollo. Avvia la CLI in un processo separato, usa un archivio SQLite temporaneo e un produttore di risposta controllato; verifica nuova chat, riapertura dalla barra laterale, prosecuzione, risposta progressiva, errore conservato, rifiuti, passaggio da `pending` ad `answered` e interruzione all'arresto. Per questa prova, il checkout backend deve essere al commit indicato, avere le dipendenze installate ed essere già compilato; per impostazione predefinita si trova in `../ambrogio-backend`, oppure nel percorso indicato da `AMBROGIO_BACKEND_REPO`. Il produttore reale basato su LLM e gli agenti MCP esterni non sono coinvolti in questi test automatici.

## Modello

Eseguire Reqvire dalla radice Git di questo repository. CLI e MCP leggono lo stesso modello Markdown; per la modalità MCP con mutazioni serve un worktree pulito e un branch con almeno un commit.

```bash
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" validate
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" lint
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" mcp --port 8083 --enable-mutations
```

L'endpoint MCP è `http://127.0.0.1:8083/mcp`. Vedere [`AGENTS.md`](AGENTS.md) per le regole di sviluppo e la separazione dal repository backend.

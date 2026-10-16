# ambrogio-cli

Client conversazionale da terminale per Ambrogio. Questo repository possiede il modello Reqvire e le decisioni tecniche del client; il backend risiede in [`ambrogio-app`](https://github.com/adrianofoschi/ambrogio-app) e possiede il contratto HTTP pubblico.

## Stato

Il modello iniziale trasferisce gli obblighi del client già decisi: invio dei turni via HTTP, lettura della risposta progressiva SSE, gestione degli errori, elenco e riapertura delle conversazioni. Il client eseguibile non è ancora implementato. Sono stati scelti TypeScript, Node.js e un'interazione testuale a prompt semplice; i dettagli di distribuzione e configurazione vanno definiti nel modello prima dell'implementazione.

La compatibilità con il backend è registrata in [`system-model/Contracts/TerminalConversation.md`](system-model/Contracts/TerminalConversation.md). Prima di implementare o aggiornare il client, controllare la versione di backend indicata lì e verificare i contratti HTTP con una prova di integrazione.

## Modello

Eseguire Reqvire dalla radice Git di questo repository. CLI e MCP leggono lo stesso modello Markdown; per la modalità MCP con mutazioni serve un worktree pulito e un branch con almeno un commit.

```bash
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" validate
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" lint
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" mcp --port 8083 --enable-mutations
```

L'endpoint MCP è `http://127.0.0.1:8083/mcp`. Vedere [`AGENTS.md`](AGENTS.md) per le regole di sviluppo e la separazione dal repository backend.

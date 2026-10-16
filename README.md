# ambrogio-cli

Client conversazionale da terminale per Ambrogio. Questo repository possiede il modello Reqvire e le decisioni tecniche del client; il backend risiede in [`ambrogio-app`](https://github.com/adrianofoschi/ambrogio-app) e possiede il contratto HTTP pubblico.

## Stato

Il client TypeScript per Node.js si avvia dal checkout con npm. Offre un menu numerico per iniziare una chat, inviare altri turni, consultare l'elenco paginato, aprire lo storico e aggiornare manualmente una conversazione. Durante un turno mostra i frammenti della risposta sul terminale; un errore o una disconnessione sostituiscono l'anteprima con il relativo esito.

La compatibilità con il backend è registrata in [`system-model/Contracts/TerminalConversation.md`](system-model/Contracts/TerminalConversation.md). Prima di implementare o aggiornare il client, controllare la versione di backend indicata lì e verificare i contratti HTTP con una prova di integrazione.

## Avvio

Con una versione di Node.js mantenuta, dalla radice del repository:

```bash
npm ci
npm run build
npm start -- --server http://127.0.0.1:3000
```

In alternativa, impostare `AMBROGIO_URL` e avviare con `npm start`. L'opzione `--server` prevale sulla variabile. Non esiste un URL predefinito. L'URL deve indicare la radice HTTP del backend (eventualmente sotto un prefisso di percorso). Il menu usa `1` per una nuova chat, `2` per l'elenco, `3` per la pagina successiva, `4` per aprire una conversazione, `5` per aggiornare la vista corrente, `6` per inviare un turno nella conversazione aperta e `0` per uscire.

## Prove

```bash
npm test
npm run test:backend
```

`npm test` usa un server HTTP locale per verificare protocollo e menu. `npm run test:backend` esercita gli adapter HTTP reali del repository `ambrogio-app` al commit `3f789c61815ca82eed87a67c91304fb1e6123805` con casi d'uso controllati. Per questa prova, il checkout backend deve essere al commit indicato, avere le dipendenze installate ed essere già compilato; per impostazione predefinita si trova in `../ambrogio-app`, oppure nel percorso indicato da `AMBROGIO_BACKEND_REPO`. Client e adapter comunicano tramite HTTP; la prova non avvia il backend completo con servizi esterni.

## Modello

Eseguire Reqvire dalla radice Git di questo repository. CLI e MCP leggono lo stesso modello Markdown; per la modalità MCP con mutazioni serve un worktree pulito e un branch con almeno un commit.

```bash
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" validate
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" lint
npx -y @reqvire-org/reqvire@1.3.2 --workspace "$PWD" mcp --port 8083 --enable-mutations
```

L'endpoint MCP è `http://127.0.0.1:8083/mcp`. Vedere [`AGENTS.md`](AGENTS.md) per le regole di sviluppo e la separazione dal repository backend.

# Elements

### Anteprima delle conversazioni nella barra laterale

Quando il client mostra una pagina dell'elenco conversazioni, deve presentare per ogni conversazione visibile un'anteprima del primo messaggio della persona ottenuta dallo storico HTTP pubblico; se uno storico non è disponibile, deve mantenere selezionabile la conversazione mostrando un identificativo abbreviato.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Client conversazionale nel terminale

Ambrogio deve fornire alla famiglia un client di chat testuale utilizzabile dal terminale, collegato al backend tramite il protocollo conversazionale `ambrogio.v1` e le API HTTP pubbliche di consultazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Compatibilità con l'API conversazionale del backend

Quando il client terminale comunica con il backend Ambrogio, deve usare il protocollo conversazionale e le API HTTP pubbliche della versione di backend dichiarata come dipendenza, senza accedere ai file o ai moduli interni del server.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Controllo dei segreti prima del commit

Quando si crea un commit in un clone del repository con gli hook versionati attivi, il controllo pre-commit deve scansionare con gitleaks le modifiche in staging e deve impedire il commit se rileva un segreto oppure se gitleaks non è disponibile.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti con gitleaks](../Contracts/TerminalConversation.md#profilo-di-scansione-dei-segreti-con-gitleaks)

#### Relations
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Identificazione del client terminale nella sessione

Quando il client apre la sessione conversazionale, deve presentarsi al backend con un identificativo di client stabile e un nome leggibile, configurabili all'avvio e con un valore predefinito ricavato dalla macchina.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Invio del turno sul canale conversazionale

Quando la famiglia invia un turno testuale dal client terminale, il client deve trasmetterlo al backend come richiesta testuale del protocollo conversazionale `ambrogio.v1`, chiedendo la risposta in testo e indicando la conversazione corrente quando la continua.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)
  * [Sessione ambrogio.v1 del client terminale](../Contracts/TerminalConversation.md#sessione-ambrogiov1-del-client-terminale)

#### Relations
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Invito ad aggiornare la conversazione in elaborazione

Quando una conversazione riaperta nel client della chat testuale mostra un turno «In elaborazione», il client deve invitare la persona ad aggiornare manualmente la consultazione più tardi per consultarne l'esito.

#### Metadata
  * type: requirement

#### Contract References
  * [Stati del turno testuale alla riapertura](../Contracts/TerminalConversation.md#stati-del-turno-testuale-alla-riapertura)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Navigazione della chat nella schermata persistente

Quando la persona passa all'elenco o apre una conversazione, il client deve consentire di scegliere una chat con la tastiera e mostrarne lo storico nel pannello destro, mantenendo disponibile il campo di scrittura per continuare quella chat senza tornare a un menu.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Nuova chat iniziale nella barra laterale

All'avvio del client, il client deve aprire una nuova chat locale come conversazione corrente e mostrarla come prima voce della barra laterale; dopo l'invio del primo messaggio, deve usare l'anteprima di quel messaggio come nome della voce e continuare a mostrare la stessa chat nel pannello destro.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Presentazione del rifiuto del turno

Quando il client terminale riceve `turn.rejected` per un turno, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno nella chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Presentazione dell'errore dopo l'ammissione

Quando il client terminale riceve `turn.failed` per un turno ammesso, deve mostrare il messaggio pubblico contenuto in `message` come esito di errore del turno nella conversazione, sostituendo gli eventuali frammenti di risposta già mostrati per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Repository autonomo del client terminale

Il client terminale deve essere sviluppato e versionato nel repository `ambrogio-cli`, con workspace Reqvire canonico alla propria radice e decisioni tecniche del client registrate nel proprio modello.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [README.md](../../README.md)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Riconoscimento del completamento della risposta testuale

Quando un turno della chat testuale si conclude, il client deve considerare la risposta completata correttamente soltanto se ha ricevuto `turn.completed` per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Segnalazione locale dell'interruzione della chat testuale

Quando la sessione conversazionale si chiude prima dell'esito di un turno, oppure il backend comunica `turn.interrupted`, il client deve mostrare lo stato locale «Risposta interrotta» senza trasformare automaticamente l'interruzione in uno scambio di errore conservato.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * derivedFrom: [Riconoscimento del completamento della risposta testuale](#riconoscimento-del-completamento-della-risposta-testuale)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Ripartenza dell'elenco conversazioni dopo un aggiornamento

Quando il client della chat testuale aggiorna l'elenco delle conversazioni conservate, deve scartare il riferimento alla pagina successiva della consultazione precedente e richiedere la prima pagina dell'elenco corrente.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Scansione dei segreti nella CI

Quando viene eseguito un push su qualunque branch o viene proposta una pull request, la CI del repository deve scansionare con gitleaks l'intera storia Git del client e deve fallire se rileva un segreto, senza riportarne il valore nell'output.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stack del client terminale

Il client terminale deve essere implementato in TypeScript per Node.js e offrire una schermata conversazionale persistente a due pannelli mediante Terminal Kit.

#### Metadata
  * type: requirement

#### Contract References
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [package.json](../../package.json)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stato del turno in elaborazione alla riapertura

Quando la famiglia consulta tramite un client della chat testuale una conversazione con un turno testuale accettato il cui esito non è ancora conservato, Ambrogio deve mostrare quel turno come «In elaborazione»; a una nuova consultazione dopo la conservazione dell'esito deve mostrare lo scambio concluso.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Vista persistente della conversazione

Quando il client è attivo in un terminale interattivo, deve mostrare l'elenco delle conversazioni a sinistra e la conversazione corrente a destra, mantenendo visibili la conversazione e il campo di scrittura mentre la persona compone, invia e riceve un turno.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---


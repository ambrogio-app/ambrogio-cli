# Elements

### Client conversazionale nel terminale

Ambrogio deve fornire alla famiglia un client di chat testuale utilizzabile dal terminale, collegato al backend tramite le API HTTP conversazionali del prodotto.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratto HTTP del backend Ambrogio](../Contracts/TerminalConversation.md#contratto-http-del-backend-ambrogio)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Compatibilità con l'API conversazionale del backend

Quando il client terminale comunica con il backend Ambrogio, deve usare il contratto HTTP pubblico della versione di backend dichiarata come dipendenza, senza accedere ai file o ai moduli interni del server.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Invio HTTP del turno della chat testuale

Quando la famiglia invia un turno testuale da un client della chat testuale, il client deve trasmettere il turno al backend mediante una richiesta HTTP POST.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Invito ad aggiornare la conversazione in elaborazione

Quando una conversazione riaperta nel client della chat testuale mostra un turno «In elaborazione», il client deve invitare la persona ad aggiornare manualmente la consultazione più tardi per consultarne l'esito.

#### Metadata
  * type: requirement

#### Contract References
  * [Stati del turno testuale alla riapertura](../Contracts/TerminalConversation.md#stati-del-turno-testuale-alla-riapertura)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Presentazione dell'errore HTTP prima del flusso testuale

Quando il client della chat testuale riceve una risposta HTTP di errore in formato JSON prima del flusso SSE, deve mostrare il messaggio pubblico contenuto nel campo `error` come esito di errore del turno nella chat.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratto HTTP del backend Ambrogio](../Contracts/TerminalConversation.md#contratto-http-del-backend-ambrogio)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Presentazione dell'errore del flusso testuale

Quando il client della chat testuale riceve una parte `error` del profilo di trasporto UI, deve mostrare il messaggio pubblico contenuto in `errorText` come esito di errore del turno nella conversazione, sostituendo gli eventuali frammenti di risposta già mostrati per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratto HTTP del backend Ambrogio](../Contracts/TerminalConversation.md#contratto-http-del-backend-ambrogio)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Riconoscimento del completamento della risposta testuale

Quando il flusso di un turno della chat testuale termina, il client deve considerare la risposta completata correttamente soltanto se ha ricevuto la conferma di successo definita dal profilo di trasporto UI.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratto HTTP del backend Ambrogio](../Contracts/TerminalConversation.md#contratto-http-del-backend-ambrogio)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Segnalazione locale dell'interruzione della chat testuale

Quando il flusso di un turno della chat testuale termina senza la conferma di successo né una parte `error` definite dal profilo di trasporto UI, il client deve mostrare lo stato locale «Risposta interrotta» senza trasformare automaticamente la disconnessione in uno scambio di errore conservato.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratto HTTP del backend Ambrogio](../Contracts/TerminalConversation.md#contratto-http-del-backend-ambrogio)

#### Relations
  * derivedFrom: [Riconoscimento del completamento della risposta testuale](#riconoscimento-del-completamento-della-risposta-testuale)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Ripartenza dell'elenco conversazioni dopo un aggiornamento

Quando il client della chat testuale aggiorna l'elenco delle conversazioni conservate, deve scartare il riferimento alla pagina successiva della consultazione precedente e richiedere la prima pagina dell'elenco corrente.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stato del turno in elaborazione alla riapertura

Quando la famiglia consulta tramite un client della chat testuale una conversazione con un turno testuale accettato il cui esito non è ancora conservato, Ambrogio deve mostrare quel turno come «In elaborazione»; a una nuova consultazione dopo la conservazione dell'esito deve mostrare lo scambio concluso.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stack del client terminale

Il client terminale deve essere implementato in TypeScript per Node.js e offrire alla famiglia un'interazione testuale a prompt semplice.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Repository autonomo del client terminale

Il client terminale deve essere sviluppato e versionato nel repository `ambrogio-cli`, con workspace Reqvire canonico alla propria radice e decisioni tecniche del client registrate nel proprio modello.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

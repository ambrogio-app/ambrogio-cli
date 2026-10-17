# Elements

### Avvio locale del client da checkout

La prima versione utilizzabile si avvia dal checkout del repository mediante npm dopo l'installazione delle dipendenze. Il repository contiene script riproducibili per compilare, eseguire test e avviare il client. La distribuzione come pacchetto CLI installabile resta una capacità successiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Contratti pubblici del backend Ambrogio

Il backend `ambrogio-backend` è la fonte autorevole del protocollo conversazionale `ambrogio.v1` e delle rotte HTTP di consultazione. La versione di riferimento è il commit `f262e924f7fdaa6635c0f4486f5aec1aa484e0a3` del backend. Per i turni si consultano i contratti `Sessione del protocollo Ambrogio v1`, `Trasmissione in ingresso del protocollo Ambrogio v1`, `Trasmissione in uscita del protocollo Ambrogio v1`, `Esiti del turno nel protocollo Ambrogio v1`, `Motivi di rifiuto del turno` ed `Errori ed estensioni del protocollo Ambrogio v1` nel [modello del protocollo del backend](https://github.com/adrianofoschi/ambrogio-backend/blob/f262e924f7fdaa6635c0f4486f5aec1aa484e0a3/system-model/Contracts/ConversationProtocol.md), con la forma dei messaggi definita da [`protocol/ambrogio-v1.schema.json`](https://github.com/adrianofoschi/ambrogio-backend/blob/f262e924f7fdaa6635c0f4486f5aec1aa484e0a3/protocol/ambrogio-v1.schema.json) alla stessa revisione. Per la consultazione si usano `Risposta HTTP dell'elenco conversazioni` e `Risposta HTTP dello storico conversazionale` nel [modello dei contratti del backend](https://github.com/adrianofoschi/ambrogio-backend/blob/f262e924f7fdaa6635c0f4486f5aec1aa484e0a3/system-model/Contracts/FamilyConversation.md). Questa revisione sostituisce la precedente `c057ced962b37f7d605c675ffb6da44825d67496`, basata sul profilo SSE ora rimosso dal backend. Messaggi ed endpoint effettivi vanno verificati con prove di integrazione contro la revisione indicata, nelle quali il backend valida i messaggi con lo schema. Un cambiamento di contratto nel backend richiede revisione esplicita di questo modello e delle verifiche del client.

#### Metadata
  * type: source

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Identità del client terminale nella sessione

Decisione concordata il 17 ottobre 2026: il `clientId` inviato con `session.hello` vale per impostazione predefinita `cli-<nome host>` e può essere sostituito con l'opzione di avvio `--client-id` o con la variabile `AMBROGIO_CLIENT_ID`; l'opzione prevale sulla variabile. Il `name` vale `Terminale <nome host>`. Un valore vuoto non è ammesso. L'identità serve al backend per distinguere i client nelle sessioni e resta stabile tra un avvio e l'altro sulla stessa macchina finché la configurazione non cambia.

#### Metadata
  * type: specification

#### Relations
  * define: [Identificazione del client terminale nella sessione](../Requirements/TerminalConversation.md#identificazione-del-client-terminale-nella-sessione)
---

### Indirizzo esplicito del backend

Prima di iniziare l'interazione, il client richiede un URL base HTTP o HTTPS del backend fornito come opzione di avvio o variabile d'ambiente. L'opzione prevale sulla variabile; in assenza di entrambe, l'avvio termina con un'indicazione d'uso. Il client non sceglie un server predefinito. L'URL serve soltanto a costruire gli endpoint HTTP pubblici di consultazione e l'indirizzo WebSocket del canale conversazionale.

#### Metadata
  * type: specification

#### Relations
  * define: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
---

### Schermata conversazionale a due pannelli

Il client usa Terminal Kit per una schermata interattiva persistente. All'avvio una voce locale «Nuova chat» è selezionata come prima voce; non crea una conversazione vuota sul backend. Quando il primo turno è inviato, la voce prende come nome l'anteprima del testo inviato e resta la chat corrente anche durante la risposta. La barra laterale a sinistra mostra le conversazioni paginabili con l'anteprima del primo messaggio della persona, ricavata dagli storici HTTP pubblici delle sole chat visibili. Se il recupero di uno storico fallisce, la voce resta selezionabile con ID abbreviato. Il pannello destro conserva lo storico della chat selezionata, la risposta in generazione e il campo di scrittura per tutta l'interazione; inviare un turno non torna a una schermata di menu. `Tab` sposta il focus tra barra laterale e campo di scrittura; nell'elenco le frecce cambiano selezione e `Invio` apre la chat. La schermata indica i comandi per nuova chat, aggiornamento manuale, pagina successiva e uscita. Al ridimensionamento del terminale il client ricalcola i pannelli; quando lo spazio non consente due pannelli leggibili chiede di allargare il terminale senza perdere la conversazione corrente.

#### Metadata
  * type: specification

#### Relations
  * define: [Vista persistente della conversazione](../Requirements/TerminalConversation.md#vista-persistente-della-conversazione)
---

### Sessione ambrogio.v1 del client terminale

Decisione concordata il 17 ottobre 2026: il client usa il `WebSocket` integrato in Node.js, senza dipendenze aggiuntive per il trasporto; per questo richiede Node.js 22 o successivo. La sessione si connette a `api/session` sotto l'URL base del backend, con schema `ws:` per `http:` e `wss:` per `https:`, offrendo il sottoprotocollo `ambrogio.v1`; dopo `session.hello` attende `session.ready`. Una sola sessione per processo trasporta i turni di tutte le conversazioni; si apre al primo turno e, se si chiude, si riapre al turno successivo.

Ogni turno è una richiesta testuale: `input.start` con `requestId` e `stream` nuovi, `content` `{"type":"text"}`, `reply` `"text"` e `conversationId` quando si continua una conversazione; il testo in un solo `input.chunk`; poi `input.end`. Il client controlla prima dell'invio che il testo non sia vuoto e non superi 64 KiB in UTF-8. Dopo `turn.accepted` il client conserva `conversationId` e `turnId` e mostra, nell'ordine ricevuto, i frammenti `output.chunk` delle trasmissioni del turno. Il turno è riuscito soltanto con `turn.completed`; `turn.failed` e `turn.rejected` concludono il turno con il loro `message`, che sostituisce i frammenti mostrati; `turn.interrupted`, oppure la chiusura della sessione prima dell'esito, concludono localmente il turno come interrotto. Un `session.error` riferito alla richiesta conclude il turno con un errore locale. Il client ignora `expectsReply`, perché il campo di scrittura resta sempre disponibile, e risponde con `client.result`, `ok: false` e `reason: "unsupported"`, a ogni messaggio del server non legato a un turno che contenga `id`. La sessione non trasferisce al client la produzione della risposta o la persistenza del turno.

#### Metadata
  * type: specification

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Stati del turno testuale alla riapertura

Un turno testuale accettato e ancora in elaborazione è distinguibile dagli scambi conclusi quando si consulta la conversazione. Finché l'esito non è conservato, la consultazione lo identifica come `in elaborazione` e lo associa al testo del turno; il client invita la persona ad aggiornare manualmente la consultazione più tardi. Alla successiva consultazione, se l'esito è stato conservato, il client presenta lo scambio concluso con risposta oppure errore e non presenta più per lo stesso turno lo stato `in elaborazione`. La riapertura non riprende le trasmissioni del turno, non recupera i frammenti parziali e non aggiorna automaticamente lo stato mostrato dal client. Dopo un'interruzione del processo, il turno senza esito segue lo stato `interrotto` definito nel contratto degli stati persistenti del turno testuale.

#### Metadata
  * type: state

#### Relations
  * define: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---


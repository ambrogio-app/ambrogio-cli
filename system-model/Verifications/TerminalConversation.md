# Elements

### Verifica del client terminale

Raggruppa le prove del comportamento del client terminale e della sua integrazione con il backend HTTP.

#### Metadata
  * type: verification-objective
---

### Analisi della compatibilità con il backend

Esaminare la revisione di backend dichiarata nel contratto sorgente e confrontare i messaggi `ambrogio.v1` inviati e interpretati dal client, gli esiti e i rifiuti, l'elenco e lo storico con i contratti pubblici e lo schema del protocollo a quella revisione, e con l'esito delle prove di integrazione.

#### Details
L'analisi passa se la revisione è identificata in modo riproducibile e tutti gli usi del protocollo e delle rotte HTTP corrispondono ai contratti, allo schema e alle prove eseguite. Fallisce se la revisione è indefinita, se il client usa ancora il profilo SSE rimosso o se dipende da file o moduli interni del backend.

#### Metadata
  * type: analysis-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Controllo del repository del client

Esaminare il repository Git del client e la configurazione del workspace Reqvire, quindi verificare che modello, decisioni e codice del client siano versionati qui.

#### Details
Il controllo passa se il repository e il modello Reqvire sono autonomi dal backend e le decisioni del client sono tracciate in questo workspace.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Repository autonomo del client terminale](../Requirements/TerminalConversation.md#repository-autonomo-del-client-terminale)
  * verify: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Prova del client conversazionale nel terminale

Avviare il backend e il client terminale come processi distinti, rendendo disponibili al client soltanto il canale conversazionale `ambrogio.v1` e le API HTTP pubbliche del backend. Dal terminale inviare un nuovo turno e osservare una risposta prodotta in più frammenti; consultare le conversazioni conservate e proseguire quella creata, recuperandone lo storico dal backend. Ripetere con un turno rifiutato, per esempio la continuazione di una conversazione occupata, con un errore dopo l'ammissione a risposta già iniziata e con la chiusura della sessione prima dell'esito.

#### Details
La prova passa se la persona può conversare dal terminale, osserva i frammenti durante la generazione e può consultare e continuare una conversazione conservata tramite le interfacce pubbliche. Il turno risulta riuscito soltanto con `turn.completed`; `turn.rejected` e `turn.failed` mostrano il loro messaggio pubblico al posto dei frammenti; la chiusura della sessione o `turn.interrupted` mostrano «Risposta interrotta». Fallisce se il client richiede un'interfaccia grafica, accede direttamente all'archivio o ai componenti server, usa il profilo SSE rimosso, oppure presenta come riuscito un turno privo di `turn.completed`. Gli esiti registrati in precedenza per il profilo SSE non valgono per questa versione della prova; le evidenze vanno raccolte di nuovo contro la revisione di backend dichiarata.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-pinned-backend.mjs](../../scripts/verify-pinned-backend.mjs)
  * satisfiedBy: [backend.test.ts](../../test/backend.test.ts)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
  * verify: [Invio del turno sul canale conversazionale](../Requirements/TerminalConversation.md#invio-del-turno-sul-canale-conversazionale)
  * verify: [Presentazione del rifiuto del turno](../Requirements/TerminalConversation.md#presentazione-del-rifiuto-del-turno)
  * verify: [Presentazione dell'errore dopo l'ammissione](../Requirements/TerminalConversation.md#presentazione-dellerrore-dopo-lammissione)
  * verify: [Riconoscimento del completamento della risposta testuale](../Requirements/TerminalConversation.md#riconoscimento-del-completamento-della-risposta-testuale)
  * verify: [Segnalazione locale dell'interruzione della chat testuale](../Requirements/TerminalConversation.md#segnalazione-locale-dellinterruzione-della-chat-testuale)
---

### Prova dell'identità del client nella sessione

Avviare il client contro un backend controllato senza configurazione dell'identità, poi con `AMBROGIO_CLIENT_ID`, poi con `--client-id` insieme alla variabile; inviare un turno in ciascun caso e osservare `session.hello`. Provare anche un valore vuoto.

#### Details
La prova passa se senza configurazione il `clientId` è `cli-<nome host>` e il `name` è `Terminale <nome host>`, se la variabile sostituisce il valore predefinito e l'opzione prevale sulla variabile, e se un valore vuoto impedisce l'avvio con un'indicazione d'uso. Fallisce se il `clientId` cambia tra avvii con la stessa configurazione o se il client apre una sessione con un identificativo vuoto.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Identificazione del client terminale nella sessione](../Requirements/TerminalConversation.md#identificazione-del-client-terminale-nella-sessione)
---

### Prova dell'invito ad aggiornare la conversazione

Avviare un turno testuale con elaborazione controllabile, chiudere la sessione del client e riaprire la stessa conversazione mentre il turno è ancora in corso. Osservare il client, far conservare al backend l'esito e aggiornare manualmente la consultazione. Ripetere con una risposta completa e con un errore pubblico.

#### Details
La prova passa se la conversazione riaperta mostra il turno «In elaborazione» e invita la persona ad aggiornarla più tardi, senza riprendere le trasmissioni del turno, interrogare periodicamente lo stato o mostrare frammenti temporanei come risposta completa. Prima dell'aggiornamento manuale il client non sostituisce da sé lo stato; dopo l'aggiornamento mostra l'esito conservato corretto senza duplicare il turno né inviarne uno nuovo. Gli esiti registrati in precedenza per il profilo SSE non valgono per questa versione della prova.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Invito ad aggiornare la conversazione in elaborazione](../Requirements/TerminalConversation.md#invito-ad-aggiornare-la-conversazione-in-elaborazione)
---

### Prova della ripartenza dell'elenco aggiornato

Caricare almeno due pagine nel client della chat testuale, poi aggiungere una conversazione o aggiornare l'ultima attività di una conversazione meno recente nell'archivio. Attivare l'aggiornamento dell'elenco e osservare la richiesta successiva e le voci mostrate.

#### Details
La prova passa se il client scarta il riferimento alla vecchia pagina successiva, richiede la prima pagina e presenta l'ordine corrente delle conversazioni, compresa quella nuova o aggiornata. Fallisce se continua dalla pagina della consultazione precedente o tratta le pagine già caricate come una fotografia immutabile. Il test PTY della barra laterale verifica che, dopo la pagina successiva, l'aggiornamento richieda di nuovo la prima pagina senza cursor. Resta da provare il riordino con un archivio reale che cambia durante la consultazione.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Ripartenza dell'elenco conversazioni dopo un aggiornamento](../Requirements/TerminalConversation.md#ripartenza-dellelenco-conversazioni-dopo-un-aggiornamento)
---

### Prova della schermata conversazionale persistente

Avviare il client in un terminale interattivo simulato con un backend HTTP controllato che offre più conversazioni e storici. Verificare che all'avvio sia selezionata «Nuova chat» come prima voce senza chiamata HTTP di creazione e che, dopo il primo invio, la voce mostri l'anteprima del messaggio. Verificare nella stessa schermata la barra laterale e la chat corrente, navigare con `Tab`, frecce e `Invio`, inviare due turni nella stessa chat e ricevere una risposta progressiva. Aggiornare l'elenco e ridimensionare il terminale.

#### Details
La prova passa se la chat e il campo di scrittura restano visibili durante composizione, invio e ricezione, il secondo turno continua la stessa conversazione e l'elenco mostra le anteprime dei primi messaggi ottenute dagli storici pubblici. La nuova chat iniziale resta aperta dopo il primo invio e prende il nome da quel testo; Tab, frecce e Invio aprono la chat scelta. L'aggiornamento riparte dalla prima pagina e il ridimensionamento non perde la chat corrente. Se uno storico non è disponibile, la voce resta selezionabile con ID abbreviato. Il test PTY da 100×30 verifica la schermata, le anteprime, due turni, la navigazione, la pagina successiva e l'aggiornamento. La prova con server completo verifica nuova chat, riapertura e continuazione. Restano da esercitare in test il ridimensionamento, la vista sotto la dimensione minima e il fallback dell'anteprima.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-pinned-backend.mjs](../../scripts/verify-pinned-backend.mjs)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Anteprima delle conversazioni nella barra laterale](../Requirements/TerminalConversation.md#anteprima-delle-conversazioni-nella-barra-laterale)
  * verify: [Navigazione della chat nella schermata persistente](../Requirements/TerminalConversation.md#navigazione-della-chat-nella-schermata-persistente)
  * verify: [Nuova chat iniziale nella barra laterale](../Requirements/TerminalConversation.md#nuova-chat-iniziale-nella-barra-laterale)
  * verify: [Vista persistente della conversazione](../Requirements/TerminalConversation.md#vista-persistente-della-conversazione)
---

### Prova dello stato del turno alla riapertura

Avviare da un client della chat testuale un turno con elaborazione controllabile, poi chiudere la sessione del client dopo l'accettazione e prima dell'esito. Mantenere l'elaborazione in corso, riaprire la stessa conversazione da un client della chat testuale e osservare lo stato del turno. Far poi terminare il turno, consultare nuovamente la conversazione e ripetere la prova con un esito di errore.

#### Details
La prova passa se, durante l'elaborazione, il client mostra il testo del turno con lo stato «In elaborazione» e non presenta eventuali frammenti ricevuti prima della chiusura della sessione come risposta completa. Dopo la conservazione dell'esito e una nuova consultazione manuale, il client mostra un solo scambio concluso con risposta completa oppure messaggio pubblico di errore, e lo stato «In elaborazione» scompare per quel turno. Fallisce se il turno non è visibile durante l'elaborazione, se appare già concluso, se lo stato rimane dopo la nuova consultazione, se la riapertura crea uno scambio duplicato o se l'aggiornamento invia un nuovo turno. Gli esiti registrati in precedenza per il profilo SSE non valgono per questa versione della prova.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---


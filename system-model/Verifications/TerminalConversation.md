# Elements

### Verifica del client terminale

Raggruppa le prove del comportamento del client terminale e della sua integrazione con il backend HTTP.

#### Metadata
  * type: verification-objective
---

### Analisi della compatibilità con il backend

Esaminare la versione di backend dichiarata nel contratto sorgente e confrontare richieste, eventi SSE, errori, elenco e storico usati dal client con il contratto pubblico e con l'esito delle prove di integrazione.

#### Details
L'analisi passa se la versione è identificata in modo riproducibile e tutti gli usi del protocollo corrispondono ai contratti e alle prove eseguite. Fallisce se la versione è indefinita o il client dipende da file o moduli interni del backend.

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

Avviare il backend e il client terminale come processi distinti, rendendo disponibili al client le sole API HTTP del backend. Dal terminale inviare un nuovo turno e osservare una risposta prodotta in più frammenti; consultare le conversazioni conservate e proseguire quella creata, recuperandone lo storico dal backend. Ripetere con un rifiuto HTTP e con un errore successivo all'avvio del flusso.

#### Details
La prova passa se la persona può conversare dal terminale, osserva i frammenti durante la generazione e può consultare e continuare una conversazione conservata tramite le API pubbliche. La conferma di successo segue il profilo UI Message Stream e gli errori sono presentati secondo i contratti condivisi. Fallisce se il client richiede un'interfaccia grafica, accede direttamente all'archivio o ai componenti server, oppure presenta come riuscito un turno privo della conferma applicativa. I test del client, inclusa la schermata PTY, la prova HTTP contro gli adapter e la prova con server completo, archivio SQLite e CLI in un processo separato sono passati con un produttore di risposta controllato. Un turno reale con Mistral è riuscito tramite il client in processo separato e il backend Docker al commit 3f789c6, avviato con Compose e JSON esterni; lo storico SQLite ha conservato lo stato answered. Restano da provare gli agenti MCP esterni e l'intero scenario con più frammenti, riapertura, continuazione ed errori contro il produttore reale.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-pinned-backend.mjs](../../scripts/verify-pinned-backend.mjs)
  * satisfiedBy: [backend.test.ts](../../test/backend.test.ts)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
  * verify: [Invio HTTP del turno della chat testuale](../Requirements/TerminalConversation.md#invio-http-del-turno-della-chat-testuale)
  * verify: [Presentazione dell'errore del flusso testuale](../Requirements/TerminalConversation.md#presentazione-dellerrore-del-flusso-testuale)
  * verify: [Presentazione dell'errore HTTP prima del flusso testuale](../Requirements/TerminalConversation.md#presentazione-dellerrore-http-prima-del-flusso-testuale)
  * verify: [Riconoscimento del completamento della risposta testuale](../Requirements/TerminalConversation.md#riconoscimento-del-completamento-della-risposta-testuale)
  * verify: [Segnalazione locale dell'interruzione della chat testuale](../Requirements/TerminalConversation.md#segnalazione-locale-dellinterruzione-della-chat-testuale)
---

### Prova dell'invito ad aggiornare la conversazione

Avviare un turno testuale con elaborazione controllabile, disconnettere il client e riaprire la stessa conversazione mentre il turno è ancora in corso. Osservare il client, far conservare al backend l'esito e aggiornare manualmente la consultazione. Ripetere con una risposta completa e con un errore pubblico.

#### Details
La prova passa se la conversazione riaperta mostra il turno «In elaborazione» e invita la persona ad aggiornarla più tardi, senza aprire un altro flusso SSE, interrogare periodicamente lo stato o mostrare frammenti temporanei come risposta completa. Prima dell'aggiornamento manuale il client non sostituisce da sé lo stato; dopo l'aggiornamento mostra l'esito conservato corretto senza duplicare il turno né inviarne uno nuovo. Il test PTY verifica la riapertura con stato pending, l'invito visibile e la transizione ad answered dopo Ctrl+R senza un nuovo POST. La prova con il server completo conferma lo stato pending nell'archivio e l'esito answered alla nuova consultazione, oltre a un errore conservato distinto. Restano da provare la disconnessione reale durante il turno e la transizione pending verso failed alla riapertura.

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
La prova passa se la nuova chat iniziale resta corrente dopo il primo invio e viene rinominata con il primo messaggio. La prova PTY da 100×30 colonne verifica l'anteprima dello storico, due turni nella stessa chat, la navigazione con Tab, frecce e Invio, la pagina successiva e l'aggiornamento dalla prima pagina. La prova con server completo verifica nuova chat, riapertura e continuazione. Restano da provare il ridimensionamento, la vista sotto la dimensione minima e il fallback dell'anteprima quando lo storico fallisce. Il campo di scrittura e lo storico rimangono visibili durante composizione, invio e ricezione senza ritorno al menu, il secondo turno usa l'identificativo della chat corrente e la barra laterale mostra l'anteprima del primo messaggio di ogni chat visibile dopo la lettura dello storico pubblico. Una lettura dello storico fallita mantiene selezionabile la chat con ID abbreviato. Il cambio di focus e la selezione aprono la chat corretta; ridimensionare non perde lo stato della conversazione. Fallisce se un turno chiude la vista corrente o se le anteprime provengono da dati non presenti nel contratto HTTP.

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

Avviare da un client della chat testuale un turno con elaborazione controllabile, poi disconnettere il client dopo l'accettazione e prima dell'esito. Mantenere l'elaborazione in corso, riaprire la stessa conversazione da un client della chat testuale e osservare lo stato del turno. Far poi terminare il turno, consultare nuovamente la conversazione e ripetere la prova con un esito di errore.

#### Details
La prova passa se, durante l'elaborazione, il client mostra il testo del turno con lo stato «In elaborazione» e non presenta eventuali frammenti ricevuti prima della disconnessione come risposta completa. Dopo la conservazione dell'esito e una nuova consultazione manuale, il client mostra un solo scambio concluso con risposta completa oppure messaggio pubblico di errore, e lo stato «In elaborazione» scompare per quel turno. Fallisce se il turno non è visibile durante l'elaborazione, se appare già concluso, se lo stato rimane dopo la nuova consultazione o se la riapertura crea uno scambio duplicato. Il test PTY verifica la riapertura mentre il turno è pending e la visualizzazione della risposta conservata dopo Ctrl+R, senza nuovo POST. La prova con server completo verifica anche riapertura e continuazione. La prova con il server completo conferma la transizione pending verso answered e un errore failed conservato. Restano da provare la disconnessione reale, la riapertura durante una transizione pending verso failed e il recupero dopo riavvio.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---

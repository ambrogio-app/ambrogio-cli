# Elements

### Avvio locale del client da checkout

La prima versione utilizzabile si avvia dal checkout del repository mediante npm dopo l'installazione delle dipendenze. Il repository contiene script riproducibili per compilare, eseguire test e avviare il client. La distribuzione come pacchetto CLI installabile resta una capacità successiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Contratto HTTP del backend Ambrogio

Il backend `ambrogio-app` è la fonte autorevole dei contratti HTTP conversazionali. La versione di riferimento è il commit `3f789c61815ca82eed87a67c91304fb1e6123805` del backend. I contratti da consultare sono `Dati della richiesta del turno della chat testuale`, `Profilo di trasporto SSE della chat`, `Risposta di errore HTTP prima del flusso testuale`, `Risposta HTTP dell'elenco conversazioni` e `Risposta HTTP dello storico conversazionale` nel [modello dei contratti del backend](https://github.com/adrianofoschi/ambrogio-app/blob/3f789c61815ca82eed87a67c91304fb1e6123805/system-model/Contracts/FamilyConversation.md). Gli endpoint e i payload effettivi vanno verificati con prove di integrazione contro quella versione. Un cambiamento di contratto nel backend richiede revisione esplicita di questo modello e delle verifiche del client.

#### Metadata
  * type: source

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Indirizzo esplicito del backend

Prima di iniziare l'interazione, il client richiede un URL base HTTP o HTTPS del backend fornito come opzione di avvio o variabile d'ambiente. L'opzione prevale sulla variabile; in assenza di entrambe, l'avvio termina con un'indicazione d'uso. Il client non sceglie un server predefinito. L'URL serve soltanto a costruire gli endpoint HTTP pubblici conversazionali.

#### Metadata
  * type: specification

#### Relations
  * define: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
---

### Lettura del flusso UI mediante libreria

Il client usa una libreria mantenuta per decodificare il framing SSE del profilo UI Message Stream v1. Interpreta le parti JSON applicative definite dal contratto backend, ignorando i commenti SSE e il marcatore di trasporto [DONE]. Mostra i soli incrementi text-delta nell'ordine ricevuto e considera il turno riuscito soltanto dopo la parte finish con finishReason stop e messageMetadata.turnStatus answered. La scelta della libreria non trasferisce al client la produzione della risposta o la persistenza del turno.

#### Metadata
  * type: specification

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Menu numerico della conversazione

L'interazione a prompt semplice presenta un menu numerico con le azioni per iniziare una conversazione, elencare quelle conservate, passare alla pagina successiva, aprire una conversazione, aggiornare manualmente la vista corrente e uscire. Dopo un'apertura o un nuovo turno, i successivi testi immessi nel contesto della conversazione proseguono usando il suo identificativo. Il client mostra quando un'azione non è disponibile, per esempio la pagina successiva senza cursore.

#### Metadata
  * type: specification

#### Relations
  * define: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
---

### Stati del turno testuale alla riapertura

Un turno testuale accettato e ancora in elaborazione è distinguibile dagli scambi conclusi quando si consulta la conversazione. Finché l'esito non è conservato, la consultazione lo identifica come `in elaborazione` e lo associa al testo del turno; il client invita la persona ad aggiornare manualmente la consultazione più tardi. Alla successiva consultazione, se l'esito è stato conservato, il client presenta lo scambio concluso con risposta oppure errore e non presenta più per lo stesso turno lo stato `in elaborazione`. La riapertura non crea una seconda connessione SSE, non recupera i frammenti parziali e non aggiorna automaticamente lo stato mostrato dal client. Dopo un'interruzione del processo, il turno senza esito segue lo stato `interrotto` definito nel contratto degli stati persistenti del turno testuale.

#### Metadata
  * type: state

#### Relations
  * define: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---

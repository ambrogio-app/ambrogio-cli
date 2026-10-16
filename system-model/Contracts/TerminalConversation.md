# Elements

### Avvio locale del client da checkout

La prima versione utilizzabile si avvia dal checkout del repository mediante npm dopo l'installazione delle dipendenze. Il repository contiene script riproducibili per compilare, eseguire test e avviare il client. La distribuzione come pacchetto CLI installabile resta una capacità successiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Contratto HTTP del backend Ambrogio

Il backend `ambrogio-backend` è la fonte autorevole dei contratti HTTP conversazionali. La versione di riferimento è il commit `3f789c61815ca82eed87a67c91304fb1e6123805` del backend. I contratti da consultare sono `Dati della richiesta del turno della chat testuale`, `Profilo di trasporto SSE della chat`, `Risposta di errore HTTP prima del flusso testuale`, `Risposta HTTP dell'elenco conversazioni` e `Risposta HTTP dello storico conversazionale` nel [modello dei contratti del backend](https://github.com/adrianofoschi/ambrogio-backend/blob/3f789c61815ca82eed87a67c91304fb1e6123805/system-model/Contracts/FamilyConversation.md). Gli endpoint e i payload effettivi vanno verificati con prove di integrazione contro quella versione. Un cambiamento di contratto nel backend richiede revisione esplicita di questo modello e delle verifiche del client.

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

### Schermata conversazionale a due pannelli

Il client usa Terminal Kit per una schermata interattiva persistente. All'avvio una voce locale «Nuova chat» è selezionata come prima voce; non crea una conversazione vuota sul backend. Quando il primo turno è inviato, la voce prende come nome l'anteprima del testo inviato e resta la chat corrente anche durante la risposta. La barra laterale a sinistra mostra le conversazioni paginabili con l'anteprima del primo messaggio della persona, ricavata dagli storici HTTP pubblici delle sole chat visibili. Se il recupero di uno storico fallisce, la voce resta selezionabile con ID abbreviato. Il pannello destro conserva lo storico della chat selezionata, la risposta in generazione e il campo di scrittura per tutta l'interazione; inviare un turno non torna a una schermata di menu. `Tab` sposta il focus tra barra laterale e campo di scrittura; nell'elenco le frecce cambiano selezione e `Invio` apre la chat. La schermata indica i comandi per nuova chat, aggiornamento manuale, pagina successiva e uscita. Al ridimensionamento del terminale il client ricalcola i pannelli; quando lo spazio non consente due pannelli leggibili chiede di allargare il terminale senza perdere la conversazione corrente.

#### Metadata
  * type: specification

#### Relations
  * define: [Vista persistente della conversazione](../Requirements/TerminalConversation.md#vista-persistente-della-conversazione)
---

### Stati del turno testuale alla riapertura

Un turno testuale accettato e ancora in elaborazione è distinguibile dagli scambi conclusi quando si consulta la conversazione. Finché l'esito non è conservato, la consultazione lo identifica come `in elaborazione` e lo associa al testo del turno; il client invita la persona ad aggiornare manualmente la consultazione più tardi. Alla successiva consultazione, se l'esito è stato conservato, il client presenta lo scambio concluso con risposta oppure errore e non presenta più per lo stesso turno lo stato `in elaborazione`. La riapertura non crea una seconda connessione SSE, non recupera i frammenti parziali e non aggiorna automaticamente lo stato mostrato dal client. Dopo un'interruzione del processo, il turno senza esito segue lo stato `interrotto` definito nel contratto degli stati persistenti del turno testuale.

#### Metadata
  * type: state

#### Relations
  * define: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---

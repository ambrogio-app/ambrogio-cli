# Elements

### Contratto HTTP del backend Ambrogio

Il backend `ambrogio-app` è la fonte autorevole dei contratti HTTP conversazionali. La versione di riferimento è il commit `3f789c61815ca82eed87a67c91304fb1e6123805` del backend. I contratti da consultare sono `Dati della richiesta del turno della chat testuale`, `Profilo di trasporto SSE della chat`, `Risposta di errore HTTP prima del flusso testuale`, `Risposta HTTP dell'elenco conversazioni` e `Risposta HTTP dello storico conversazionale` nel [modello dei contratti del backend](https://github.com/adrianofoschi/ambrogio-app/blob/3f789c61815ca82eed87a67c91304fb1e6123805/system-model/Contracts/FamilyConversation.md). Gli endpoint e i payload effettivi vanno verificati con prove di integrazione contro quella versione. Un cambiamento di contratto nel backend richiede revisione esplicita di questo modello e delle verifiche del client.

#### Metadata
  * type: source

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Stati del turno testuale alla riapertura

Un turno testuale accettato e ancora in elaborazione è distinguibile dagli scambi conclusi quando si consulta la conversazione. Finché l'esito non è conservato, la consultazione lo identifica come `in elaborazione` e lo associa al testo del turno; il client invita la persona ad aggiornare manualmente la consultazione più tardi. Alla successiva consultazione, se l'esito è stato conservato, il client presenta lo scambio concluso con risposta oppure errore e non presenta più per lo stesso turno lo stato `in elaborazione`. La riapertura non crea una seconda connessione SSE, non recupera i frammenti parziali e non aggiorna automaticamente lo stato mostrato dal client. Dopo un'interruzione del processo, il turno senza esito segue lo stato `interrotto` definito nel contratto degli stati persistenti del turno testuale.

#### Metadata
  * type: state

#### Relations
  * define: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---

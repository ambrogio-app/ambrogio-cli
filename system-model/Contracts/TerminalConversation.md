# Elements

### Avvio locale del client da checkout

La prima versione utilizzabile si avvia dal checkout del repository mediante npm dopo l'installazione delle dipendenze. Il repository contiene script riproducibili per compilare, eseguire test e avviare il client. La distribuzione come pacchetto CLI installabile resta una capacità successiva.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Catalogo dei testi del client terminale

Decisione concordata con la persona il 18 ottobre 2026: ogni testo prodotto dal client esiste in italiano e in inglese con la formulazione esatta indicata qui; il codice raccoglie il catalogo in un solo modulo e i due elenchi hanno le stesse voci. I segnaposto fra parentesi angolari sono sostituiti dal valore effettivo: `<host>` dal nome host, `<n>` dal codice HTTP, `<dettaglio>` dal messaggio dell'errore locale o pubblico, `<testo>` dal testo del turno della persona. Le righe dell'indicazione d'uso terminano con un a capo. Il titolo « AMBROGIO · Chat» e il prefisso «Ambrogio: » sono identici nelle due lingue. Testi, risposte e messaggi pubblici ricevuti dal backend non fanno parte del catalogo e non sono tradotti.

**Avvio e identità**

| Uso | Italiano | Inglese |
|---|---|---|
| Indicazione d'uso, prima riga | `Uso: npm start -- --server http://host:porta [--client-id identificativo] [--language it\|en]` | `Usage: npm start -- --server http://host:port [--client-id identifier] [--language it\|en]` |
| Indicazione d'uso, seconda riga | `Oppure imposta AMBROGIO_URL, AMBROGIO_CLIENT_ID e AMBROGIO_LANGUAGE.` | `Or set AMBROGIO_URL, AMBROGIO_CLIENT_ID and AMBROGIO_LANGUAGE.` |
| Opzioni o lingua non valide | `Opzioni non valide.` | `Invalid options.` |
| URL del backend assente | `Indica l’URL del backend.` | `Specify the backend URL.` |
| Identificativo vuoto | `L’identificativo del client non può essere vuoto.` | `The client identifier must not be empty.` |
| Terminale non interattivo | `Apri il client in un terminale interattivo.` | `Open the client in an interactive terminal.` |
| Nome inviato con `session.hello` | `Terminale <host>` | `Terminal <host>` |

**Schermata**

| Uso | Italiano | Inglese |
|---|---|---|
| Voce della nuova chat | `Nuova chat` | `New chat` |
| Stato iniziale | `Caricamento conversazioni…` | `Loading conversations…` |
| Chat vuota | `Scrivi un messaggio per iniziare questa chat.` | `Write a message to start this chat.` |
| Terminale troppo piccolo | `Allarga il terminale ad almeno 70 colonne e 14 righe.` e, a capo, `La chat corrente resta aperta.` | `Enlarge the terminal to at least 70 columns and 14 rows.` and, on a new line, `The current chat stays open.` |
| Etichetta del campo di scrittura | `Scrivi un messaggio e premi Invio` | `Type a message and press Enter` |
| Segnaposto del campo di scrittura | `Messaggio…` | `Message…` |
| Comandi della barra laterale | `↑↓ scegli · Invio apri` | `↑↓ select · Enter open` |
| Comandi generali | ` Tab pannelli · ^N nuova · ^R aggiorna · ^L altre · ^Q esci` | ` Tab panels · ^N new · ^R refresh · ^L more · ^Q quit` |

**Conversazione**

| Uso | Italiano | Inglese |
|---|---|---|
| Turno della persona | `Tu: <testo>` | `You: <testo>` |
| Turno in elaborazione alla riapertura | `Ambrogio: In elaborazione. Aggiorna manualmente più tardi.` | `Ambrogio: In progress. Refresh manually later.` |
| Risposta in generazione senza frammenti | `Ambrogio: In elaborazione…` | `Ambrogio: In progress…` |
| Esito di errore | `Errore: <dettaglio>` | `Error: <dettaglio>` |
| Turno interrotto nello storico | `Risposta interrotta.` | `Response interrupted.` |
| Turno interrotto localmente | `Risposta interrotta. Aggiorna manualmente più tardi.` | `Response interrupted. Refresh manually later.` |

**Stati**

| Uso | Italiano | Inglese |
|---|---|---|
| Elenco aggiornato | `Conversazioni aggiornate.` | `Conversations refreshed.` |
| Pagina successiva caricata | `Altre conversazioni caricate.` | `More conversations loaded.` |
| Elenco non disponibile | `Errore elenco: <dettaglio>` | `List error: <dettaglio>` |
| Chat aperta | `Chat aperta.` | `Chat opened.` |
| Apertura non riuscita | `Errore apertura: <dettaglio>` | `Error opening chat: <dettaglio>` |
| Nuova chat | `Nuova chat pronta.` | `New chat ready.` |
| Turno in corso | `Ambrogio sta rispondendo…` | `Ambrogio is answering…` |
| Turno riuscito | `Risposta conservata.` | `Answer saved.` |
| Turno fallito | `Il turno è terminato con errore.` | `The turn ended with an error.` |
| Turno interrotto | `Risposta interrotta. Aggiorna manualmente.` | `Response interrupted. Refresh manually.` |
| Invio fallito | `Invio non riuscito.` | `Sending failed.` |

**Errori locali**

| Uso | Italiano | Inglese |
|---|---|---|
| URL non analizzabile | `URL del backend non valido.` | `Invalid backend URL.` |
| URL non ammesso | `L’URL del backend deve essere HTTP(S), senza credenziali, query o frammento.` | `The backend URL must be HTTP(S), without credentials, query or fragment.` |
| Corpo non JSON | `Risposta JSON del backend non valida.` | `Invalid JSON response from the backend.` |
| Errore HTTP senza messaggio pubblico | `Errore HTTP <n>.` | `HTTP error <n>.` |
| Elenco non valido | `Risposta dell’elenco non valida.` | `Invalid list response.` |
| Voce dell'elenco non valida | `Voce dell’elenco non valida.` | `Invalid list entry.` |
| Storico non valido | `Risposta dello storico non valida.` | `Invalid history response.` |
| Turno dello storico non valido | `Turno dello storico non valido.` | `Invalid history turn.` |
| Risposta del turno non valida | `Risposta del turno non valida.` | `Invalid turn answer.` |
| Errore del turno non valido | `Errore del turno non valido.` | `Invalid turn error.` |
| Sessione non aperta | `Impossibile collegarsi al backend.` | `Cannot connect to the backend.` |
| `turn.failed` senza messaggio | `Errore del turno.` | `Turn error.` |
| `turn.rejected` senza messaggio | `Turno rifiutato.` | `Turn rejected.` |
| `session.error` per il turno | `Errore del protocollo: <dettaglio>`, con `messaggio non valido.` se manca il messaggio | `Protocol error: <dettaglio>`, with `invalid message.` if the message is missing |
| Testo vuoto | `Scrivi un messaggio non vuoto.` | `Write a non-empty message.` |
| Testo oltre 64 KiB | `Messaggio troppo grande (massimo 64 KiB).` | `Message too large (maximum 64 KiB).` |

#### Metadata
  * type: specification

#### Relations
  * define: [Testi del client terminale nella lingua dell'interfaccia](../Requirements/TerminalConversation.md#testi-del-client-terminale-nella-lingua-dellinterfaccia)
---

### Contratti pubblici del backend Ambrogio

Il backend `ambrogio-backend` è la fonte autorevole del protocollo conversazionale `ambrogio.v1` e delle rotte HTTP di consultazione. La versione di riferimento è il commit `58b0df420aee7c08280afd818ffcd0e82b060029` del backend. Per i turni si consultano i contratti `Sessione del protocollo Ambrogio v1`, `Trasmissione in ingresso del protocollo Ambrogio v1`, `Trasmissione in uscita del protocollo Ambrogio v1`, `Esiti del turno nel protocollo Ambrogio v1`, `Motivi di rifiuto del turno` ed `Errori ed estensioni del protocollo Ambrogio v1` nel [modello del protocollo del backend](https://github.com/ambrogio-app/ambrogio-backend/blob/58b0df420aee7c08280afd818ffcd0e82b060029/system-model/Contracts/ConversationProtocol.md), con la forma dei messaggi definita da [`protocol/ambrogio-v1.schema.json`](https://github.com/ambrogio-app/ambrogio-backend/blob/58b0df420aee7c08280afd818ffcd0e82b060029/protocol/ambrogio-v1.schema.json) alla stessa revisione. Per la consultazione si usano `Risposta HTTP dell'elenco conversazioni` e `Risposta HTTP dello storico conversazionale` nel [modello dei contratti del backend](https://github.com/ambrogio-app/ambrogio-backend/blob/58b0df420aee7c08280afd818ffcd0e82b060029/system-model/Contracts/FamilyConversation.md). Questa revisione sostituisce la precedente `c057ced962b37f7d605c675ffb6da44825d67496`, basata sul profilo SSE ora rimosso dal backend. Messaggi ed endpoint effettivi vanno verificati con prove di integrazione contro la revisione indicata, nelle quali il backend valida i messaggi con lo schema. Un cambiamento di contratto nel backend richiede revisione esplicita di questo modello e delle verifiche del client.

#### Metadata
  * type: source

#### Relations
  * define: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
---

### Identità del client terminale nella sessione

Decisione concordata il 17 ottobre 2026: il `clientId` inviato con `session.hello` vale per impostazione predefinita `cli-<nome host>` e può essere sostituito con l'opzione di avvio `--client-id` o con la variabile `AMBROGIO_CLIENT_ID`; l'opzione prevale sulla variabile. Il `name` vale `Terminale <nome host>` con l'interfaccia in italiano e `Terminal <nome host>` con l'interfaccia in inglese, secondo il catalogo dei testi del client deciso il 18 ottobre 2026. Un valore vuoto non è ammesso. L'identità serve al backend per distinguere i client nelle sessioni e resta stabile tra un avvio e l'altro sulla stessa macchina finché la configurazione non cambia; il `clientId` non dipende dalla lingua.

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

### Profilo di scansione dei segreti con gitleaks

Decisione concordata con la persona il 18 ottobre 2026: il repository del client usa gitleaks per impedire che segreti, come chiavi API o token, entrino nella storia Git. Il controllo avviene in due punti.

- **CI.** Il workflow `.github/workflows/secret-scan.yml` si esegue a ogni push su qualunque branch, a ogni pull request, su richiesta manuale e come workflow richiamabile. Recupera l'intera storia con `actions/checkout` fissato al commit `d23441a48e516b6c34aea4fa41551a30e30af803` (v6), `fetch-depth: 0` e `persist-credentials: false`. Scarica dalla release ufficiale gitleaks v8.30.1, archivio `gitleaks_8.30.1_linux_x64.tar.gz`, ne verifica lo SHA-256 `551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb` prima di estrarlo e interrompe il job se l'impronta non corrisponde. Esegue `gitleaks git --redact --no-banner --exit-code 1 .` sull'intera storia: un rilevamento fa fallire il job e l'output non riporta il valore del segreto.
- **Hook locale.** Lo script POSIX versionato `.githooks/pre-commit` esegue `gitleaks git --pre-commit --staged --redact --no-banner .` sulle modifiche in staging. Se `gitleaks` non è disponibile nel `PATH`, stampa un messaggio che indica come installarlo e termina con esito non riuscito, impedendo il commit. L'hook si attiva in ogni clone con `git config core.hooksPath .githooks`; l'attivazione è locale e non è imposta dal repository.

Si usa la configurazione predefinita di gitleaks, senza file `.gitleaks.toml`, finché non emergono falsi positivi da gestire esplicitamente. Un aggiornamento di gitleaks cambia insieme versione e impronta in questo contratto e nel workflow.

#### Alternative e conseguenze
Sono state considerate l'action ufficiale `gitleaks/gitleaks-action`, che richiede una licenza quando il repository appartiene a un'organizzazione, il solo controllo in CI, che scopre il segreto quando è già nella storia locale e pubblicata, e il solo hook locale, che dipende dall'attivazione in ogni clone e non protegge le modifiche che arrivano da altri ambienti. La combinazione scelta blocca il segreto prima del commit quando l'hook è attivo e lo rileva comunque al push. Il binario fissato con impronta verificata non dipende da licenze né da action di terzi oltre al checkout.

#### Metadata
  * type: specification

#### Relations
  * define: [Scansione dei segreti nella CI](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci)
---

### Scelta della lingua del client terminale

Decisione concordata con la persona il 18 ottobre 2026: l'interfaccia del client è disponibile in italiano (`it`) e in inglese (`en`). Sostituisce la scelta implicita della prima versione, in cui tutti i testi del client erano soltanto in italiano.

La lingua si sceglie all'avvio con l'opzione `--language <it|en>` o con la variabile `AMBROGIO_LANGUAGE`; l'opzione prevale sulla variabile. Una variabile vuota equivale a una variabile assente. Un valore diverso da `it` o `en`, nell'opzione o nella variabile, è un'opzione non valida: l'avvio termina con codice `2`, il messaggio «Opzioni non valide.» e l'indicazione d'uso. Senza opzione né variabile, il client segue la lingua del sistema: considera il primo valore non vuoto fra `LC_ALL`, `LC_MESSAGES` e `LANG`; se inizia con `it` la lingua è l'italiano, altrimenti l'inglese, anche quando nessuna delle tre variabili è impostata o il valore è `C` o `POSIX`. La variabile GNU `LANGUAGE` non è considerata.

Le indicazioni d'uso e i messaggi dell'avvio, compreso quello per una lingua non valida e la risposta a `--help`, usano la lingua stabilita senza il valore non valido: l'opzione o la variabile valide, altrimenti la lingua del sistema. La lingua resta la stessa per tutto il processo e non dipende dalla lingua configurata nel backend; i testi ricevuti dal backend sono mostrati così come arrivano.

#### Alternative e conseguenze
Sono state considerate un'opzione con valore predefinito inglese, allineato al backend, e un'opzione con valore predefinito italiano, che non cambiava il comportamento esistente. Seguire la lingua del sistema replica lo schema della chat web, che segue la lingua del browser con l'inglese come ripiego, e offre la lingua attesa senza configurazione; chi usa un sistema con lingua diversa dall'italiano ottiene l'inglese anche se il backend è configurato in italiano, e può scegliere esplicitamente con l'opzione o la variabile.

#### Metadata
  * type: specification

#### Relations
  * define: [Scelta della lingua dell'interfaccia del client terminale](../Requirements/TerminalConversation.md#scelta-della-lingua-dellinterfaccia-del-client-terminale)
---

### Schermata conversazionale a due pannelli

Il client usa Terminal Kit per una schermata interattiva persistente. All'avvio una voce locale «Nuova chat» («New chat» con l'interfaccia in inglese) è selezionata come prima voce; non crea una conversazione vuota sul backend. Quando il primo turno è inviato, la voce prende come nome l'anteprima del testo inviato e resta la chat corrente anche durante la risposta. La barra laterale a sinistra mostra le conversazioni paginabili con l'anteprima del primo messaggio della persona, ricavata dagli storici HTTP pubblici delle sole chat visibili. Se il recupero di uno storico fallisce, la voce resta selezionabile con ID abbreviato. Il pannello destro conserva lo storico della chat selezionata, la risposta in generazione e il campo di scrittura per tutta l'interazione; inviare un turno non torna a una schermata di menu. `Tab` sposta il focus tra barra laterale e campo di scrittura; nell'elenco le frecce cambiano selezione e `Invio` apre la chat. La schermata indica i comandi per nuova chat, aggiornamento manuale, pagina successiva e uscita. Al ridimensionamento del terminale il client ricalcola i pannelli; quando lo spazio non consente due pannelli leggibili chiede di allargare il terminale senza perdere la conversazione corrente. Le formulazioni di etichette, comandi, stati e avvisi della schermata nelle due lingue sono quelle del catalogo dei testi del client.

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


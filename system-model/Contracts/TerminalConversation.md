# Elements

### Avvio locale del client da checkout

La prima versione utilizzabile si avvia dal checkout del repository con `pnpm start` dopo l'installazione delle dipendenze con pnpm. Il client richiede Node.js 24 o successivo, dichiarato in `package.json` con `engines.node` `>=24`; compilazione, test e CI usano Node.js 24. Il repository contiene script riproducibili per compilare (`pnpm build`), controllare i tipi (`pnpm typecheck`), eseguire test (`pnpm test` e `pnpm test:backend`) e avviare il client. La distribuzione come pacchetto CLI installabile resta una capacità successiva. La compilazione usa `tsc -p tsconfig.json` con `strict`, `noUncheckedIndexedAccess`, `module` e `moduleResolution` `NodeNext`, `target` `ES2022` e librerie `ES2022` e `DOM`, e compila `src/` e `test/` in `dist/`. Le dipendenze installate in `node_modules/` e l'output `dist/` sono esclusi dal versionamento con `.gitignore`.

#### Metadata
  * type: specification

#### Relations
  * define: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Catalogo dei testi del client terminale

Ogni testo prodotto dal client esiste in italiano e in inglese con la formulazione esatta indicata qui; il codice raccoglie il catalogo in un solo modulo e i due elenchi hanno le stesse voci. I segnaposto fra parentesi angolari sono sostituiti dal valore effettivo: `<host>` dal nome host, `<n>` dal codice HTTP, `<dettaglio>` dal messaggio dell'errore locale o pubblico, `<testo>` dal testo del turno della persona. Le righe dell'indicazione d'uso terminano con un a capo. Il titolo « AMBROGIO · Chat» e il prefisso «Ambrogio: » sono identici nelle due lingue. Testi, risposte e messaggi pubblici ricevuti dal backend non fanno parte del catalogo e non sono tradotti.

**Avvio e identità**

| Uso | Italiano | Inglese |
|---|---|---|
| Indicazione d'uso, prima riga | `Uso: pnpm start --server http://host:porta [--client-id identificativo] [--language it\|en]` | `Usage: pnpm start --server http://host:port [--client-id identifier] [--language it\|en]` |
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

### Identità del client terminale nella sessione

Il `clientId` inviato con `session.hello` vale per impostazione predefinita `cli-<nome host>`; quando la persona indica l'opzione di avvio `--client-id` o la variabile `AMBROGIO_CLIENT_ID`, il client usa il valore indicato al posto di quello predefinito, e l'opzione prevale sulla variabile. Il `name` è il testo della voce «Nome inviato con `session.hello`» del catalogo dei testi del client terminale nella lingua dell'interfaccia, con il nome host della macchina al posto del segnaposto. Un valore vuoto non è ammesso. L'identità serve al backend per distinguere i client nelle sessioni e resta stabile tra un avvio e l'altro sulla stessa macchina finché la configurazione non cambia; il `clientId` non dipende dalla lingua.

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

### Installazione con pnpm 12.11.2

Il client usa pnpm 12.11.2, dichiarato in `package.json` con `packageManager` `pnpm@12.11.2`, e il lockfile versionato `pnpm-lock.yaml`; il repository non contiene `package-lock.json`. La CI installa pnpm 12.11.2 e le dipendenze con `pnpm install --frozen-lockfile`, che fallisce se manifest e lockfile divergono. `pnpm-workspace.yaml` dichiara `allowBuilds` vuoto, perché nessuna dipendenza del client richiede script di build; una dipendenza che li richiede entra nell'elenco soltanto con una decisione registrata in questo contratto. L'attesa predefinita di pnpm di 24 ore per le nuove versioni pubblicate resta attiva e `pnpm-workspace.yaml` non dichiara eccezioni in `minimumReleaseAgeExclude`.

#### Metadata
  * type: specification

#### Relations
  * define: [Installazione delle dipendenze con pnpm](../Requirements/TerminalConversation.md#installazione-delle-dipendenze-con-pnpm)
---

### Profilo di protezione dei workflow GitHub Actions

Il client terminale applica il profilo comune dei workflow GitHub Actions ai workflow `.github/workflows/ci.yml` e `.github/workflows/secret-scan.yml`, con questi valori propri:

- `actions/checkout` in entrambi i workflow e `actions/setup-node` in `ci.yml`, alle impronte del profilo comune; `actions/setup-node` con `package-manager-cache: false`;
- `timeout-minutes` pari a 15 per il job `checks` di `ci.yml` e a 10 per il job `gitleaks` di `secret-scan.yml`;
- nessun permesso dichiarato dai job e nessun blocco `concurrency`.

#### Metadata
  * type: specification

#### Relations
  * define: [Protezione dei workflow di CI](../Requirements/TerminalConversation.md#protezione-dei-workflow-di-ci)
---

### Profilo di scansione dei segreti del client terminale

Il client terminale applica il profilo comune di scansione dei segreti con gitleaks. Il job della scansione dell'intera storia in `.github/workflows/secret-scan.yml` si chiama `Gitleaks` e usa il checkout definito dal profilo di protezione dei workflow GitHub Actions del client. Il job `checks` di `.github/workflows/ci.yml` installa gitleaks prima di `pnpm test` con la stessa versione, lo stesso archivio, la stessa verifica dell'impronta e lo stesso script del workflow di scansione, così che la suite di test provi l'hook pre-commit e il comando di scansione della CI su repository Git temporanei.

#### Alternative e conseguenze
Sono state considerate l'action ufficiale `gitleaks/gitleaks-action`, che richiede una licenza quando il repository appartiene a un'organizzazione, il solo controllo in CI, che scopre il segreto quando è già nella storia locale e pubblicata, e il solo hook locale, che dipende dall'attivazione in ogni clone e non protegge le modifiche che arrivano da altri ambienti. La combinazione scelta blocca il segreto prima del commit quando l'hook è attivo e lo rileva comunque al push. Il binario fissato con impronta verificata non dipende da licenze né da action di terzi oltre al checkout.

#### Metadata
  * type: specification

#### Relations
  * define: [Scansione dei segreti nella CI del client terminale](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci-del-client-terminale)
---

### Ruleset del branch principale del client terminale

Il ruleset `main` del repository del client terminale segue il ruleset comune del branch principale; i controlli richiesti in `required_status_checks` sono `Terminal client checks`, il job di `.github/workflows/ci.yml`, e `Gitleaks`, il job di `.github/workflows/secret-scan.yml`.

#### Metadata
  * type: specification

#### Relations
  * define: [Controlli obbligatori prima del merge del client terminale](../Requirements/TerminalConversation.md#controlli-obbligatori-prima-del-merge-del-client-terminale)
---

### Scelta della lingua del client terminale

L'interfaccia del client è disponibile in italiano (`it`) e in inglese (`en`).

La lingua si sceglie all'avvio con l'opzione `--language <it|en>` o con la variabile `AMBROGIO_LANGUAGE`; l'opzione prevale sulla variabile. Una variabile vuota equivale a una variabile assente. Un valore diverso da `it` o `en`, nell'opzione o nella variabile, è un'opzione non valida: l'avvio termina con codice `2`, il messaggio «Opzioni non valide.» e l'indicazione d'uso. Senza opzione né variabile, il client segue la lingua del sistema: considera il primo valore non vuoto fra `LC_ALL`, `LC_MESSAGES` e `LANG`; se inizia con `it` la lingua è l'italiano, altrimenti l'inglese, anche quando nessuna delle tre variabili è impostata o il valore è `C` o `POSIX`. La variabile GNU `LANGUAGE` non è considerata.

Le indicazioni d'uso e i messaggi dell'avvio, compreso quello per una lingua non valida e la risposta a `--help`, usano la lingua stabilita senza il valore non valido: l'opzione o la variabile valide, altrimenti la lingua del sistema. La lingua resta la stessa per tutto il processo e non dipende dalla lingua configurata nel backend; i testi ricevuti dal backend sono mostrati così come arrivano.

#### Alternative e conseguenze
Sono state considerate un'opzione con valore predefinito inglese, allineato al backend, e un'opzione con valore predefinito italiano, che non cambiava il comportamento esistente. Seguire la lingua del sistema replica lo schema della chat web, che segue la lingua del browser con l'inglese come ripiego, e offre la lingua attesa senza configurazione; chi usa un sistema con lingua diversa dall'italiano ottiene l'inglese anche se il backend è configurato in italiano, finché non sceglie la lingua con l'opzione o la variabile.

#### Metadata
  * type: specification

#### Relations
  * define: [Scelta della lingua dell'interfaccia del client terminale](../Requirements/TerminalConversation.md#scelta-della-lingua-dellinterfaccia-del-client-terminale)
---

### Schermata conversazionale a due pannelli

Il client usa Terminal Kit per una schermata interattiva persistente. All'avvio la voce locale della nuova chat, con il testo della voce «Voce della nuova chat» del catalogo dei testi del client terminale, è selezionata come prima voce; non crea una conversazione vuota sul backend. Quando il primo turno è inviato, la voce prende come nome l'anteprima del testo inviato e resta la chat corrente anche durante la risposta. La barra laterale a sinistra mostra le conversazioni paginabili con l'anteprima del primo messaggio della persona, ricavata dagli storici HTTP pubblici delle sole chat visibili, ridotta a una riga e troncata alla larghezza della barra con «…». Se il recupero di uno storico fallisce, la voce resta selezionabile e mostra come identificativo abbreviato i primi 8 caratteri dell'identificativo della conversazione. Il pannello destro conserva lo storico della chat selezionata, la risposta in generazione e il campo di scrittura per tutta l'interazione; inviare un turno non torna a una schermata di menu. `Tab` sposta il focus tra barra laterale e campo di scrittura; nell'elenco le frecce cambiano selezione e `Invio` apre la chat. La schermata indica i comandi per nuova chat, aggiornamento manuale, pagina successiva e uscita. Un testo rifiutato localmente perché vuoto, composto di soli spazi o oltre 64 KiB in UTF-8 resta nel campo di scrittura e la riga di stato mostra la voce «Testo vuoto» o «Testo oltre 64 KiB» del catalogo, senza che la chat o il suo nome cambino. Al ridimensionamento del terminale il client ricalcola i pannelli; quando lo spazio non consente due pannelli leggibili chiede di allargare il terminale senza perdere la conversazione corrente. Le formulazioni di etichette, comandi, stati e avvisi della schermata nelle due lingue sono quelle del catalogo dei testi del client.

#### Metadata
  * type: specification

#### Relations
  * define: [Vista persistente della conversazione](../Requirements/TerminalConversation.md#vista-persistente-della-conversazione)
---

### Sessione ambrogio.v1 del client terminale

Il client usa il `WebSocket` integrato in Node.js, disponibile nella versione minima di Node.js richiesta dal client, senza dipendenze aggiuntive a runtime per il trasporto. La sessione si connette a `api/session` sotto l'URL base del backend, con schema `ws:` per `http:` e `wss:` per `https:`, offrendo il sottoprotocollo `ambrogio.v1`; dopo `session.hello` attende `session.ready`. Una sola sessione per processo trasporta i turni di tutte le conversazioni; si apre al primo turno e, se si chiude, si riapre al turno successivo.

Ogni turno è una richiesta testuale: `input.start` con `requestId` e `stream` nuovi, `content` `{"type":"text"}`, `reply` `"text"` e `conversationId` quando si continua una conversazione; il testo in un solo `input.chunk`; poi `input.end`. Prima di aprire la sessione o di inviare il turno, il client rifiuta un testo vuoto o composto di soli spazi e un testo che supera 64 KiB in UTF-8. Dopo `turn.accepted` il client conserva `conversationId` e `turnId` e mostra, nell'ordine ricevuto, i frammenti `output.chunk` delle trasmissioni del turno. Il turno è riuscito soltanto con `turn.completed`; `turn.failed` e `turn.rejected` concludono il turno con il loro `message`, che sostituisce i frammenti mostrati; `turn.interrupted`, oppure la chiusura della sessione prima dell'esito, concludono localmente il turno come interrotto. Un `session.error` riferito alla richiesta conclude il turno con un errore locale. Il client ignora `expectsReply`, perché il campo di scrittura resta sempre disponibile, e risponde con `client.result`, `ok: false` e `reason: "unsupported"`, a ogni messaggio del server non legato a un turno che contenga `id`. La sessione non trasferisce al client la produzione della risposta o la persistenza del turno.

#### Metadata
  * type: specification

#### Relations
  * define: [Invio del turno dal client terminale](../Requirements/TerminalConversation.md#invio-del-turno-dal-client-terminale)
---

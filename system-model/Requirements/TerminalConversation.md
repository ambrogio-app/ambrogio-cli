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

#### Contract References
  * [Avvio locale del client da checkout](../Contracts/TerminalConversation.md#avvio-locale-del-client-da-checkout)

#### Relations
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Controlli CI del client terminale

Quando viene eseguito un push sul branch principale, viene proposta una pull request, viene richiesta un'esecuzione manuale o un altro workflow la richiama, la CI del client deve eseguire la validazione e il lint del modello Reqvire, il controllo TypeScript senza emissione, la suite di test del client e la compilazione, e deve fallire se uno di questi controlli fallisce.

#### Details
I trigger sono `push` sul branch `main`, `pull_request`, `workflow_dispatch` e `workflow_call`. I controlli sono Reqvire 1.3.2 per `validate` e `lint`, con il lint che fallisce se restano correzioni automatiche o elementi da rivedere; `pnpm typecheck`; `pnpm test`, che usa il backend simulato locale; `pnpm build`, su Node.js 24, la versione minima del client, dopo l'installazione congelata delle dipendenze con pnpm. La prova di integrazione contro la revisione backend fissata (`pnpm test:backend`) richiede un checkout compilato del backend e resta fuori dalla CI.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Controllo automatico dell'integrità del modello

Quando la CI del repository esegue la validazione e il lint del modello Reqvire, deve eseguire anche lo script di integrità del modello e deve fallire se lo script segnala una violazione o non riesce a eseguire.

#### Details
Il controllo copre le regole di integrità verificabili sul testo e sui file; `validate` e `lint` di Reqvire non le controllano.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [check-model.mjs](../../scripts/check-model.mjs)
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

### Decisioni sostituite rimosse nella stessa modifica

Quando una decisione ne sostituisce un'altra, la modifica che registra la nuova decisione deve aggiornare o rimuovere ogni requisito, contratto e verifica che afferma la decisione sostituita, e i testi di requisiti, contratti e verifiche non devono riportare date, storia delle decisioni o esiti di esecuzioni.

#### Details
Il modello descrive gli obblighi validi oggi e come verificarli; la storia è conservata da Git. Decisioni datate accumulate nei contratti convivono con elementi che affermano ancora le decisioni sostituite. Gli esiti dei test sono dati dalla CI; l'esito di una verifica manuale si registra nel messaggio del commit o nella pull request che la esegue, non nel modello.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/TerminalConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Dipendenze fra contratti dichiarate come riferimenti

Quando il contenuto di un contratto dipende da un contratto posseduto da un altro requisito, il requisito proprietario del contratto dipendente deve dichiarare una Contract Reference al contratto da cui dipende, e il contratto dipendente non deve ripetere il contenuto di quel contratto.

#### Details
Le Contract References propagano l'analisi di impatto: una modifica del contratto riferito segnala il contratto dipendente per la revisione. Un contratto che ripete un fatto posseduto da un altro requisito resta invariato quando quel fatto cambia, e il modello finisce per contraddirsi senza che l'analisi di impatto lo segnali.

#### Metadata
  * type: requirement

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### File di governo collegati al modello

Ogni workflow di CI, hook Git, file di build del container, esempio Compose, file di esclusione, configurazione del gestore di pacchetti, del compilatore o del runner di test e script del repository deve essere riferito da almeno un requisito o una verifica del modello.

#### Details
Un file che codifica decisioni ingegneristiche senza un collegamento al modello cambia senza che alcun obbligo lo segnali, e le decisioni presenti solo nei file divergono fra file simili, per esempio fra i workflow di controllo e quello di pubblicazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/TerminalConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Formulazione normativa degli obblighi

Gli enunciati dei requisiti e i testi dei contratti devono esprimere gli obblighi con «deve» o «devono» e non devono usare `può`, `possono`, `potrebbe`, `potrebbero`, `dovrebbe`, `dovrebbero` o `eventualmente`; un'opzione lasciata a una parte deve essere espressa nominando la parte che sceglie.

#### Details
Il testo in code span, i messaggi citati e i nomi di elementi tra «» non sono formulazione dell'obbligo. Le sezioni Details dei requisiti sono indicazioni e non vengono controllate. Una formula permissiva rende ambiguo se il comportamento è obbligatorio, facoltativo o scelto da qualcuno, e il codice e il modello finiscono per darne letture diverse.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/TerminalConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Identificazione del client terminale nella sessione

Quando il client apre la sessione conversazionale, deve presentarsi al backend con un identificativo di client stabile e un nome leggibile, configurabili all'avvio e con un valore predefinito ricavato dalla macchina.

#### Metadata
  * type: requirement

#### Contract References
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)

#### Relations
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Installazione delle dipendenze con pnpm

Quando si installano le dipendenze del client terminale, l'installazione deve usare pnpm alla versione dichiarata nel repository e il lockfile versionato senza modificarlo, deve ammettere gli script di build soltanto alle dipendenze elencate nella configurazione di pnpm e deve applicare l'attesa minima di pnpm per le versioni appena pubblicate.

#### Details
Lo stesso gestore di pacchetti e le stesse regole di installazione usate da backend e satellite rendono riproducibili le installazioni locali e in CI e limitano l'esecuzione di codice delle dipendenze durante l'installazione.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [pnpm-lock.yaml](../../pnpm-lock.yaml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
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

Quando il client terminale mostra in una conversazione consultata un turno nello stato `pending`, il client deve invitare la persona ad aggiornare manualmente la consultazione più tardi per conoscerne l'esito.

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

### Protezione dei workflow di CI

Ogni workflow GitHub Actions del repository deve concedere al token del workflow soltanto la lettura dei contenuti, deve usare action di terzi fissate a un commit, deve limitare la durata di ogni job, deve eseguire il checkout senza conservare le credenziali e deve dichiarare il trigger con cui altri workflow lo richiamano.

#### Details
Un'action indicata con un tag mobile o un token con permessi di scrittura espongono il repository a modifiche non revisionate; un job senza limite di durata occupa il runner fino al limite della piattaforma.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
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

Quando la sessione conversazionale si chiude prima dell'esito di un turno, oppure il backend comunica `turn.interrupted`, il client deve mostrare lo stato locale «Risposta interrotta» («Response interrupted» con l'interfaccia in inglese) senza trasformare automaticamente l'interruzione in uno scambio di errore conservato.

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

#### Contract References
  * [Profilo di protezione dei workflow GitHub Actions](../Contracts/TerminalConversation.md#profilo-di-protezione-dei-workflow-github-actions)

#### Relations
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Scelta della lingua dell'interfaccia del client terminale

All'avvio del client, il client deve stabilire come lingua dell'interfaccia l'italiano o l'inglese indicati con l'opzione di avvio o la variabile d'ambiente dedicate, con l'opzione che prevale sulla variabile; quando nessuna delle due indica la lingua, deve seguire la lingua del sistema; quando il valore indicato non è una lingua supportata, deve terminare l'avvio con un'indicazione d'uso.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * satisfiedBy: [i18n.ts](../../src/i18n.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stack del client terminale

Il client terminale deve essere implementato in TypeScript per Node.js e offrire una schermata conversazionale persistente a due pannelli mediante Terminal Kit.

#### Metadata
  * type: requirement

#### Contract References
  * [Installazione con pnpm 12.11.2](../Contracts/TerminalConversation.md#installazione-con-pnpm-12112)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [.gitignore](../../.gitignore)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [tsconfig.json](../../tsconfig.json)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stato del turno in elaborazione alla riapertura

Quando lo storico di una conversazione consultata nel client terminale contiene un turno nello stato `pending`, il client deve mostrare il testo di quel turno seguito dall'indicazione del turno in elaborazione, distinta dagli scambi conclusi; a una nuova consultazione in cui lo storico riporta l'esito conservato del turno, il client deve mostrare lo scambio concluso al posto di quell'indicazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Contratti pubblici del backend Ambrogio](../Contracts/TerminalConversation.md#contratti-pubblici-del-backend-ambrogio)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Testi del client terminale nella lingua dell'interfaccia

Mentre il client è attivo, il client deve presentare nella lingua dell'interfaccia stabilita all'avvio ogni testo prodotto dal client stesso, compresi indicazioni d'uso, messaggi di avvio, etichette e comandi della schermata, stati, errori locali e nome leggibile inviato al backend, e deve mostrare senza traduzione i testi ricevuti dal backend, come risposte e messaggi pubblici di errore o rifiuto.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * satisfiedBy: [i18n.ts](../../src/i18n.ts)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Verifiche manuali giustificate

Ogni verifica di ispezione, analisi o dimostrazione deve indicare il motivo per cui non è automatizzabile, in una frase che inizia con «Non automatizzabile:».

#### Details
Una verifica automatizzabile è una verifica di test. Reqvire registra che una verifica esiste, non che sia stata eseguita: una verifica manuale non ripetuta dopo una modifica lascia passare una violazione del requisito.

#### Metadata
  * type: requirement

#### Contract References
  * [Script di integrità del modello](../Contracts/TerminalConversation.md#script-di-integrità-del-modello)

#### Relations
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Versioni esatte delle dipendenze dirette

Il manifest `package.json` del client terminale deve dichiarare ogni dipendenza diretta con una versione esatta, uguale a quella risolta nel lockfile, senza intervalli di versione.

#### Details
Una versione esatta rende esplicito nel manifest ogni aggiornamento di dipendenza e lo sottopone a revisione; gli intervalli `^` e `~` lasciano al lockfile la scelta effettiva della versione.

#### Metadata
  * type: requirement

#### Relations
  * satisfiedBy: [package.json](../../package.json)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Vista persistente della conversazione

Quando il client è attivo in un terminale interattivo, deve mostrare l'elenco delle conversazioni a sinistra e la conversazione corrente a destra, mantenendo visibili la conversazione e il campo di scrittura mentre la persona compone, invia e riceve un turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)

#### Relations
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

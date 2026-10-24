# Elements

### Anteprima delle conversazioni nella barra laterale del client terminale

Quando il client terminale mostra nella barra laterale una pagina dell'elenco conversazioni, deve presentare l'anteprima del primo messaggio della persona su una sola riga, troncata alla larghezza della barra con «…», e, per una conversazione il cui storico non è disponibile, deve mostrare come identificativo abbreviato i primi 8 caratteri dell'identificativo della conversazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * derivedFrom: [Anteprima delle conversazioni nell'elenco dei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#anteprima-delle-conversazioni-nellelenco-dei-client-testuali)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Audit delle dipendenze nella CI del client terminale

Quando la CI del client terminale si esegue, il job `Terminal client checks` deve eseguire l'audit delle dipendenze del client dopo la loro installazione congelata e deve fallire se l'audit trova una vulnerabilità di gravità alta o critica non elencata fra le eccezioni accettate del modello.

#### Details
Il client non ha eccezioni: `pnpm-workspace.yaml` non dichiara `auditConfig`.

#### Metadata
  * type: requirement

#### Contract References
  * [Audit delle dipendenze con pnpm](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#audit-delle-dipendenze-con-pnpm)

#### Relations
  * derivedFrom: [Audit delle vulnerabilità delle dipendenze](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#audit-delle-vulnerabilità-delle-dipendenze)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
---

### Client conversazionale nel terminale

Ambrogio deve fornire alla famiglia un client di chat testuale utilizzabile dal terminale, collegato al backend tramite il protocollo conversazionale `ambrogio.v1` e le API HTTP pubbliche di consultazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [cli.ts](../../src/cli.ts)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Comando di verifica completo del client terminale

Il client terminale deve offrire il comando `pnpm verify`, che esegue in locale i controlli del job `Terminal client checks` nell'ordine del comando di verifica completo comune e termina con esito non riuscito al primo controllo fallito.

#### Details
Dopo i controlli del modello, l'installazione congelata, l'audit e la preparazione del backend affiancato in `../ambrogio-backend` con `pnpm install --frozen-lockfile` e `pnpm build`, i comandi del job della CI successivi all'installazione del client sono, in quest'ordine: `pnpm typecheck`, `pnpm test`, `pnpm test:backend`, `pnpm build`.

#### Metadata
  * type: requirement

#### Contract References
  * [Comando di verifica completo con pnpm](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#comando-di-verifica-completo-con-pnpm)

#### Relations
  * derivedFrom: [Comando di verifica completo](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#comando-di-verifica-completo)
  * satisfiedBy: [package.json](../../package.json)
---

### Controlli CI del client terminale

Quando la CI del client terminale si esegue, il job `Terminal client checks` deve eseguire i controlli dell'intero modello sulla cartella di lavoro con i repository affiancati, il controllo TypeScript senza emissione, la suite di test del client, la prova di integrazione con il backend affiancato e la compilazione, e deve fallire se uno di questi controlli fallisce.

#### Details
I trigger sono `push` sul branch `main`, `pull_request`, `workflow_dispatch` e `workflow_call`. Il job esegue il checkout del client in `workspace/ambrogio-cli` con la storia completa, clona `ambrogio-model` in `workspace/ambrogio-model` sul branch con lo stesso nome della modifica se esiste e altrimenti su `main`, poi esegue `checkout-workspace` e `model-checks` di `ambrogio-model` sulla cartella `workspace`, secondo i contratti comuni. Il job usa Node.js 24, la versione minima del client, e attiva pnpm con `corepack enable` secondo il profilo comune di installazione con pnpm e Corepack, con `COREPACK_ENABLE_DOWNLOAD_PROMPT` uguale a `0` a livello di job. Subito dopo, nella cartella `workspace/ambrogio-backend` il job riporta nel log il commit del backend usato, installa le dipendenze del backend con `pnpm install --frozen-lockfile` e lo compila con `pnpm build`: eseguito in quella cartella, Corepack usa la versione di pnpm dichiarata in `packageManager` dal `package.json` del backend. Nella cartella del client seguono l'installazione congelata delle dipendenze con `pnpm install --frozen-lockfile`, l'audit `pnpm audit --audit-level high` secondo l'audit comune delle dipendenze con pnpm, poi `pnpm typecheck`; `pnpm test`, che usa il backend simulato locale; la prova di integrazione `pnpm test:backend` contro il backend affiancato; `pnpm build`. Prima di `pnpm test` il job installa gitleaks come indicato dal profilo di scansione dei segreti del client terminale, perché la suite di test prova l'hook pre-commit e il comando di scansione.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti del client terminale](../Contracts/TerminalConversation.md#profilo-di-scansione-dei-segreti-del-client-terminale)
  * [Audit delle dipendenze con pnpm](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#audit-delle-dipendenze-con-pnpm)
  * [Checkout affiancato dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#checkout-affiancato-dello-spazio-di-lavoro)
  * [Controlli del modello dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-dello-spazio-di-lavoro)
  * [Profilo di installazione con pnpm e Corepack](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-installazione-con-pnpm-e-corepack)

#### Relations
  * derivedFrom: [Controlli CI dei repository di Ambrogio](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-ci-dei-repository-di-ambrogio)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Controlli del modello prima del commit del client terminale

Quando si crea un commit in un clone del client terminale con gli hook versionati attivi, l'hook `.githooks/pre-commit` deve eseguire, dopo la scansione dei segreti, i controlli dell'intero modello con `scripts/model-checks` del checkout di `ambrogio-model` affiancato al repository, e deve impedire il commit se quei controlli falliscono o se `ambrogio-model` non è affiancato.

#### Metadata
  * type: requirement

#### Contract References
  * [Controlli del modello dello spazio di lavoro](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-dello-spazio-di-lavoro)
  * [Controlli del modello nell'hook pre-commit](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#controlli-del-modello-nellhook-pre-commit)

#### Relations
  * derivedFrom: [Controlli del modello prima del commit](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-del-modello-prima-del-commit)
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
---

### Controlli obbligatori prima del merge del client terminale

Quando una modifica viene integrata nel branch principale del client terminale, il repository GitHub deve richiedere il superamento del job `Terminal client checks` della CI e del job `Gitleaks` della scansione dei segreti.

#### Metadata
  * type: requirement

#### Contract References
  * [Ruleset del branch principale](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#ruleset-del-branch-principale)

#### Relations
  * derivedFrom: [Controlli obbligatori prima del merge](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controlli-obbligatori-prima-del-merge)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Controllo dei segreti prima del commit del client terminale

Il client terminale deve applicare il controllo dei segreti prima del commit con l'hook versionato `.githooks/pre-commit` del repository.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di scansione dei segreti con gitleaks](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-scansione-dei-segreti-con-gitleaks)

#### Relations
  * derivedFrom: [Controllo dei segreti prima del commit](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#controllo-dei-segreti-prima-del-commit)
  * satisfiedBy: [pre-commit](../../.githooks/pre-commit)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
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

Quando si installano le dipendenze del client terminale, l'installazione deve usare pnpm alla versione dichiarata nel repository, attivato con Corepack nella CI, e il lockfile versionato senza modificarlo, deve ammettere gli script di build soltanto alle dipendenze elencate nella configurazione di pnpm e deve applicare l'attesa minima di pnpm per le versioni appena pubblicate.

#### Details
Lo stesso gestore di pacchetti e le stesse regole di installazione usate da backend e satellite rendono riproducibili le installazioni locali e in CI e limitano l'esecuzione di codice delle dipendenze durante l'installazione.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di installazione con pnpm e Corepack](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-installazione-con-pnpm-e-corepack)

#### Relations
  * derivedFrom: [Installazione delle dipendenze con pnpm attivato da Corepack](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#installazione-delle-dipendenze-con-pnpm-attivato-da-corepack)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [pnpm-lock.yaml](../../pnpm-lock.yaml)
  * satisfiedBy: [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
---

### Invio del turno dal client terminale

Quando la famiglia invia un turno dal client terminale, il client deve trasmetterlo sull'unica sessione conversazionale `ambrogio.v1` del processo, aprendola al primo turno e riaprendola al turno successivo quando si è chiusa.

#### Metadata
  * type: requirement

#### Contract References
  * [Schema JSON del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#schema-json-del-protocollo-ambrogio-v1)
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Trasmissione in ingresso del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-ingresso-del-protocollo-ambrogio-v1)

#### Relations
  * derivedFrom: [Invio del turno testuale sul canale conversazionale](../../../ambrogio-model/system-model/Requirements/TextConversation.md#invio-del-turno-testuale-sul-canale-conversazionale)
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Invito ad aggiornare la conversazione in elaborazione

Quando il client terminale mostra in una conversazione consultata un turno nello stato `pending`, il client deve invitare la persona ad aggiornare manualmente la consultazione più tardi per conoscerne l'esito, con il testo della voce «Turno in elaborazione alla riapertura» del catalogo dei testi del client terminale.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Stati del turno testuale alla riapertura](../../../ambrogio-model/system-model/Contracts/TextConversation.md#stati-del-turno-testuale-alla-riapertura)

#### Relations
  * derivedFrom: [Stato del turno in elaborazione alla riapertura nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#stato-del-turno-in-elaborazione-alla-riapertura-nei-client-testuali)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Istruzioni per gli agenti del client terminale

Le istruzioni per gli agenti del repository del client terminale devono applicare al lavoro nel repository le regole di processo di `ambrogio-model`, rimandando a `ambrogio-model/AGENTS.md` per le regole comuni e aggiungendo soltanto le indicazioni proprie del repository.

#### Metadata
  * type: requirement

#### Relations
  * derivedFrom: [Ordine di lavoro guidato dal modello](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#ordine-di-lavoro-guidato-dal-modello)
  * satisfiedBy: [AGENTS.md](../../AGENTS.md)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
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

### Nuova chat iniziale del client terminale

All'avvio del processo, il client terminale deve mostrare la nuova chat iniziale come prima voce della barra laterale, con il testo della voce «Voce della nuova chat» del catalogo dei testi del client terminale, e la chat corrente nel pannello destro.

#### Metadata
  * type: requirement

#### Contract References
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * derivedFrom: [Nuova chat iniziale nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#nuova-chat-iniziale-nei-client-testuali)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione degli errori HTTP nel client terminale

Quando il client terminale riceve dall'API HTTP versionata del backend una risposta d'errore durante la lettura dell'elenco o dello storico, deve riconoscerne il significato soltanto dal membro `type` del Problem Details, mostrare il testo della voce «Conversazione inesistente» del catalogo dei testi del client terminale per `/problems/conversation-not-found` e il testo della voce «Errore HTTP generico» per ogni altro `type` o per una risposta d'errore che non è un Problem Details, senza mostrare `title` o `detail` del backend.

#### Details
Il client legge `type` soltanto da una risposta con `Content-Type` `application/problem+json` e un corpo JSON oggetto con `type` stringa.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Catalogo dei problemi di protocollo HTTP](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#catalogo-dei-problemi-di-protocollo-http)
  * [Forma dei Problem Details dell'API HTTP](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#forma-dei-problem-details-dellapi-http)
  * [Versioni dell'API HTTP pubblica](../../../ambrogio-backend/system-model/Contracts/HttpApi.md#versioni-dellapi-http-pubblica)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)

#### Relations
  * derivedFrom: [Interpretazione degli errori HTTP per tipo da parte del client](../../../ambrogio-backend/system-model/Requirements/HttpApi.md#interpretazione-degli-errori-http-per-tipo-da-parte-del-client)
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * satisfiedBy: [i18n.ts](../../src/i18n.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione del rifiuto del turno nel client terminale

Quando il client terminale riceve `turn.rejected` per un turno, deve mostrare nella chat il messaggio pubblico contenuto in `message` come esito di errore del turno e, quando il messaggio manca, il testo della voce «`turn.rejected` senza messaggio» del catalogo dei testi del client terminale.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Motivi di rifiuto del turno](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#motivi-di-rifiuto-del-turno)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)

#### Relations
  * derivedFrom: [Presentazione del rifiuto del turno da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#presentazione-del-rifiuto-del-turno-da-parte-del-client)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Presentazione dell'errore dopo l'ammissione nel client terminale

Quando il client terminale riceve `turn.failed` per un turno ammesso, deve mostrare nella chat il messaggio pubblico contenuto in `message` come esito di errore del turno, al posto dei frammenti di risposta già mostrati per quel turno, e, quando il messaggio manca, il testo della voce «`turn.failed` senza messaggio» del catalogo dei testi del client terminale.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)

#### Relations
  * derivedFrom: [Presentazione dell'errore dopo l'ammissione da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#presentazione-dellerrore-dopo-lammissione-da-parte-del-client)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Protezione dei workflow di CI

I workflow GitHub Actions del client terminale, `.github/workflows/ci.yml` e `.github/workflows/secret-scan.yml`, devono applicare il profilo comune dei workflow GitHub Actions con i valori propri del client terminale.

#### Details
Un'action indicata con un tag mobile o un token con permessi di scrittura espongono il repository a modifiche non revisionate; un job senza limite di durata occupa il runner fino al limite della piattaforma.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo comune dei workflow GitHub Actions](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-comune-dei-workflow-github-actions)

#### Relations
  * derivedFrom: [Workflow GitHub Actions con privilegi e durata limitati](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#workflow-github-actions-con-privilegi-e-durata-limitati)
  * satisfiedBy: [ci.yml](../../.github/workflows/ci.yml)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
---

### Riconoscimento del completamento della risposta nel client terminale

Quando un turno inviato dal client terminale si conclude, il client deve presentare la risposta come completata correttamente, con lo stato della voce «Turno riuscito» del catalogo dei testi del client terminale, soltanto se ha ricevuto `turn.completed` per quel turno.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Trasmissione in uscita del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-uscita-del-protocollo-ambrogio-v1)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Sessione ambrogio.v1 del client terminale](../Contracts/TerminalConversation.md#sessione-ambrogiov1-del-client-terminale)

#### Relations
  * derivedFrom: [Riconoscimento dell'esito riuscito del turno da parte del client](../../../ambrogio-backend/system-model/Requirements/ConversationProtocol.md#riconoscimento-dellesito-riuscito-del-turno-da-parte-del-client)
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Rifiuto locale del turno testuale nel client terminale

Quando la persona invia dal client terminale un testo vuoto, composto di soli spazi o più grande di 64 KiB in UTF-8, il client deve rifiutarlo mostrando il testo della voce «Testo vuoto» o «Testo oltre 64 KiB» del catalogo dei testi del client terminale, senza aprire la sessione conversazionale e senza trasmettere il testo al backend.

#### Metadata
  * type: requirement

#### Contract References
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Sessione ambrogio.v1 del client terminale](../Contracts/TerminalConversation.md#sessione-ambrogiov1-del-client-terminale)

#### Relations
  * derivedFrom: [Rifiuto locale del turno testuale non trasmissibile](../../../ambrogio-model/system-model/Requirements/TextConversation.md#rifiuto-locale-del-turno-testuale-non-trasmissibile)
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Ripartenza dell'elenco conversazioni del client terminale

Quando la persona aggiorna l'elenco delle conversazioni con il comando di aggiornamento della schermata, il client terminale deve richiedere la prima pagina dell'elenco senza cursore e presentare le voci nell'ordine della nuova prima pagina, proseguendo poi con il riferimento alla pagina successiva ricevuto con essa.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * derivedFrom: [Ripartenza dell'elenco conversazioni dei client testuali dopo un aggiornamento](../../../ambrogio-model/system-model/Requirements/TextConversation.md#ripartenza-dellelenco-conversazioni-dei-client-testuali-dopo-un-aggiornamento)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Scansione dei segreti nella CI del client terminale

Il client terminale deve eseguire la scansione dei segreti dell'intera storia nel job `Gitleaks` del workflow `.github/workflows/secret-scan.yml`.

#### Metadata
  * type: requirement

#### Contract References
  * [Profilo di protezione dei workflow GitHub Actions](../Contracts/TerminalConversation.md#profilo-di-protezione-dei-workflow-github-actions)
  * [Profilo di scansione dei segreti con gitleaks](../../../ambrogio-model/system-model/Contracts/ModelDrivenDevelopment.md#profilo-di-scansione-dei-segreti-con-gitleaks)

#### Relations
  * derivedFrom: [Scansione dei segreti nella CI](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#scansione-dei-segreti-nella-ci)
  * satisfiedBy: [secret-scan.yml](../../.github/workflows/secret-scan.yml)
  * specify: [Sviluppo governato dal modello](../../../ambrogio-model/system-model/Capabilities/Engineering.md#sviluppo-governato-dal-modello)
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

### Segnalazione locale dell'interruzione della chat testuale

Quando un turno inviato dal client terminale si conclude come interrotto, il client deve mostrare lo stato locale «Risposta interrotta» («Response interrupted» con l'interfaccia in inglese), con i testi delle voci «Turno interrotto localmente» e «Turno interrotto» del catalogo dei testi del client terminale.

#### Metadata
  * type: requirement

#### Contract References
  * [Esiti del turno nel protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#esiti-del-turno-nel-protocollo-ambrogio-v1)
  * [Trasmissione in uscita del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#trasmissione-in-uscita-del-protocollo-ambrogio-v1)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Sessione ambrogio.v1 del client terminale](../Contracts/TerminalConversation.md#sessione-ambrogiov1-del-client-terminale)

#### Relations
  * derivedFrom: [Segnalazione locale dell'interruzione nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#segnalazione-locale-dellinterruzione-nei-client-testuali)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
---

### Stack del client terminale

Il client terminale deve essere implementato in TypeScript per Node.js e offrire una schermata conversazionale persistente a due pannelli mediante Terminal Kit.

#### Details
Origine: baseline Reqvire «Strict TypeScript compilation», adottata; «ESM build for Node.js», adattata: un solo `tsconfig.json` compila `src` e `test` in `dist`, con le librerie `ES2022` e `DOM`, senza un `tsconfig.build.json` separato; «Vitest as test runner», adattata: il client terminale esegue i test compilati in `dist/test/` con il runner integrato di Node.js, `node --test`, invece di Vitest.

#### Metadata
  * type: requirement

#### Contract References
  * [Installazione delle dipendenze del client terminale con pnpm](../Contracts/TerminalConversation.md#installazione-delle-dipendenze-del-client-terminale-con-pnpm)
  * [Schermata conversazionale a due pannelli](../Contracts/TerminalConversation.md#schermata-conversazionale-a-due-pannelli)

#### Relations
  * satisfiedBy: [.gitignore](../../.gitignore)
  * satisfiedBy: [package.json](../../package.json)
  * satisfiedBy: [tsconfig.json](../../tsconfig.json)
  * specify: [Conversazione testuale nel terminale](../Capabilities/TerminalConversation.md#conversazione-testuale-nel-terminale)
---

### Stato del turno in elaborazione alla riapertura nel client terminale

Quando lo storico di una conversazione consultata nel client terminale contiene un turno nello stato `pending`, il client deve mostrare il testo di quel turno seguito dall'indicazione del turno in elaborazione; quando lo storico riporta un turno nello stato `interrupted`, deve mostrarlo con il testo della voce «Turno interrotto nello storico» del catalogo dei testi del client terminale.

#### Metadata
  * type: requirement

#### Contract References
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Stati persistenti dei turni conversazionali](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#stati-persistenti-dei-turni-conversazionali)
  * [Catalogo dei testi del client terminale](../Contracts/TerminalConversation.md#catalogo-dei-testi-del-client-terminale)
  * [Stati del turno testuale alla riapertura](../../../ambrogio-model/system-model/Contracts/TextConversation.md#stati-del-turno-testuale-alla-riapertura)

#### Relations
  * derivedFrom: [Stato del turno in elaborazione alla riapertura nei client testuali](../../../ambrogio-model/system-model/Requirements/TextConversation.md#stato-del-turno-in-elaborazione-alla-riapertura-nei-client-testuali)
  * satisfiedBy: [tui.ts](../../src/tui.ts)
  * specify: [Conversazione familiare](../../../ambrogio-model/system-model/Capabilities/Product.md#conversazione-familiare)
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

### Uso delle sole interfacce pubbliche del backend nel client terminale

Quando il client terminale comunica con il backend, deve usare soltanto il protocollo `ambrogio.v1` e le API HTTP pubbliche definite dai contratti del backend, e il suo codice di produzione non deve importare codice del backend.

#### Details
Le prove di integrazione importano dal backend affiancato nella cartella di lavoro soltanto l'ingresso di prova pubblico del server conversazionale, senza fissare una revisione del backend. `pnpm test:backend` usa il backend compilato in `../ambrogio-backend` rispetto al client, oppure nella cartella indicata da `AMBROGIO_BACKEND_REPO`, e riporta come evidenza il commit del backend usato.

#### Metadata
  * type: requirement

#### Contract References
  * [Schema JSON del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#schema-json-del-protocollo-ambrogio-v1)
  * [Sessione del protocollo Ambrogio v1](../../../ambrogio-backend/system-model/Contracts/ConversationProtocol.md#sessione-del-protocollo-ambrogio-v1)
  * [Risposta HTTP dell'elenco conversazioni](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dellelenco-conversazioni)
  * [Risposta HTTP dello storico conversazionale](../../../ambrogio-backend/system-model/Contracts/FamilyConversation.md#risposta-http-dello-storico-conversazionale)
  * [Ingresso di prova del server conversazionale](../../../ambrogio-backend/system-model/Contracts/ServerFoundation.md#ingresso-di-prova-del-server-conversazionale)
  * [Avvio locale del client da checkout](../Contracts/TerminalConversation.md#avvio-locale-del-client-da-checkout)

#### Relations
  * derivedFrom: [Uso delle sole interfacce pubbliche del backend](../../../ambrogio-model/system-model/Requirements/CodeArchitecture.md#uso-delle-sole-interfacce-pubbliche-del-backend)
  * satisfiedBy: [backend.ts](../../src/backend.ts)
  * specify: [Architettura del codice](../../../ambrogio-model/system-model/Capabilities/Engineering.md#architettura-del-codice)
---

### Versioni esatte delle dipendenze dirette

Il manifest `package.json` del client terminale deve dichiarare ogni dipendenza diretta con una versione esatta, uguale a quella risolta nel lockfile, senza intervalli di versione.

#### Details
Una versione esatta rende esplicito nel manifest ogni aggiornamento di dipendenza e lo sottopone a revisione; gli intervalli `^` e `~` lasciano al lockfile la scelta effettiva della versione.

#### Metadata
  * type: requirement

#### Relations
  * derivedFrom: [Installazione delle dipendenze con pnpm attivato da Corepack](../../../ambrogio-model/system-model/Requirements/ModelDrivenDevelopment.md#installazione-delle-dipendenze-con-pnpm-attivato-da-corepack)
  * satisfiedBy: [package.json](../../package.json)
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

### Client terminale compilato provato come processo

Le prove del client terminale devono avviare il client compilato `dist/src/cli.js` come processo, verificando un avvio rifiutato per l'URL del backend mancante e, contro il backend affiancato, una conversazione riuscita nella schermata del terminale.

#### Details
Le matrici dei casi della schermata e del protocollo restano nelle prove dei singoli confini.

#### Metadata
  * type: requirement

#### Relations
  * derivedFrom: [Artefatti compilati provati come processi](../../../ambrogio-model/system-model/Requirements/CodeArchitecture.md#artefatti-compilati-provati-come-processi)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * satisfiedBy: [verify-backend.mjs](../../scripts/verify-backend.mjs)
  * specify: [Architettura del codice](../../../ambrogio-model/system-model/Capabilities/Engineering.md#architettura-del-codice)
---

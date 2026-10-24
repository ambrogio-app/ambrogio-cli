# Elements

### Verifica del client terminale

Raggruppa le prove del comportamento del client terminale e della sua integrazione con il backend HTTP.

#### Metadata
  * type: verification-objective
---

### Controllo dei commit delle action fissate

Per ogni action fissata nel profilo di protezione dei workflow GitHub Actions, confrontare il commit con il tag della versione indicata nel repository dell'action su GitHub.

#### Details
Il controllo passa se ogni commit fissato corrisponde al tag della versione indicata nel commento accanto al commit. Fallisce se un commit non appartiene al repository dell'action o non corrisponde alla versione indicata. Non automatizzabile: confermare che il commit fissato corrisponda alla versione dichiarata richiede di consultare il repository dell'action su GitHub, fuori dal repository e dalla rete disponibile ai test; il confronto dei workflow con i valori del contratto è svolto dalla «Prova della protezione dei workflow di CI».

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Protezione dei workflow di CI](../Requirements/TerminalConversation.md#protezione-dei-workflow-di-ci)
---

### Controllo del repository del client

Esaminare il codice e la configurazione del client terminale e verificare che il client sia scritto in TypeScript per Node.js e che la schermata conversazionale persistente a due pannelli sia realizzata con Terminal Kit.

#### Details
Il controllo passa se il codice di `src/` è TypeScript compilato per Node.js e la schermata usa i componenti di Terminal Kit. Fallisce se il client richiede un'altra piattaforma di esecuzione o se la schermata è realizzata con un'altra libreria. Non automatizzabile: stabilire con quale libreria è realizzata la schermata richiede di leggere il codice; la «Prova della gestione delle dipendenze» controlla soltanto il manifest e il lockfile.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
---

### Controllo dell'esecuzione della CI su GitHub

Dopo un push sul branch principale e in una pull request, osservare su GitHub Actions l'esecuzione del workflow `Terminal client CI`.

#### Details
Il controllo passa se il workflow si avvia per il push sul branch principale e per la pull request e il job `Terminal client checks` esegue tutte le fasi e termina con successo. Fallisce se il workflow non si avvia per uno dei due eventi, se una fase viene saltata o se un controllo fallito non fa fallire il job. Non automatizzabile: l'attivazione dei trigger e l'esito del job si osservano soltanto su GitHub Actions dopo un push; il testo del workflow è confrontato con le fasi richieste dalla «Prova della configurazione del percorso CI».

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Controlli CI del client terminale](../Requirements/TerminalConversation.md#controlli-ci-del-client-terminale)
---

### Controllo dell'esecuzione della scansione dei segreti su GitHub

Dopo un push su un branch e in una pull request, osservare su GitHub Actions l'esecuzione del workflow `Secret scan`.

#### Details
Il controllo passa se il workflow si avvia per il push e per la pull request, il job `Gitleaks` recupera l'intera storia del repository remoto, la verifica dell'impronta dell'archivio scaricato riesce e la scansione della storia corrente termina con successo. Fallisce se il workflow non si avvia per uno dei due eventi, se il job scansiona una storia parziale o se termina con un errore. Non automatizzabile: i trigger, la storia completa del repository remoto, l'archivio servito dalla release e l'esito del job si osservano soltanto su GitHub Actions dopo un push; il testo del workflow e il comando di scansione sono controllati dalla «Prova della configurazione della scansione dei segreti in CI».

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Scansione dei segreti nella CI del client terminale](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci-del-client-terminale)
---

### Ispezione della protezione del merge del client terminale

Leggere con `gh api repos/<proprietario>/<repository>/rulesets` e con il dettaglio del ruleset `main` le regole attive sul branch principale.

#### Details
L'ispezione passa se il ruleset corrisponde al contratto: applicazione attiva sul branch predefinito, nessun attore escluso, integrazione solo tramite pull request, controlli richiesti con i nomi del contratto, riscrittura forzata e cancellazione vietate; e se un push diretto sul branch principale viene rifiutato. Fallisce se il ruleset manca, è disattivato, ha attori esclusi o differisce dal contratto. Non automatizzabile: il ruleset è un'impostazione del repository GitHub e non un file del repository, e leggerlo richiede credenziali con accesso amministrativo che la CI non possiede.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Controlli obbligatori prima del merge del client terminale](../Requirements/TerminalConversation.md#controlli-obbligatori-prima-del-merge-del-client-terminale)
---

### Ispezione delle istruzioni per gli agenti del client terminale

Durante la revisione di ogni modifica di `AGENTS.md` del client terminale o di `ambrogio-model/AGENTS.md`, leggere le istruzioni per gli agenti del client terminale e confrontarle con le regole di processo di `ambrogio-model`.

#### Details
L'ispezione passa se le istruzioni rimandano a `ambrogio-model/AGENTS.md` per le regole comuni, non le contraddicono e aggiungono soltanto indicazioni proprie del client terminale. Fallisce se le istruzioni contraddicono una regola comune, descrivono un modello autonomo del client o una revisione fissata del backend, oppure indicano una versione di Reqvire diversa da quella di `ambrogio-model/.reqvire-version`. Non automatizzabile: confrontare istruzioni in prosa con i requisiti richiede di leggerle.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Istruzioni per gli agenti del client terminale](../Requirements/TerminalConversation.md#istruzioni-per-gli-agenti-del-client-terminale)
---

### Prova dei controlli del modello nell'hook pre-commit del client terminale

In una cartella temporanea con un repository Git che usa una copia dell'hook `.githooks/pre-commit` del client e, accanto, un finto `ambrogio-model/scripts/model-checks` che registra la propria esecuzione e termina con un esito scelto dalla prova, tentare un commit privo di segreti con lo script che riesce, poi con lo script che fallisce; ripetere senza `ambrogio-model` affiancato e con un file che contiene un token fittizio.

#### Details
La prova passa se con lo script che riesce il commit è creato e lo script è stato eseguito; se con lo script che fallisce il commit è rifiutato e l'output riporta il messaggio dello script; se senza `ambrogio-model` affiancato il commit è rifiutato con il messaggio del contratto comune che indica di clonare `ambrogio-model` accanto al repository; e se il commit con il token è rifiutato senza eseguire lo script. Fallisce se uno di questi esiti differisce. Lo script finto sostituisce i controlli reali del modello, provati da «Prova dei controlli del modello dello spazio di lavoro», così che la suite resti veloce.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [secrets.test.ts](../../test/secrets.test.ts)
  * verify: [Controlli del modello prima del commit del client terminale](../Requirements/TerminalConversation.md#controlli-del-modello-prima-del-commit-del-client-terminale)
---

### Prova del client conversazionale nel terminale

Avviare il backend affiancato nella cartella di lavoro tramite il suo ingresso di prova pubblico, «Ingresso di prova del server conversazionale», e il client terminale come processi distinti, rendendo disponibili al client soltanto il canale conversazionale `ambrogio.v1` e le API HTTP pubbliche del backend. Dal terminale inviare un nuovo turno e osservare una risposta prodotta in più frammenti; consultare le conversazioni conservate e proseguire quella creata, recuperandone lo storico dal backend. Ripetere con un turno rifiutato, per esempio la continuazione di una conversazione occupata, con un errore dopo l'ammissione a risposta già iniziata e con la chiusura della sessione prima dell'esito.

#### Details
La prova passa se la persona può conversare dal terminale, osserva i frammenti durante la generazione e può consultare e continuare una conversazione conservata tramite le interfacce pubbliche. Il turno risulta riuscito soltanto con `turn.completed`; `turn.rejected` e `turn.failed` mostrano il loro messaggio pubblico al posto dei frammenti; la chiusura della sessione o `turn.interrupted` mostrano «Risposta interrotta». Fallisce se il client richiede un'interfaccia grafica, accede direttamente all'archivio o ai componenti server, usa per i turni un trasporto diverso dal canale `ambrogio.v1`, oppure presenta come riuscito un turno privo di `turn.completed`. La prova usa il backend affiancato così com'è, senza fissarne una revisione, e importa dal backend soltanto l'ingresso di prova.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-backend.mjs](../../scripts/verify-backend.mjs)
  * satisfiedBy: [backend.test.ts](../../test/backend.test.ts)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Client conversazionale nel terminale](../Requirements/TerminalConversation.md#client-conversazionale-nel-terminale)
  * verify: [Invio del turno dal client terminale](../Requirements/TerminalConversation.md#invio-del-turno-dal-client-terminale)
  * verify: [Presentazione del rifiuto del turno nel client terminale](../Requirements/TerminalConversation.md#presentazione-del-rifiuto-del-turno-nel-client-terminale)
  * verify: [Presentazione dell'errore dopo l'ammissione nel client terminale](../Requirements/TerminalConversation.md#presentazione-dellerrore-dopo-lammissione-nel-client-terminale)
  * verify: [Riconoscimento del completamento della risposta nel client terminale](../Requirements/TerminalConversation.md#riconoscimento-del-completamento-della-risposta-nel-client-terminale)
  * verify: [Segnalazione locale dell'interruzione della chat testuale](../Requirements/TerminalConversation.md#segnalazione-locale-dellinterruzione-della-chat-testuale)
  * verify: [Uso delle sole interfacce pubbliche del backend nel client terminale](../Requirements/TerminalConversation.md#uso-delle-sole-interfacce-pubbliche-del-backend-nel-client-terminale)
---

### Prova del comando di verifica completo del client terminale

Leggere lo script `verify` di `package.json` e i comandi del job `checks` di `.github/workflows/ci.yml`.

#### Details
La prova passa se lo script `verify` è la sequenza, unita da `&&`, di `../ambrogio-model/scripts/model-checks`, `pnpm install --frozen-lockfile`, `pnpm audit --audit-level high`, `(cd ../ambrogio-backend && pnpm install --frozen-lockfile && pnpm build)` e dei comandi `pnpm` che il job esegue nella cartella del client dopo l'installazione e l'audit, nello stesso ordine. Fallisce se lo script manca, omette o riordina un comando, o se il workflow cambia i propri controlli senza che lo script li segua.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Comando di verifica completo del client terminale](../Requirements/TerminalConversation.md#comando-di-verifica-completo-del-client-terminale)
---

### Prova del rifiuto locale del turno testuale nel client terminale

Contro un backend controllato, inviare dal client terminale un testo composto di soli spazi e un testo di oltre 64 KiB in UTF-8, poi un testo ammesso; osservare gli errori mostrati e le sessioni aperte sul backend.

#### Details
La prova passa se i due testi non ammessi sono rifiutati con le voci «Testo vuoto» e «Testo oltre 64 KiB» del catalogo dei testi, senza che il backend riceva `session.hello` né alcun messaggio del turno, e il testo ammesso apre la sessione e conclude il turno. Fallisce se un testo non ammesso apre la sessione o è trasmesso al backend, oppure se il rifiuto non mostra il messaggio del catalogo. I test del modulo di comunicazione con il backend verificano entrambi i limiti nelle due lingue, compreso un testo di esattamente 64 KiB, che è ammesso; i test in terminale simulato verificano che la schermata, che applica lo stesso controllo, mostri nella riga di stato la voce «Testo vuoto» per un testo vuoto e per uno di soli spazi senza aprire la sessione né cambiare il nome della nuova chat. Scrivere oltre 64 KiB tasto per tasto nel terminale simulato richiede troppo tempo per la suite di test.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [backend.test.ts](../../test/backend.test.ts)
  * satisfiedBy: [tui.test.ts](../../test/tui.test.ts)
  * verify: [Rifiuto locale del turno testuale nel client terminale](../Requirements/TerminalConversation.md#rifiuto-locale-del-turno-testuale-nel-client-terminale)
---

### Prova dell'assenza di import del backend nel client terminale

Leggere come testo ogni file del codice di produzione in `src/` e raccogliere gli specificatori dei suoi `import`, `export … from` e `import()` dinamici.

#### Details
La prova passa se nessuno specificatore indica un percorso del repository `ambrogio-backend`, un percorso relativo che esce dalla radice del client o un pacchetto del backend. Fallisce se il codice di produzione importa codice del backend, anche compilato.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [imports.test.ts](../../test/imports.test.ts)
  * verify: [Uso delle sole interfacce pubbliche del backend nel client terminale](../Requirements/TerminalConversation.md#uso-delle-sole-interfacce-pubbliche-del-backend-nel-client-terminale)
---

### Prova dell'audit delle dipendenze nella CI del client terminale

Leggere come testo `.github/workflows/ci.yml` e `pnpm-workspace.yaml` del client.

#### Details
La prova passa se il job `checks` esegue `pnpm audit --audit-level high` nella cartella `workspace/ambrogio-cli` subito dopo `pnpm install --frozen-lockfile` del client e prima di `pnpm typecheck`, se nessun comando `pnpm audit` del workflow usa `--ignore`, `--ignore-unfixable`, `--ignore-registry-errors`, `--prod` o `--dev`, e se ogni voce di `auditConfig` in `pnpm-workspace.yaml` è un singolo identificativo GHSA sotto `ignoreGhsas`. Fallisce se l'audit manca, è in un'altra posizione, ignora avvisi con un'opzione o se un'eccezione non è un singolo identificativo. L'esito dell'audit sul registro npm è dato dall'esecuzione del job, non da questa prova, che resta senza accesso alla rete.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Audit delle dipendenze nella CI del client terminale](../Requirements/TerminalConversation.md#audit-delle-dipendenze-nella-ci-del-client-terminale)
---

### Prova dell'hook pre-commit dei segreti del client terminale

In un repository Git temporaneo con `core.hooksPath` rivolto alla cartella `.githooks` del client, mettere in staging un file con un token fittizio riconosciuto da gitleaks, generato durante la prova, e tentare il commit; ripetere con un file privo di segreti e con un `PATH` che non contiene `gitleaks`.

#### Details
La prova passa se il commit con il token fittizio viene rifiutato senza che l'output ne riporti il valore, il commit senza segreti riesce e, senza `gitleaks` nel `PATH`, il commit viene rifiutato con il messaggio che indica di installare gitleaks 8.30.1. Il repository temporaneo viene eliminato dopo la prova. Fallisce se il commit con il token fittizio viene creato, se l'output riporta il valore del token, se il commit senza segreti viene rifiutato o se senza gitleaks il commit viene creato o il messaggio non indica come installarlo. La prova richiede gitleaks nel `PATH`, che il job `checks` della CI installa.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [secrets.test.ts](../../test/secrets.test.ts)
  * verify: [Controllo dei segreti prima del commit del client terminale](../Requirements/TerminalConversation.md#controllo-dei-segreti-prima-del-commit-del-client-terminale)
---

### Prova dell'identità del client nella sessione

Avviare il client contro un backend controllato senza configurazione dell'identità, poi con `AMBROGIO_CLIENT_ID`, poi con `--client-id` insieme alla variabile; inviare un turno in ciascun caso e osservare `session.hello`. Ripetere il caso senza configurazione con l'interfaccia in inglese. Provare anche un valore vuoto.

#### Details
La prova passa se senza configurazione il `clientId` è `cli-<nome host>` e il `name` è `Terminale <nome host>` con l'interfaccia in italiano e `Terminal <nome host>` con l'interfaccia in inglese, con lo stesso `clientId`; se la variabile sostituisce il valore predefinito e l'opzione prevale sulla variabile, e se un valore vuoto impedisce l'avvio con un'indicazione d'uso. Fallisce se il `clientId` cambia tra avvii con la stessa configurazione o se il client apre una sessione con un identificativo vuoto.

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
La prova passa se la conversazione riaperta mostra il turno «In elaborazione» e invita la persona ad aggiornarla più tardi, senza riprendere le trasmissioni del turno, interrogare periodicamente lo stato o mostrare frammenti temporanei come risposta completa. Prima dell'aggiornamento manuale il client non sostituisce da sé lo stato; dopo l'aggiornamento mostra l'esito conservato corretto senza duplicare il turno né inviarne uno nuovo.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Invito ad aggiornare la conversazione in elaborazione](../Requirements/TerminalConversation.md#invito-ad-aggiornare-la-conversazione-in-elaborazione)
---

### Prova della configurazione del percorso CI

Leggere `.github/workflows/ci.yml` come testo e confrontarlo con i trigger e le fasi richiesti alla CI del client, con i contratti comuni del checkout affiancato e dei controlli del modello e con l'installazione di gitleaks di `.github/workflows/secret-scan.yml`.

#### Details
La prova passa se il workflow dichiara i trigger `push` sul branch `main`, `pull_request`, `workflow_dispatch` e `workflow_call` e la variabile `BRANCH` pari a `github.head_ref` o, in sua assenza, `github.ref_name`; il job `checks` esegue il checkout del client in `workspace/ambrogio-cli` con `fetch-depth: 0`, clona `ambrogio-model` in `workspace/ambrogio-model` sul branch `BRANCH` se esiste sul remoto e altrimenti su `main`, esegue `workspace/ambrogio-model/scripts/checkout-workspace workspace "$BRANCH"` e `workspace/ambrogio-model/scripts/model-checks --workspace workspace`; nella cartella `workspace/ambrogio-backend` installa le dipendenze del backend con `pnpm install --frozen-lockfile` e lo compila con `pnpm build`, con il pnpm attivato da Corepack; usa Node.js 24, dichiara `COREPACK_ENABLE_DOWNLOAD_PROMPT` uguale a `0` a livello di job, esegue `corepack enable` prima di ogni comando `pnpm` e non installa pnpm con `npm` né lo esegue con `npx`, installa le dipendenze con `pnpm install --frozen-lockfile` nella cartella `workspace/ambrogio-cli`, dove esegue subito dopo `pnpm audit --audit-level high` senza opzioni che ignorano avvisi, poi `pnpm typecheck`, `pnpm test`, la prova di integrazione `pnpm test:backend` contro il backend affiancato compilato e `pnpm build`, in quest'ordine; prima di `pnpm test` installa gitleaks con la stessa versione, la stessa impronta e lo stesso script di `secret-scan.yml`; nessun passo indica un numero di versione di Reqvire. Fallisce se manca un trigger o una fase, se le fasi sono in un altro ordine, se una fase dichiara `continue-on-error` o ignora l'esito di un comando con `|| true`, se un passo fissa una versione di Reqvire, oppure se versione, impronta o script di installazione di gitleaks differiscono da quelli di `secret-scan.yml`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Controlli CI del client terminale](../Requirements/TerminalConversation.md#controlli-ci-del-client-terminale)
---

### Prova della configurazione della scansione dei segreti in CI del client terminale

Leggere `.github/workflows/secret-scan.yml` come testo e confrontarlo con il profilo di scansione dei segreti; eseguire il comando di scansione del workflow con gitleaks su un repository Git temporaneo che contiene in un commit un token fittizio generato durante la prova, e su uno che non contiene segreti.

#### Details
La prova passa se il workflow dichiara i trigger `push` su qualunque branch, `pull_request`, `workflow_dispatch` e `workflow_call`; esegue il checkout fissato con `fetch-depth: 0` e `persist-credentials: false`; con `set -euo pipefail` scarica dalla release ufficiale l'archivio della versione indicata dal contratto, ne verifica con `sha256sum --check --strict` l'impronta del contratto prima di estrarlo e aggiunge il binario al `PATH`; esegue `gitleaks git --redact --no-banner --exit-code 1 .`; e quel comando termina con esito non riuscito sul repository con il token fittizio, senza riportarne il valore, e con esito riuscito sul repository senza segreti. Fallisce se manca un trigger o una di queste fasi, se la verifica dell'impronta segue l'estrazione, se versione o impronta differiscono dal contratto, se il comando non fallisce in presenza del token o se l'output ne riporta il valore.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [secrets.test.ts](../../test/secrets.test.ts)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Scansione dei segreti nella CI del client terminale](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci-del-client-terminale)
---

### Prova della gestione delle dipendenze

Leggere `package.json`, `pnpm-workspace.yaml` e `pnpm-lock.yaml` del repository e confrontarli con il contratto di installazione, con le versioni risolte nel lockfile e con la versione minima di Node.js; in CI installare le dipendenze da un checkout pulito con `pnpm install --frozen-lockfile`.

#### Details
La prova passa se `packageManager` è `pnpm@12.11.2`, ogni dipendenza diretta è dichiarata con una versione esatta `MAJOR.MINOR.PATCH` uguale a `specifier` e `version` dell'importer radice di `pnpm-lock.yaml`, `engines.node` è `>=24`, `allowBuilds` è vuoto, `minimumReleaseAgeExclude` è assente, `package-lock.json` non esiste e l'installazione congelata in CI riesce. Fallisce se una dipendenza usa un intervallo di versione o una versione diversa da quella del lockfile, se la configurazione di pnpm ammette script di build non elencati nel contratto o se l'installazione modifica il lockfile.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [dependencies.test.ts](../../test/dependencies.test.ts)
  * verify: [Installazione delle dipendenze con pnpm](../Requirements/TerminalConversation.md#installazione-delle-dipendenze-con-pnpm)
  * verify: [Stack del client terminale](../Requirements/TerminalConversation.md#stack-del-client-terminale)
  * verify: [Versioni esatte delle dipendenze dirette](../Requirements/TerminalConversation.md#versioni-esatte-delle-dipendenze-dirette)
---

### Prova della lingua dell'interfaccia del client terminale

Calcolare la lingua dell'interfaccia per combinazioni di `--language`, `AMBROGIO_LANGUAGE`, `LC_ALL`, `LC_MESSAGES` e `LANG`: opzione e variabile diverse, variabile vuota, nessuna variabile di sistema, `C`, `POSIX`, valori che iniziano con `it` ed `en` e un primo valore non vuoto diverso dai successivi. Confrontare le voci italiane e inglesi del catalogo nel codice con il contratto. Avviare il processo con un valore non supportato nell'opzione e nella variabile, senza URL del backend in italiano e in inglese e con `--help`. In un terminale simulato contro un backend controllato avviare il client in inglese e in italiano, inviare un turno, osservare la schermata e `session.hello`, e far rispondere il backend con un messaggio pubblico di rifiuto.

#### Details
La prova passa se l'opzione prevale sulla variabile; una variabile vuota è ignorata; senza opzione né variabile vale il primo valore non vuoto fra `LC_ALL`, `LC_MESSAGES` e `LANG`, con italiano soltanto quando inizia con `it` e inglese in ogni altro caso, compresa l'assenza di valori; un valore non supportato termina l'avvio con codice `2`, «Opzioni non valide.» o «Invalid options.» e l'indicazione d'uso nella lingua stabilita senza quel valore; le due lingue del catalogo hanno le stesse voci e coincidono con il contratto; la schermata in inglese mostra «New chat» e i comandi inglesi, la schermata in italiano «Nuova chat», il `name` è `Terminal <nome host>` o `Terminale <nome host>` secondo la lingua e il messaggio del backend compare invariato. Fallisce se un testo del client compare nella lingua non scelta, se la lingua dipende da variabili diverse da quelle indicate o se un testo del backend viene tradotto.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Scelta della lingua dell'interfaccia del client terminale](../Requirements/TerminalConversation.md#scelta-della-lingua-dellinterfaccia-del-client-terminale)
  * verify: [Testi del client terminale nella lingua dell'interfaccia](../Requirements/TerminalConversation.md#testi-del-client-terminale-nella-lingua-dellinterfaccia)
---

### Prova della presentazione degli errori HTTP nel client terminale

Con un backend HTTP controllato, far rispondere alle letture di elenco e storico su `/api/v1/` con il Problem Details `/problems/conversation-not-found`, con un Problem Details di `type` sconosciuto, con un `about:blank` di stato 500 e con una risposta d'errore JSON che non è un Problem Details, in italiano e in inglese; osservare l'errore prodotto dal modulo di comunicazione con il backend.

#### Details
La prova passa se le letture usano i percorsi `/api/v1/conversations` e `/api/v1/conversations/<id>`, se `/problems/conversation-not-found` produce la voce «Conversazione inesistente» del catalogo e ogni altro caso la voce «Errore HTTP generico» con lo stato della risposta, nella lingua scelta, e se `title`, `detail` o un campo `error` del corpo non compaiono mai nel testo mostrato. Fallisce se il testo dipende da membri diversi da `type` o se un testo del backend è mostrato.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [backend.test.ts](../../test/backend.test.ts)
  * verify: [Presentazione degli errori HTTP nel client terminale](../Requirements/TerminalConversation.md#presentazione-degli-errori-http-nel-client-terminale)
---

### Prova della protezione dei workflow di CI

Leggere `.github/workflows/ci.yml` e `.github/workflows/secret-scan.yml` come testo e confrontarli con i valori del profilo di protezione dei workflow GitHub Actions letti dal contratto.

#### Details
La prova passa se ogni workflow dichiara al livello del workflow soltanto `permissions: contents: read` e nessun job dichiara permessi; ogni `uses:` indica un'action del contratto con il commit di 40 caratteri esadecimali e il commento della versione indicati dal contratto; ogni job ha il `runs-on` e il `timeout-minutes` del contratto; ogni checkout ha `persist-credentials: false`; `actions/setup-node` ha `package-manager-cache: false`; entrambi i workflow dichiarano il trigger `workflow_call`; nessun workflow dichiara `concurrency`. Fallisce se un workflow usa un tag mobile o un commit diverso da quello del contratto, concede permessi oltre la lettura dei contenuti, non limita la durata di un job o la limita con un valore diverso dal contratto, conserva le credenziali del checkout o non dichiara `workflow_call`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Protezione dei workflow di CI](../Requirements/TerminalConversation.md#protezione-dei-workflow-di-ci)
---

### Prova della ripartenza dell'elenco aggiornato

Caricare almeno due pagine nel client della chat testuale, poi aggiungere una conversazione o aggiornare l'ultima attività di una conversazione meno recente nell'archivio. Attivare l'aggiornamento dell'elenco e osservare la richiesta successiva e le voci mostrate.

#### Details
La prova passa se il client scarta il riferimento alla vecchia pagina successiva, richiede la prima pagina e presenta le voci nell'ordine corrente della nuova prima pagina, compresa quella nuova o aggiornata, senza le voci delle pagine caricate in precedenza che la nuova prima pagina non contiene; la pagina successiva richiesta dopo l'aggiornamento usa il riferimento ricevuto con la nuova prima pagina. Fallisce se continua dalla pagina della consultazione precedente, se mostra le voci nell'ordine della consultazione precedente o tratta le pagine già caricate come una fotografia immutabile. I test in terminale simulato verificano che, dopo la pagina successiva, l'aggiornamento richieda di nuovo la prima pagina senza cursor e che, dopo un cambiamento dell'archivio, la barra laterale presenti l'ordine della nuova prima pagina e prosegua con il nuovo riferimento.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * satisfiedBy: [tui.test.ts](../../test/tui.test.ts)
  * verify: [Ripartenza dell'elenco conversazioni del client terminale](../Requirements/TerminalConversation.md#ripartenza-dellelenco-conversazioni-del-client-terminale)
---

### Prova della schermata conversazionale persistente

Avviare il client in un terminale interattivo simulato con un backend HTTP controllato che offre più conversazioni e storici. Verificare che all'avvio sia selezionata «Nuova chat» come prima voce senza chiamata HTTP di creazione e che, dopo il primo invio, la voce mostri l'anteprima del messaggio. Verificare nella stessa schermata la barra laterale e la chat corrente, navigare con `Tab`, frecce e `Invio`, inviare due turni nella stessa chat e ricevere una risposta progressiva. Aggiornare l'elenco e ridimensionare il terminale, anche sotto e poi di nuovo sopra la dimensione minima di 70 colonne e 14 righe. Rendere non disponibile lo storico di una conversazione dell'elenco al momento dell'anteprima.

#### Details
La prova passa se la chat e il campo di scrittura restano visibili durante composizione, invio e ricezione, il secondo turno continua la stessa conversazione e l'elenco mostra le anteprime dei primi messaggi ottenute dagli storici pubblici. La nuova chat iniziale resta aperta dopo il primo invio e prende il nome da quel testo; Tab, frecce e Invio aprono la chat scelta. L'aggiornamento riparte dalla prima pagina. Il ridimensionamento ricalcola la larghezza della barra laterale e la posizione del campo di scrittura secondo le nuove dimensioni; con meno di 70 colonne o meno di 14 righe la schermata mostra al posto dei pannelli, per intero e andando a capo quando una riga non basta, l'avviso della voce «Terminale troppo piccolo» del catalogo dei testi, e tornando a una dimensione sufficiente mostra di nuovo la chat corrente, che il turno successivo continua. Se lo storico di una conversazione non è disponibile, la sua voce mostra come identificativo abbreviato i primi 8 caratteri dell'identificativo e resta selezionabile con Tab, frecce e Invio. Fallisce se la chat o il campo di scrittura scompaiono durante un turno, se il ridimensionamento lascia i pannelli con le dimensioni precedenti, se la schermata mostra due pannelli sotto la dimensione minima o non mostra l'avviso per intero, se dopo il ridimensionamento la chat corrente è perduta o il turno successivo apre un'altra conversazione, oppure se una conversazione con storico non disponibile scompare dall'elenco, mostra l'identificativo completo o non è selezionabile. I test in terminale simulato verificano a 100×30 la schermata, le anteprime, due turni, la navigazione, la pagina successiva e l'aggiornamento, e a più dimensioni il ridimensionamento, la vista sotto la dimensione minima e l'identificativo abbreviato. La prova con il backend affiancato, avviato tramite il suo ingresso di prova pubblico, verifica nuova chat, riapertura e continuazione.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-backend.mjs](../../scripts/verify-backend.mjs)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * satisfiedBy: [tui.test.ts](../../test/tui.test.ts)
  * verify: [Anteprima delle conversazioni nella barra laterale del client terminale](../Requirements/TerminalConversation.md#anteprima-delle-conversazioni-nella-barra-laterale-del-client-terminale)
  * verify: [Navigazione della chat nella schermata persistente](../Requirements/TerminalConversation.md#navigazione-della-chat-nella-schermata-persistente)
  * verify: [Nuova chat iniziale del client terminale](../Requirements/TerminalConversation.md#nuova-chat-iniziale-del-client-terminale)
  * verify: [Vista persistente della conversazione](../Requirements/TerminalConversation.md#vista-persistente-della-conversazione)
---

### Prova dello stato del turno alla riapertura

Avviare da un client della chat testuale un turno con elaborazione controllabile, poi chiudere la sessione del client dopo l'accettazione e prima dell'esito. Mantenere l'elaborazione in corso, riaprire la stessa conversazione da un client della chat testuale e osservare lo stato del turno. Far poi terminare il turno, consultare nuovamente la conversazione e ripetere la prova con un esito di errore.

#### Details
La prova passa se, durante l'elaborazione, il client mostra il testo del turno con lo stato «In elaborazione» e non presenta eventuali frammenti ricevuti prima della chiusura della sessione come risposta completa. Dopo la conservazione dell'esito e una nuova consultazione manuale, il client mostra un solo scambio concluso con risposta completa oppure messaggio pubblico di errore, e lo stato «In elaborazione» scompare per quel turno. Fallisce se il turno non è visibile durante l'elaborazione, se appare già concluso, se lo stato rimane dopo la nuova consultazione, se la riapertura crea uno scambio duplicato o se l'aggiornamento invia un nuovo turno.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Stato del turno in elaborazione alla riapertura nel client terminale](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura-nel-client-terminale)
---

### Prova del client terminale compilato come processo

Con `pnpm test`, avviare `dist/src/cli.js` con Node.js senza URL del backend; con `pnpm test:backend`, avviare `dist/src/cli.js` in un terminale contro l'ingresso di prova del backend affiancato e inviare un turno.

#### Details
La prova passa se senza URL il processo termina con codice 2 e l'indicazione dell'URL mancante su stderr, e se contro il backend affiancato il processo mostra la nuova chat e la risposta e termina con codice 0. Fallisce se il compilato non si avvia, se un codice di uscita differisce o se la conversazione non si completa.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-backend.mjs](../../scripts/verify-backend.mjs)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * verify: [Client terminale compilato provato come processo](../Requirements/TerminalConversation.md#client-terminale-compilato-provato-come-processo)
---

# Elements

### Verifica del client terminale

Raggruppa le prove del comportamento del client terminale e della sua integrazione con il backend HTTP.

#### Metadata
  * type: verification-objective
---

### Analisi della compatibilità con il backend

Esaminare la revisione di backend dichiarata nel contratto sorgente e confrontare i messaggi `ambrogio.v1` inviati e interpretati dal client, gli esiti e i rifiuti, l'elenco e lo storico con i contratti pubblici e lo schema del protocollo a quella revisione; eseguire la prova di integrazione contro la stessa revisione.

#### Details
L'analisi passa se la revisione è identificata in modo riproducibile e tutti gli usi del protocollo e delle rotte HTTP corrispondono ai contratti e allo schema, e la prova di integrazione contro quella revisione riesce. Fallisce se la revisione è indefinita, se il client usa per i turni un trasporto diverso dal canale `ambrogio.v1` o se dipende da file o moduli interni del backend. Non automatizzabile: stabilire se una modifica dei contratti del backend fra due revisioni cambia gli obblighi del client richiede di leggere i testi dei contratti in un altro repository; la prova di integrazione copre soltanto i percorsi che esercita.

#### Metadata
  * type: analysis-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Compatibilità con l'API conversazionale del backend](../Requirements/TerminalConversation.md#compatibilità-con-lapi-conversazionale-del-backend)
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

Esaminare il repository Git del client e la configurazione del workspace Reqvire, quindi verificare che modello, decisioni e codice del client siano versionati qui.

#### Details
Il controllo passa se il repository e il modello Reqvire sono autonomi dal backend e le decisioni del client sono tracciate in questo workspace. Non automatizzabile: stabilire che una decisione tecnica riguarda il client e che è registrata in questo modello e non in quello del backend richiede di leggere i due modelli.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Repository autonomo del client terminale](../Requirements/TerminalConversation.md#repository-autonomo-del-client-terminale)
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
  * verify: [Scansione dei segreti nella CI](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci)
---

### Ispezione della protezione del merge

Leggere con `gh api repos/<proprietario>/<repository>/rulesets` e con il dettaglio del ruleset `main` le regole attive sul branch principale.

#### Details
L'ispezione passa se il ruleset corrisponde al contratto: applicazione attiva sul branch predefinito, nessun attore escluso, integrazione solo tramite pull request, controlli richiesti con i nomi del contratto, riscrittura forzata e cancellazione vietate; e se un push diretto sul branch principale viene rifiutato. Fallisce se il ruleset manca, è disattivato, ha attori esclusi o differisce dal contratto. Non automatizzabile: il ruleset è un'impostazione del repository GitHub e non un file del repository, e leggerlo richiede credenziali con accesso amministrativo che la CI non possiede.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Controlli obbligatori prima del merge](../Requirements/TerminalConversation.md#controlli-obbligatori-prima-del-merge)
---

### Ispezione delle decisioni sostituite

Durante la revisione di ogni modifica che registra una decisione in sostituzione di un'altra, cercare nel modello gli elementi che affermano la decisione sostituita, con `change-impact` e con una ricerca testuale dei suoi termini chiave.

#### Details
L'ispezione passa se, dopo la modifica, nessun requisito, contratto o verifica afferma ancora la decisione sostituita. Fallisce se un elemento la afferma ancora. Non automatizzabile: riconoscere che un testo afferma una decisione sostituita richiede di leggerlo; lo script copre soltanto date e formule di storia.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Decisioni sostituite rimosse nella stessa modifica](../Requirements/TerminalConversation.md#decisioni-sostituite-rimosse-nella-stessa-modifica)
---

### Ispezione delle dipendenze fra contratti

Durante la revisione di ogni modifica che aggiunge o modifica un contratto, leggere il contratto e i contratti dei requisiti da cui dipende, ed eseguire `change-impact` sulla modifica.

#### Details
L'ispezione passa se il contratto afferma soltanto la decisione del proprio requisito e ogni dipendenza da un contratto posseduto da un altro requisito è dichiarata come Contract Reference dal requisito proprietario del contratto dipendente, così che `change-impact` la segnali. Fallisce se un contratto ripete contenuto posseduto da un altro requisito o se una dipendenza non è dichiarata. Non automatizzabile: stabilire se due testi affermano lo stesso fatto richiede di leggerli.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Dipendenze fra contratti dichiarate come riferimenti](../Requirements/TerminalConversation.md#dipendenze-fra-contratti-dichiarate-come-riferimenti)
---

### Prova del client conversazionale nel terminale

Avviare il backend e il client terminale come processi distinti, rendendo disponibili al client soltanto il canale conversazionale `ambrogio.v1` e le API HTTP pubbliche del backend. Dal terminale inviare un nuovo turno e osservare una risposta prodotta in più frammenti; consultare le conversazioni conservate e proseguire quella creata, recuperandone lo storico dal backend. Ripetere con un turno rifiutato, per esempio la continuazione di una conversazione occupata, con un errore dopo l'ammissione a risposta già iniziata e con la chiusura della sessione prima dell'esito.

#### Details
La prova passa se la persona può conversare dal terminale, osserva i frammenti durante la generazione e può consultare e continuare una conversazione conservata tramite le interfacce pubbliche. Il turno risulta riuscito soltanto con `turn.completed`; `turn.rejected` e `turn.failed` mostrano il loro messaggio pubblico al posto dei frammenti; la chiusura della sessione o `turn.interrupted` mostrano «Risposta interrotta». Fallisce se il client richiede un'interfaccia grafica, accede direttamente all'archivio o ai componenti server, usa per i turni un trasporto diverso dal canale `ambrogio.v1`, oppure presenta come riuscito un turno privo di `turn.completed`.

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

### Prova dell'hook pre-commit dei segreti

In un repository Git temporaneo con `core.hooksPath` rivolto alla cartella `.githooks` del client, mettere in staging un file con un token fittizio riconosciuto da gitleaks, generato durante la prova, e tentare il commit; ripetere con un file privo di segreti e con un `PATH` che non contiene `gitleaks`.

#### Details
La prova passa se il commit con il token fittizio viene rifiutato senza che l'output ne riporti il valore, il commit senza segreti riesce e, senza `gitleaks` nel `PATH`, il commit viene rifiutato con il messaggio che indica di installare gitleaks 8.30.1. Il repository temporaneo viene eliminato dopo la prova. Fallisce se il commit con il token fittizio viene creato, se l'output riporta il valore del token, se il commit senza segreti viene rifiutato o se senza gitleaks il commit viene creato o il messaggio non indica come installarlo. La prova richiede gitleaks nel `PATH`, che il job `checks` della CI installa.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [secrets.test.ts](../../test/secrets.test.ts)
  * verify: [Controllo dei segreti prima del commit](../Requirements/TerminalConversation.md#controllo-dei-segreti-prima-del-commit)
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

### Prova dell'integrità del modello

Eseguire `node scripts/check-model.mjs` nella radice del repository, come fa la CI dopo la validazione e il lint del modello.

#### Details
La prova passa se lo script non segnala storia delle decisioni, formule non normative, verifiche manuali senza «Non automatizzabile:» né file di governo non riferiti dal modello, e termina con stato 0. Fallisce se lo script segnala una violazione o non riesce a eseguire.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [check-model.mjs](../../scripts/check-model.mjs)
  * verify: [Controllo automatico dell'integrità del modello](../Requirements/TerminalConversation.md#controllo-automatico-dellintegrità-del-modello)
  * verify: [Decisioni sostituite rimosse nella stessa modifica](../Requirements/TerminalConversation.md#decisioni-sostituite-rimosse-nella-stessa-modifica)
  * verify: [File di governo collegati al modello](../Requirements/TerminalConversation.md#file-di-governo-collegati-al-modello)
  * verify: [Formulazione normativa degli obblighi](../Requirements/TerminalConversation.md#formulazione-normativa-degli-obblighi)
  * verify: [Verifiche manuali giustificate](../Requirements/TerminalConversation.md#verifiche-manuali-giustificate)
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

Leggere `.github/workflows/ci.yml` come testo e confrontarlo con i trigger e le fasi richiesti alla CI del client e con l'installazione di gitleaks di `.github/workflows/secret-scan.yml`.

#### Details
La prova passa se il workflow dichiara i trigger `push` sul branch `main`, `pull_request`, `workflow_dispatch` e `workflow_call`; il job `checks` usa Node.js 24, installa pnpm 12.11.2 e le dipendenze con `pnpm install --frozen-lockfile`; esegue Reqvire 1.3.2 `validate` e `lint --json` con `set -euo pipefail` e la condizione `jq -e '.auto_fixable == [] and .needs_manual_review == []'`, poi `node scripts/check-model.mjs`, `pnpm typecheck`, `pnpm test` e `pnpm build`, in quest'ordine; e prima di `pnpm test` installa gitleaks con la stessa versione, la stessa impronta e lo stesso script di `secret-scan.yml`. Fallisce se manca un trigger o una fase, se le fasi sono in un altro ordine, se una fase dichiara `continue-on-error` o ignora l'esito di un comando con `|| true`, oppure se versione, impronta o script di installazione di gitleaks differiscono da quelli di `secret-scan.yml`.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Controlli CI del client terminale](../Requirements/TerminalConversation.md#controlli-ci-del-client-terminale)
---

### Prova della configurazione della scansione dei segreti in CI

Leggere `.github/workflows/secret-scan.yml` come testo e confrontarlo con il profilo di scansione dei segreti; eseguire il comando di scansione del workflow con gitleaks su un repository Git temporaneo che contiene in un commit un token fittizio generato durante la prova, e su uno che non contiene segreti.

#### Details
La prova passa se il workflow dichiara i trigger `push` su qualunque branch, `pull_request`, `workflow_dispatch` e `workflow_call`; esegue il checkout fissato con `fetch-depth: 0` e `persist-credentials: false`; con `set -euo pipefail` scarica dalla release ufficiale l'archivio della versione indicata dal contratto, ne verifica con `sha256sum --check --strict` l'impronta del contratto prima di estrarlo e aggiunge il binario al `PATH`; esegue `gitleaks git --redact --no-banner --exit-code 1 .`; e quel comando termina con esito non riuscito sul repository con il token fittizio, senza riportarne il valore, e con esito riuscito sul repository senza segreti. Fallisce se manca un trigger o una di queste fasi, se la verifica dell'impronta segue l'estrazione, se versione o impronta differiscono dal contratto, se il comando non fallisce in presenza del token o se l'output ne riporta il valore.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [secrets.test.ts](../../test/secrets.test.ts)
  * satisfiedBy: [workflows.test.ts](../../test/workflows.test.ts)
  * verify: [Scansione dei segreti nella CI](../Requirements/TerminalConversation.md#scansione-dei-segreti-nella-ci)
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
  * verify: [Ripartenza dell'elenco conversazioni dopo un aggiornamento](../Requirements/TerminalConversation.md#ripartenza-dellelenco-conversazioni-dopo-un-aggiornamento)
---

### Prova della schermata conversazionale persistente

Avviare il client in un terminale interattivo simulato con un backend HTTP controllato che offre più conversazioni e storici. Verificare che all'avvio sia selezionata «Nuova chat» come prima voce senza chiamata HTTP di creazione e che, dopo il primo invio, la voce mostri l'anteprima del messaggio. Verificare nella stessa schermata la barra laterale e la chat corrente, navigare con `Tab`, frecce e `Invio`, inviare due turni nella stessa chat e ricevere una risposta progressiva. Aggiornare l'elenco e ridimensionare il terminale, anche sotto e poi di nuovo sopra la dimensione minima di 70 colonne e 14 righe. Rendere non disponibile lo storico di una conversazione dell'elenco al momento dell'anteprima.

#### Details
La prova passa se la chat e il campo di scrittura restano visibili durante composizione, invio e ricezione, il secondo turno continua la stessa conversazione e l'elenco mostra le anteprime dei primi messaggi ottenute dagli storici pubblici. La nuova chat iniziale resta aperta dopo il primo invio e prende il nome da quel testo; Tab, frecce e Invio aprono la chat scelta. L'aggiornamento riparte dalla prima pagina. Il ridimensionamento ricalcola la larghezza della barra laterale e la posizione del campo di scrittura secondo le nuove dimensioni; con meno di 70 colonne o meno di 14 righe la schermata mostra al posto dei pannelli, per intero e andando a capo quando una riga non basta, l'avviso della voce «Terminale troppo piccolo» del catalogo dei testi, e tornando a una dimensione sufficiente mostra di nuovo la chat corrente, che il turno successivo continua. Se lo storico di una conversazione non è disponibile, la sua voce mostra un identificativo abbreviato e resta selezionabile con Tab, frecce e Invio. Fallisce se la chat o il campo di scrittura scompaiono durante un turno, se il ridimensionamento lascia i pannelli con le dimensioni precedenti, se la schermata mostra due pannelli sotto la dimensione minima o non mostra l'avviso per intero, se dopo il ridimensionamento la chat corrente è perduta o il turno successivo apre un'altra conversazione, oppure se una conversazione con storico non disponibile scompare dall'elenco, mostra l'identificativo completo o non è selezionabile. I test in terminale simulato verificano a 100×30 la schermata, le anteprime, due turni, la navigazione, la pagina successiva e l'aggiornamento, e a più dimensioni il ridimensionamento, la vista sotto la dimensione minima e l'identificativo abbreviato. La prova con server completo verifica nuova chat, riapertura e continuazione.

#### Metadata
  * type: test-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * satisfiedBy: [verify-pinned-backend.mjs](../../scripts/verify-pinned-backend.mjs)
  * satisfiedBy: [cli.test.ts](../../test/cli.test.ts)
  * satisfiedBy: [tui.test.ts](../../test/tui.test.ts)
  * verify: [Anteprima delle conversazioni nella barra laterale](../Requirements/TerminalConversation.md#anteprima-delle-conversazioni-nella-barra-laterale)
  * verify: [Navigazione della chat nella schermata persistente](../Requirements/TerminalConversation.md#navigazione-della-chat-nella-schermata-persistente)
  * verify: [Nuova chat iniziale nella barra laterale](../Requirements/TerminalConversation.md#nuova-chat-iniziale-nella-barra-laterale)
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
  * verify: [Stato del turno in elaborazione alla riapertura](../Requirements/TerminalConversation.md#stato-del-turno-in-elaborazione-alla-riapertura)
---

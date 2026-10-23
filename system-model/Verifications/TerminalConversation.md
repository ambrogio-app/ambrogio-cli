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

### Controllo del percorso CI del client terminale

Esaminare `.github/workflows/ci.yml` ed eseguirlo su GitHub dopo un push sul branch principale.

#### Details
Il controllo passa se il workflow si attiva su push del branch principale, pull request, richiesta manuale e chiamata da altri workflow; installa pnpm 12.11.2 e le dipendenze con `pnpm install --frozen-lockfile` su Node.js 24; esegue Reqvire 1.3.2 `validate` e `lint` facendo fallire il job se il lint riporta correzioni automatiche o elementi da rivedere; esegue `pnpm typecheck`, `pnpm test` e `pnpm build`; e l'esecuzione su GitHub termina con successo. Fallisce se manca una fase o se un controllo fallito non fa fallire il job. Non automatizzabile: l'attivazione dei trigger e l'esito del job si osservano soltanto su GitHub Actions dopo un push; il confronto testuale del workflow con le fasi richieste è automatizzabile.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Controlli CI del client terminale](../Requirements/TerminalConversation.md#controlli-ci-del-client-terminale)
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

### Controllo dell'hook pre-commit dei segreti

Attivare l'hook con `git config core.hooksPath .githooks` in un clone di prova, mettere in staging un file con un token fittizio riconosciuto da gitleaks e tentare il commit; ripetere con un file privo di segreti e con `gitleaks` assente dal `PATH`.

#### Details
Il controllo passa se il commit con il token fittizio viene rifiutato senza mostrarne il valore, il commit senza segreti riesce e, senza `gitleaks` nel `PATH`, il commit viene rifiutato con un messaggio che indica come installarlo. Il clone di prova viene eliminato dopo il controllo. Non automatizzabile: la prova richiede il binario gitleaks nel `PATH` e un clone con l'hook attivato localmente, che la suite di test e la CI del client non predispongono.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Controllo dei segreti prima del commit](../Requirements/TerminalConversation.md#controllo-dei-segreti-prima-del-commit)
---

### Controllo della protezione dei workflow di CI

Esaminare `.github/workflows/ci.yml` e `.github/workflows/secret-scan.yml` e confrontarli con il profilo di protezione dei workflow; per ogni action fissata, confrontare il commit con il tag della versione indicata nel repository dell'action.

#### Details
Il controllo passa se ogni workflow dichiara soltanto `contents: read`, ogni action usa il commit del contratto e quel commit corrisponde alla versione indicata, ogni job ha il `timeout-minutes` del contratto, ogni checkout ha `persist-credentials: false` ed entrambi i workflow hanno il trigger `workflow_call`. Fallisce se un workflow usa un tag mobile, concede permessi di scrittura, non limita la durata di un job o conserva le credenziali del checkout. Non automatizzabile: confermare che il commit fissato corrisponda alla versione dichiarata richiede di consultare il repository dell'action su GitHub, fuori dal repository e dalla rete disponibile ai test; il confronto testuale dei workflow con i valori del contratto è automatizzabile.

#### Metadata
  * type: inspection-verification

#### Relations
  * derivedFrom: [Verifica del client terminale](#verifica-del-client-terminale)
  * verify: [Protezione dei workflow di CI](../Requirements/TerminalConversation.md#protezione-dei-workflow-di-ci)
---

### Controllo della scansione dei segreti in CI

Esaminare `.github/workflows/secret-scan.yml` ed eseguirlo su GitHub dopo un push.

#### Details
Il controllo passa se il workflow si attiva su push di qualunque branch, pull request, richiesta manuale e chiamata da altri workflow; recupera l'intera storia con il checkout fissato e senza credenziali persistenti; scarica gitleaks v8.30.1, ne verifica lo SHA-256 prima dell'estrazione e interrompe il job se l'impronta non corrisponde; esegue `gitleaks git --redact --no-banner --exit-code 1 .`; e l'esecuzione su GitHub termina con successo sulla storia corrente. Fallisce se una di queste condizioni manca o se l'output riporta il valore di un segreto. Non automatizzabile: i trigger, la storia completa del repository remoto e l'esito del job si osservano soltanto su GitHub Actions dopo un push; il confronto testuale del workflow con il contratto è automatizzabile.

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

### Prova della ripartenza dell'elenco aggiornato

Caricare almeno due pagine nel client della chat testuale, poi aggiungere una conversazione o aggiornare l'ultima attività di una conversazione meno recente nell'archivio. Attivare l'aggiornamento dell'elenco e osservare la richiesta successiva e le voci mostrate.

#### Details
La prova passa se il client scarta il riferimento alla vecchia pagina successiva, richiede la prima pagina e presenta l'ordine corrente delle conversazioni, compresa quella nuova o aggiornata. Fallisce se continua dalla pagina della consultazione precedente o tratta le pagine già caricate come una fotografia immutabile. Il test PTY della barra laterale verifica che, dopo la pagina successiva, l'aggiornamento richieda di nuovo la prima pagina senza cursor.

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
La prova passa se la chat e il campo di scrittura restano visibili durante composizione, invio e ricezione, il secondo turno continua la stessa conversazione e l'elenco mostra le anteprime dei primi messaggi ottenute dagli storici pubblici. La nuova chat iniziale resta aperta dopo il primo invio e prende il nome da quel testo; Tab, frecce e Invio aprono la chat scelta. L'aggiornamento riparte dalla prima pagina e il ridimensionamento non perde la chat corrente. Se uno storico non è disponibile, la voce resta selezionabile con ID abbreviato. Il test PTY da 100×30 verifica la schermata, le anteprime, due turni, la navigazione, la pagina successiva e l'aggiornamento. La prova con server completo verifica nuova chat, riapertura e continuazione.

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


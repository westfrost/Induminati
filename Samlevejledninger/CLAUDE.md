# Samlevejledninger/index.html — Samlevejledninger

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow, samt et
> overordnet resumé af database-side-mønstret) — de gælder for alle
> værktøjer, denne fil inklusive. **Baanddb** (`../Baanddb/CLAUDE.md`) er
> denne sides "søster" — nøjagtig samme GitHub-sync-arkitektur og samme
> klasse af historiske bugs (localDirty, tombstones), bare med andre
> felt-navne og stier. Sidder du med et sync-problem her, er Baanddbs fil
> værd at læse med, men denne fil er skrevet til at være selvstændig nok
> til den daglige vedligeholdelse.

**Fil:** `/home/user/Induminati/Samlevejledninger/index.html` (~1113 linjer). **Version:** v2.1 · 14-09-2026. **Data:** `Samlevejledninger/database.json` (live-array, opdateres af push), `Samlevejledninger/gh-auth.json` (krypteret delt token).

**Formål:** Opslagsværk over samlevejledninger (svejseparametre) for PU- og PVC-bånd — hvilken temperatur (over/under), holdetid (minutter) og tryk (bar) der skal bruges til at samle et givent bånd, plus et Vare nr. og fritekst-bemærkning. Bygget som en simplere, mere overskuelig søster til Baanddb.

**Sider (tre faner, `showPage(name, btnEl)`):**
- **OPSLAG** (standard) — søgefelt (`#searchInput`, matcher både båndtype og vare nr.) + filter-faner ALLE/PU/PVC (`setFilter()`), derefter tre print-knapper ("Print PU-database" / "Print PVC-database" / "Print samlet database", `doPrint(scope)`), og en liste af `.entry-card`-kort grupperet under kategori-overskrifter, sorteret alfabetisk pr. kategori (`renderOpslag()`). Hvert kort viser Vare nr., Temperatur over/under, Holdetid (min.), Tryk (bar), evt. bemærkning, og Rediger/Slet-knapper.
- **ALLE POSTER** — statistik-bar (i alt / PU / PVC) + fuld tabel med samme felter (`renderAllTable()`).
- **TILFØJ / REDIGER** — formular (Båndtype*, Kategori* select PU/PVC, Vare nr., Tryk, Temperatur over/under, Holdetid, Bemærkning — ingen placeholder-eksempler i felterne, kun labels), "GEM POST"/"ANNULLER", en "LOKAL BACKUP"-boks (kopiér/importér JSON), og et sammenklappeligt "GITHUB SYNC"-panel.

**Vigtigt: øverst på siden (uden for de tre faner, altid synlig) er en `.notice-banner`:** "⚠️ Bemærk: Alle temperaturer, holdetider og tryk i denne oversigt er vejledende." Samme tekst gentages i printudskriften som `#printNotice` (kun synlig via `@media print`, lige under titel/dato-metadata, over selve tabellen). Denne besked skal blive stående — den blev tilføjet efter eksplicit ønske, og skal fortsat vises både på skærmen og på enhver fremtidig print-variant af siden.

**GitHub-sync:** Nøjagtig samme arkitektur som Baanddb (se `../Baanddb/CLAUDE.md` for fuld teknisk detalje af krypterings-/tombstone-/dirty-mekanikken — koden er praktisk talt identisk, kun tilpasset felt-navne og stier):
- `DB_KEY = 'samlevejledninger_v1'`, `DELETED_IDS_KEY = 'samlevejledninger_deleted_ids'`, `LOCAL_DIRTY_KEY = 'samlevejledninger_local_dirty'`, `GH_PASSWORD_KEY = 'samlevejledninger_gh_password'`, `AUTH_PATH = 'Samlevejledninger/gh-auth.json'`, target-fil `Samlevejledninger/database.json`.
- Delt, krypteret token (adgangskode → PBKDF2 300.000 iterationer → AES-GCM-nøgle) — `resolveToken()`/`decryptToken()`/`encryptToken()`/`setupSharedToken()`. Kun password i UI'et (`#gh_password`), aldrig et rå token, undtagen i den skjulte "OPSÆT ELLER SKIFT DELT TOKEN"-sektion (`<details class="gh-setup">`) hvor et rigtigt GitHub PAT bruges én gang til at kryptere og gemme det delte token.
- Pull: rå URL først (intet password nødvendigt), falder tilbage til autentificeret Contents API + delt token.
- Push: kræver altid password → token via `resolveToken()`.
- **`autoPullOnOpen()`** kører automatisk og stille ved hver sideindlæsning (ikke kun ved eksplicit brugerhandling som i Baanddb — det er en bevidst forskel: Samlevejledninger skal altid vise nyeste data uden at brugeren selv skal huske at trykke Pull). Viser en lille status i headeren (`#syncStatus`, "Henter database..." → "✓ N poster hentet fra GitHub" / "⚠ Bruger lokal cache" / "⚠ Lokale ændringer bevaret (ikke overskrevet)").
- **`localDirty`** (persisteret, IKKE kun i hukommelsen) sættes af `setLocalDirty(true)` i `saveEntry()`, `deleteEntry()`, `importDB()`; ryddes (`setLocalDirty(false)`) kun efter vellykket push eller vellykket manuelt pull. `autoPullOnOpen()` og `githubPull()` tjekker flaget og **springer overskrivning helt over** (inkl. tombstone-oprydning) hvis der er usyncede lokale ændringer.
- **`deletedIds`** (persisteret Set) — `deleteEntry()` tilføjer id til settet; `applyTombstones(parsed)` filtrerer tombstonede id'er fra ethvert hentet datasæt og rydder selv tombstones for id'er remote'en ikke længere har. Anvendes i alle tre pull-stier (autoPullOnOpen, githubPull rå-URL, githubPull API-fallback).

**Print (`doPrint(scope)` / `buildPrintArea(scope)`):** Bruger et separat, kompakt `#printArea` (én tabelrække pr. båndtype i stedet for skærmens kort-layout) frem for at printe skærmvisningen direkte — så mange bånd kan være på ét A4-ark. `scope` er `'PU'`, `'PVC'` eller `'ALLE'` og styrer hvilke kategorier der bygges tabeller for. `#printTitle`/`#printMeta`/`#printNotice` er kun synlige via `@media print` (ellers `display:none` som standard).

**Datafelter pr. post:** `id`, `baandtype`, `kategori` (`'PU'`|`'PVC'`), `vareNr`, `tempOver`, `tempUnder`, `holdetid` (minutter — ikke sekunder, se historik), `tryk`, `bemaerkning`.

**Kendte historiske bugs rettet her (samme mønster genfindes i Baanddb):**
1. **Race condition mellem auto-pull og lokal gem** — hvis brugeren nåede at oprette/redigere/slette en post mens `autoPullOnOpen()`s netværkskald stadig var i gang, overskrev pull'et lydløst den lokale ændring når det blev færdigt. Rettet med `localDirty`-tjek før overskrivning.
2. **`localDirty` overlevede ikke sideopdatering** — det var oprindeligt kun en `let`-variabel i hukommelsen; gemte man en redigering og genindlæste siden (eller lukkede/genåbnede den) *før* man nåede at pushe, startede et nyt JS-miljø hvor flaget var `false` igen, og det næste auto-pull opfattede redigeringen som urørt og overskrev den med den gamle, endnu-ikke-pushede GitHub-version. Rettet ved at gemme flaget i `localStorage` (`setLocalDirty()`/`loadLocalDirty()`).
3. **Slettede poster kunne "genopstå"** — et pull der hentede en forældet/cachet remote-kopi (fx pga. `raw.githubusercontent.com`s CDN-cache eller en sletning der endnu ikke var pushet) kunne bringe en lokalt slettet post tilbage. Rettet med `deletedIds`-tombstones der filtrerer sådanne poster fra ethvert pull, uanset hvad remote'en viser.

Rør ikke ved disse tre mekanismer uden at forstå alle tre bugs først — de er subtile og let at reintroducere ved en tilsyneladende uskyldig forenkling.

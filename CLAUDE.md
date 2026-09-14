# Induminati — noter til Claude

Statisk site, ingen build-step. Hvert værktøj er én selvstændig `index.html` (indlejret CSS/JS). Se `README.md` for en kort, bruger-vendt oversigt over struktur og deployment — denne fil (`CLAUDE.md`) er den udførlige tekniske reference: den dækker samtlige sider i repo'et i teknisk detalje (arkitektur, algoritmer, datamodeller, kendte bugs og hvorfor de blev rettet), så en fremtidig session uden forudgående kontekst kan vedligeholde ethvert værktøj alene ud fra denne fil.

## Vedligehold README.md

Når du tilføjer, fjerner eller flytter et værktøj (fx mellem `Test/` og forsiden), eller laver en væsentlig funktionsændring på en side, opdatér `README.md` i samme ændring — værktøjstabellerne og beskrivelserne skal altid afspejle den faktiske repo-struktur.

## Merge/push til main

Efter enhver ændring der er committet og pushet til feature-branchen: spørg altid med det samme om det skal merges/pushes til `main` (dvs. gå live), i stedet for at antage at branchen bare skal stå og vente. Merge først når brugeren bekræfter.

---

## Arkitektur og konventioner (læs dette først)

**Statisk site, ingen build-step.** Hvert værktøj er én selvstændig `<mappe>/index.html`-fil med indlejret `<style>` og `<script>` — ingen delte JS/CSS-filer, ingen npm/bundler, ingen backend. GitHub Pages serverer repo'et direkte fra `main` med custom domain `induminati.dk` (`CNAME`-fil i repo-roden). Nogle sider trækker et par eksterne CDN-scripts ind (Google Fonts alle steder; `xlsx.full.min.js` i både `Ordrer/` og `Kapacitet/` til at læse `.xlsx`-uploads; `exceljs.min.js` kun i `Ordrer/` til at skrive formaterede `.xlsx`-outputs) — ellers er alt selvstændigt.

**Struktur:**
```
/index.html              → Forside, links til live værktøjer
/Test/index.html         → Oversigt over work-in-progress værktøjer
/<Værktøj>/index.html    → Ét værktøj pr. mappe
/<Værktøj>/database.json → Kun for Baanddb og Samlevejledninger — se "Database-sider" nedenfor
/<Værktøj>/gh-auth.json  → Kun for Baanddb og Samlevejledninger — krypteret delt GitHub-token
```
Når et test-værktøj er klar til drift, flyttes dets kort fra `Test/index.html` til `index.html` (og fjern evt. `TEST`-badge). Se `README.md` for den aktuelle liste over live vs. test-værktøjer — hold den opdateret når noget flyttes.

**Farveskema.** Alle sider deler samme lyse blå/orange palette:

| Rolle | Farve |
|---|---|
| Primær blå (header, primærtekst) | `#0B4F79` |
| Orange accent (CTA / aktive states / highlights) | `#E8791E` (hover `#C9640F`) |
| Sekundær blå (links, sekundære accenter) | `#1C7FBF` |
| Sidebaggrund | `#F3F7FA` |
| Kort/overflade-baggrund | `#FFFFFF` |
| Kant | `#D7E3EC` |
| Tekst | `#17324A` |
| Dæmpet tekst | `#5F7C90` |
| Fejl/danger (semantisk, ikke dekorativ) | `#D64545` |
| Success (semantisk, ikke dekorativ) | `#2E9E52` |

Defineres som CSS custom properties i hver sides `:root`. Semantiske statusfarver (success/danger/advarsel — fx Kapacitets `--good`/`--warn`/`--crit`, eller valideringsfejl) er bevidst holdt adskilt fra brand-paletten og betyder stadig grøn/rød/gul — de må ikke tvinges ind i blå/orange ved fremtidige redesigns. `Kapacitet/index.html` har derudover en `@media (prefers-color-scheme: dark)`-blok, som er den eneste side med OS-niveau dark-mode-understøttelse; den skal ikke fjernes eller udvides til andre sider uden at blive bedt om det.

Nye sider/UI-elementer skal bruge samme CSS-variabelmønster frem for nye ad-hoc-farver.

**Header og "← Forside"-knap.** Alle værktøjssider (dvs. alt undtagen `index.html` og `Test/index.html`, som er hub-sider med deres eget brand-header-mønster) skal have en identisk header-opbygning:

```html
<header>
  <div class="logo-icon">…SVG…</div>   <!-- rent dekorativt, ALDRIG en <a> -->
  <h1>Værktøjsnavn <span>evt. undertekst</span></h1>
  <a class="btn-home" href="../index.html">← Forside</a>
</header>
```

```css
header{background:var(--dark-token);padding:18px 28px;display:flex;align-items:center;gap:14px}
.logo-icon{width:34px;height:34px;background:var(--accent-token);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
header h1{font-size:16px;font-weight:600;color:#fff;flex:1}
.btn-home{color:#CFE3EE;text-decoration:none;font-size:12px;font-weight:500;display:flex;align-items:center;gap:5px;white-space:nowrap;padding:6px 10px;border:1px solid rgba(255,255,255,.3);border-radius:5px;transition:color .15s,border-color .15s}
.btn-home:hover{color:#fff;border-color:var(--accent-token)}
```

(variabelnavne varierer pr. side — `--dark`/`--steel`/`--accent2` osv. for den mørkeblå, `--accent`/`--rust` osv. for orange — men værdierne er altid `#0B4F79` og `#E8791E`.)

Dette var **ikke** ensartet før 14-09-2026: Styreliste/Ordrer/Opskæring/DXF havde altid dette mønster (dekorativt logo + synlig "← Forside"-knap), men Samlevejledninger og Baanddb havde i stedet et **klikbart logo** (`<a class="logo-mark"/"logo-icon" href="../index.html">`) og ingen synlig knap, og Kapacitet havde **slet ingen** header-bjælke, intet logo og ingen vej tilbage til forsiden overhovedet (kun en lys `border-bottom` under en almindelig `<h1>`, inde i `.wrap`). En bruger skulle derfor enten klikke en usynlig-som-knap logo-firkant eller slet ikke kunne komme tilbage, afhængigt af hvilket værktøj de stod på — det er rettet ved at gøre alle logoer rent dekorative (`<div>`, ingen `href`, ingen `:hover`-farveskift) og altid tilføje den samme synlige `.btn-home`-knap. For Kapacitet krævede det at flytte `<header>` uden for `.wrap` (så bjælken bliver fuld bredde som på alle andre sider) og flytte `body`'s gamle padding over på `.wrap` i stedet (bjælken selv har sin egen padding) — **`Kapacitet`s `@media (prefers-color-scheme: dark)`-blok er urørt**, kun `--dark:#0B4F79` er tilføjet til det lyse `:root` (ikke til dark-mode-blokken), så header-bjælken altid er den samme faste blå, uanset OS-tema, ligesom på alle andre sider.

**Versionsnummer pr. side.** De fleste sider har en footer i formatet:
`<div ...>Værktøjsnavn &middot; vX.Y &middot; DD-MM-YYYY</div>`
Ved enhver reel opdatering af en side (funktionsændring, redesign, bugfix — ikke rene formateringsrettelser) skal versionsnummeret bumpes og datoen sættes til dags dato, i samme ændring. Mangler en side stadig en footer, tilføjes en i samme stil næste gang siden redigeres væsentligt.

**Git-workflow.** Der arbejdes altid på en feature-branch, aldrig direkte commits til `main` uden brugerens accept. Spørg altid med det samme, efter en ændring er committet og pushet til feature-branchen, om den skal merges/pushes til `main` (dvs. gå live) — antag ikke at branchen bare skal stå og vente. `main` opdateres desuden løbende af selve de live sider (Baanddb og Samlevejledninger pusher database-ændringer direkte til `main` via GitHub-sync-funktionen, se nedenfor) — forvent derfor at `main` ofte er foran den lokale branch ved merge-tid; ét `git fetch origin main` + `git rebase` (eller `git merge --ff-only` når muligt) løser det typisk uden konflikt, da databasesidernes auto-commits kun rører `database.json`/`gh-auth.json`.

**Database-sider (Baanddb, Samlevejledninger).** Disse to værktøjer er de eneste med en "database": et array af poster gemt i browserens `localStorage`, med valgfri synkronisering til/fra GitHub. Begge sider deler nøjagtig samme arkitektur og samme klasse af tidligere bugs — se de to værktøjers egne afsnit nedenfor for fuld detalje, men kort opsummeret:
- **Push** kræver et GitHub-token, men i stedet for at hver bruger opretter sit eget, er ét rigtigt token krypteret (AES-GCM, nøgle udledt af en fælles adgangskode via PBKDF2, 300.000 iterationer) og gemt i selve repo'et som `<Mappe>/gh-auth.json`. Alle der kender adgangskoden kan låse tokenet op i browseren og pushe (`resolveToken()`/`decryptToken()`). Da repo'et er offentligt, kan den krypterede fil ses af alle — sikkerheden afhænger derfor alene af adgangskodens styrke. Førstegangsopsætning (`setupSharedToken()`) kræver ét rigtigt GitHub PAT engangs.
- **Pull** virker altid uden adgangskode (henter direkte fra `raw.githubusercontent.com`, offentligt repo), falder tilbage til Contents API + delt token hvis det fejler.
- **`localDirty`-flag** (persisteret i `localStorage`, IKKE kun i hukommelsen — det var selv en bugfix, se nedenfor) forhindrer at et baggrunds-pull overskriver ændringer brugeren har lavet lokalt, men endnu ikke pushet. Sættes ved enhver lokal gem/slet/importér, ryddes kun efter et vellykket push eller et bevidst manuelt pull.
- **`deletedIds`-tombstones** (også persisteret) forhindrer at en slettet post kan "genopstå" hvis et pull henter en forældet/cachet remote-kopi der stadig har den. Et pull filtrerer altid tombstonede id'er fra og rydder selv tombstones for id'er remote'en ikke længere har.
- **Samlevejledninger** pull'er derudover automatisk og stille i baggrunden når siden åbnes (`autoPullOnOpen()`), så alle altid ser den nyeste data uden manuelt at skulle trykke "Pull". Baanddb har tilsvarende `autoLoadFromGithub()`.

Disse to mekanismer (`localDirty` og tombstones) blev tilføjet for at rette to reelle, brugerrapporterede bugs — se Baanddb- og Samlevejledninger-afsnittene for præcis hvordan og hvorfor. Rør ikke ved dem uden at forstå begge bugs først.

---

### index.html — Forside

**Fil:** `/home/user/Induminati/index.html` (~141 linjer). **Version:** v1.4 · 18-08-2026.

**Formål:** Landingsside/launcher for alle live værktøjer. Rent statisk — ingen JS overhovedet, kun HTML+CSS.

**Opbygning:** Header med logo (link til `Test/index.html`) + "Interne værktøjer"-undertekst. `main` indeholder en `.app-grid` (responsivt grid, 3→2→1 kolonner) af `.app-card`-links, ét pr. live værktøj, hver med et lille SVG-ikon (stroke `#0B4F79`, baggrund `#E5F1FA`), titel, kort beskrivelse og en "Åbn →"-pil. Rækkefølgen af kortene afspejler ikke nødvendigvis nogen bestemt prioritet — når et værktøj flyttes hertil fra `Test/`, indsættes det blot et sted i grid'et. Footer med version.

**Vedligehold:** Når et værktøj flyttes fra `Test/index.html` hertil (eller omvendt), skal både denne sides `.app-grid` og `README.md`s værktøjstabeller opdateres i samme ændring, og siden versionsbumpes.

---

### Test/index.html — Test-oversigt

**Fil:** `/home/user/Induminati/Test/index.html` (~78 linjer). **Version:** v1.2 · 18-08-2026.

**Formål:** Samme mønster som forsiden, men for work-in-progress-værktøjer der endnu ikke er klar til drift. Rent statisk HTML+CSS, ingen JS. Hvert kort har en ekstra `.app-badge` med teksten "TEST" (orange-toned, `#A3540E`/`#FCEADA`). Header-logoet linker tilbage til `../index.html`. Footer har en "Tilbage til forsiden"-link.

**Vedligehold:** Samme som index.html — når et værktøj er klar, flyt dets kort herfra til `index.html` (og fjern `TEST`-badgen), opdatér `README.md`, og versionsbump begge sider i samme ændring.

---

### Styreliste/index.html — Styreliste Beregner

**Fil:** `/home/user/Induminati/Styreliste/index.html` (~722 linjer). **Version:** v1.4 · 19-07-2026.

**Formål:** Beregner placering af styrelister (guide rails) på et transportbånd — hvor mange, hvor bredt et bånd, hvilken styrelistebredde, og enten center-til-center-afstand (2+ lister) eller manuel afstand fra venstre kant (1 liste). Producerer et opmålt SVG-diagram og en måltabel, samt en printbar arbejdsseddel.

**UI:** Parametre-panel (venstre): Båndbredde (mm), Antal styrelister (1–20), Styrelistebredde (mm), og et dynamisk felt der enten hedder "C/C afstand" (2+ lister, altid synligt hvis n>1) eller "Afstand til kant" (kun 1 liste — feltet `#ccField` skjules helt ved n≤1 via `updateCCVisibility()`, ikke omdøbt/omfunktionaliseret som tidligere). Ved 1 liste og tomt felt centreres listen automatisk; ellers måles altid fra **venstre** kant (`ccVal + guideWidth/2`) — der er **ingen** kant-vælger (venstre/højre) længere, den blev bevidst fjernet (se historik nedenfor). "Beregn"-knap, "↺ Nulstil"-knap (rydder alle felter), og en "⎙ Udskriv"-knap der først vises efter en beregning.

**Beregning (`calculate()`):** Validerer bredde/antal/styrelistebredde (>0, antal ≤20), beregner styrelisternes centerpositioner (symmetrisk fordelt omkring båndcenter for 2+, centreret eller kant-forskudt for 1), tjekker om nogen liste rager uden for båndet eller overlapper naboer, og renderer både et SVG-diagram (`renderDiagram()` — håndtegnet dimensionslinjer med pile, "K/K" kant-til-kant-mål fremhævet i orange, "C/C" center-til-center-mål i blåt) og en måltabel (`renderTable()`).

**Print:** `@media print` skjuler header/panel/version-footer, viser kun diagram+tabel i A4 landscape.

**Historik/kendt kontekst:** Havde tidligere (kortvarigt, tilføjet af en anden session) en "Mål fra"-dropdown (venstre/højre kant) ved 1 styreliste — brugeren bad om at få den fjernet igen ("den er ligegyldig"), så feltet måler nu altid fra venstre kant. Pas på ikke at genindføre den uden eksplicit at være bedt om det.

---

### Samlevejledninger/index.html — Samlevejledninger

**Fil:** `/home/user/Induminati/Samlevejledninger/index.html` (~1113 linjer). **Version:** v2.1 · 14-09-2026. **Data:** `Samlevejledninger/database.json` (live-array, opdateres af push), `Samlevejledninger/gh-auth.json` (krypteret delt token).

**Formål:** Opslagsværk over samlevejledninger (svejseparametre) for PU- og PVC-bånd — hvilken temperatur (over/under), holdetid (minutter) og tryk (bar) der skal bruges til at samle et givent bånd, plus et Vare nr. og fritekst-bemærkning. Bygget som en simplere, mere overskuelig søster til Baanddb.

**Sider (tre faner, `showPage(name, btnEl)`):**
- **OPSLAG** (standard) — søgefelt (`#searchInput`, matcher både båndtype og vare nr.) + filter-faner ALLE/PU/PVC (`setFilter()`), derefter tre print-knapper ("Print PU-database" / "Print PVC-database" / "Print samlet database", `doPrint(scope)`), og en liste af `.entry-card`-kort grupperet under kategori-overskrifter, sorteret alfabetisk pr. kategori (`renderOpslag()`). Hvert kort viser Vare nr., Temperatur over/under, Holdetid (min.), Tryk (bar), evt. bemærkning, og Rediger/Slet-knapper.
- **ALLE POSTER** — statistik-bar (i alt / PU / PVC) + fuld tabel med samme felter (`renderAllTable()`).
- **TILFØJ / REDIGER** — formular (Båndtype*, Kategori* select PU/PVC, Vare nr., Tryk, Temperatur over/under, Holdetid, Bemærkning — ingen placeholder-eksempler i felterne, kun labels), "GEM POST"/"ANNULLER", en "LOKAL BACKUP"-boks (kopiér/importér JSON), og et sammenklappeligt "GITHUB SYNC"-panel.

**Vigtigt: øverst på siden (uden for de tre faner, altid synlig) er en `.notice-banner`:** "⚠️ Bemærk: Alle temperaturer, holdetider og tryk i denne oversigt er vejledende." Samme tekst gentages i printudskriften som `#printNotice` (kun synlig via `@media print`, lige under titel/dato-metadata, over selve tabellen). Denne besked skal blive stående — den blev tilføjet efter eksplicit ønske, og skal fortsat vises både på skærmen og på enhver fremtidig print-variant af siden.

**GitHub-sync:** Nøjagtig samme arkitektur som Baanddb (se det afsnit for fuld teknisk detalje af krypterings-/tombstone-/dirty-mekanikken — koden er praktisk talt identisk, kun tilpasset felt-navne og stier):
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


---

### Baanddb/ — Bånd & Medbringer DB

#### Purpose

`Baanddb/index.html` is a single self-contained HTML/CSS/JS page implementing a searchable lookup database of belt-welding machine settings ("recipes") for conveyor belts and carriers. Each database entry ties a belt type (`baandtype`) and carrier type (`medbringertype`)/length (`laengde`) to the exact welding-machine parameters (current, welding time, cooling time, squeeze, cylinder, pressure, contact, etc.) that produced a good weld on one of two physical machines. Operators search by belt type, carrier length, or carrier type to find the right recipe before running a job, instead of re-discovering settings by trial and error.

#### UI walkthrough

Three top-level pages, switched via `showPage(name)` and the header `nav` buttons (SØG / ALLE POSTER / TILFØJ / REDIGER):

- **SØG (search, default page, `#page-search`)** — hero title + a search bar: a `<select id="searchType">` (Båndtype / Længde (mm) / Medbringertype) and a text `<input id="searchInput">` that fires `doSearch()` on every keystroke (`oninput`). When the query is empty, the "ALLE POSTER" preview (first 5 entries, `renderPreview()`) is shown instead of results. When non-empty, up to 8 scored/sorted results render as cards (`#resultsContainer`).
- **ALLE POSTER (`#page-all`)** — a stats bar (`renderAllTable()`: total posts, unique belt types, unique carrier types) followed by a full data table (13 columns: Maskine, Båndtype, Medbringertype, Længde, Antal, Kontakt, Current, Welding, Cool, Squeeze, Cyl., Pres, Handling) with per-row "Rediger"/"Slet" action buttons calling `editEntry(id)` / `deleteEntry(id)`.
- **TILFØJ / REDIGER (`#page-admin`)** — has its own two-tab sub-navigation via `switchMode()`:
  - **ÉN AD GANGEN (single mode, default)**: a machine-type toggle (STORE HF / LILLE HF, `switchMachine()`), a form grid of fields (see Data model below), GEM POST / ANNULLER buttons (`saveEntry()` / `cancelEdit()`), a "LOKAL BACKUP" box with KOPIÉR JSON / IMPORTÉR JSON buttons (`exportDB()` / `importDB()`), and a collapsible "GITHUB SYNC" panel (`toggleGithubPanel()`) with a password field, PUSH/PULL/TEST buttons, a sync log, and a nested `<details>` "OPSÆT ELLER SKIFT DELT TOKEN" section.
  - **HURTIG-TAST MANGE (bulk mode)**: a spreadsheet-like table (`#bulkTable`) for typing in many **Store HF-only** entries at once, with Tab/Enter/Arrow-key navigation between cells (`bulkKeyDown`), auto-added rows, "+5/+10 RÆKKER", "RENS TABEL", and "GEM ALLE UDFYLDTE RÆKKER" (`saveBulk()`).
- **Edit modal markup** (`#editModal`, `.modal-box`, `#modalFormContainer`) exists in the HTML with ANNULLER/GEM ÆNDRINGER buttons wired to `closeModal()`/`saveModal()` — **but neither function is defined anywhere in the script**. This is dead markup: `editEntry(id)` does NOT open this modal; it instead navigates to the admin page and populates the main single-entry form in place. Any future maintainer clicking a stray reference to this modal should know it's non-functional as-is.

#### Store HF vs Lille HF machine modes

The tool supports two physically different welding machines with different parameter sets, unified in one form via `data-machine="store"` / `data-machine="lille"` attributes on `.form-group` divs.

- `switchMachine(type)` (called with `'Store HF'` or `'Lille HF'`) is the central function:
  - Sets `currentMachine` (module-level variable used when saving).
  - Toggles `.active` class on the `machine-tab-store` / `machine-tab-lille` buttons.
  - Shows/hides all elements with `data-machine="store"` (Current, Squeeze, Cylinder, Pres) vs `data-machine="lille"` (Båndbredde, Prewelding) by setting `el.style.display`.
  - Relabels two shared fields dynamically: the "Antal" label becomes "Antal forme" for Lille HF vs "Antal værktøj" for Store HF; the "Cool" label becomes "Cooling time (s)" for Lille HF vs "Cool (s)" for Store HF.
  - **Clears the fields that don't apply to the newly selected machine**: switching to Lille HF clears `f_current, f_squeeze, f_cylinder, f_pres`; switching to Store HF clears `f_baandbredde, f_prewelding`. This prevents stale Store-HF-only values from being silently saved onto a Lille HF entry (or vice versa) after a mode switch.
- `machineBadge(e)` renders the colored badge used in cards/table rows: reads `e.maskine` (defaulting to `'Store HF'` if absent), and applies CSS class `store` (orange, `.machine-badge.store`) or `lille` (blue, `.machine-badge.lille`).
- `editEntry(id)` calls `switchMachine(e.maskine || 'Store HF')` **before** populating field values, so opening an entry for edit automatically flips the form into the correct machine mode (showing/hiding the right fields) before the stored values are written into the inputs — this ordering matters, since populating fields into a not-yet-switched form could leave machine-specific fields display:none while holding stale values, or trigger the clear-on-switch logic and wipe values just set.
- `saveEntry()` always stamps `maskine: currentMachine` via `getFormValues()`, so the currently active machine tab — not the field contents — determines which machine an entry is tagged as.
- Bulk mode (`saveBulk()`) hardcodes `maskine: 'Store HF'` for every row — there is no way to bulk-enter Lille HF entries; the UI explicitly says so ("Denne tabel er kun til Store HF-poster. Brug 'Én ad gangen' for Lille HF.").
- After `saveEntry()` completes, the form resets to `switchMachine('Store HF')` regardless of what was just saved (also true in `cancelEdit()`), so the default/idle state of the admin form is always Store HF.

#### Search / match logic

`doSearch()` scores every entry against the query via `scoreEntry(entry, query, type)`, keeps up to the 8 lowest-scoring (best) matches, and sorts ascending by score (lower = better).

- **Text fields (Båndtype / Medbringertype)**: normalized (lowercased, trimmed) via `normalize()`.
  - Exact string equality → `score: 0`, badge `exact` ("EKSAKT", green).
  - Substring match either direction (`val.includes(q) || q.includes(val)`) → `score: 1`, badge `close` ("DELVIS", orange).
  - Otherwise → `score = levenshtein(val, q)` (classic DP edit-distance), badge `near` ("NÆRMEST", blue) — i.e., fuzzy/typo-tolerant fallback with no cutoff (a distance of any size still shows up in the top-8 if nothing better exists).
- **Length field (Længde)**: query parsed as float (comma converted to dot for Danish decimal input). `diff = |entry.laengde - query|`.
  - `diff === 0` → `score:0`, badge `exact`.
  - `diff <= 5` (mm) → badge `close`, label `±Xmm`.
  - `diff > 5` → badge `near`, label `±Xmm` (score is still just `diff`, so more distant lengths simply rank lower, no hard cutoff either).
- Results with `null` score (e.g. non-numeric length query) are filtered out entirely.
- The very first (lowest-score) result additionally gets a `best-match` CSS class (orange left border) regardless of badge, i.e. even a "near" match is visually the "best" if it's top of a bad list.
- Note: there is no maximum-distance threshold anywhere — a query can always return up to 8 "near" matches even if none of them are meaningfully close, since `levenshtein`/`diff` have no ceiling filter, only a top-8-by-score cap.

#### Data model

Every entry is a flat JS object in the `db` array. Common fields (both machines):
- `id` — integer, **locally assigned**, not from GitHub/remote in any authoritative sense; see `nextId` below.
- `maskine` — `'Store HF'` or `'Lille HF'` (falls back to `'Store HF'` if missing/undefined in older data).
- `baandtype` — string, required (only hard-required field; enforced in both `saveEntry()` and `saveBulk()`).
- `medbringertype` — string.
- `laengde` — number (mm).
- `antal` — integer (defaults to 1 if unparseable), labeled "Antal værktøj" (Store) or "Antal forme" (Lille).
- `kontakt` — string.
- `welding` — string (kept free-text, e.g. `"45,0s"`, so it round-trips Danish decimal-comma formatting untouched).
- `cool` — string, labeled "Cool (s)" (Store) or "Cooling time (s)" (Lille).
- `bemaerkning` — free-text notes, optional, shown with a 📝 prefix on result cards when present.

Store HF-only fields: `current`, `squeeze`, `cylinder`, `pres`.
Lille HF-only fields: `baandbredde` (belt width, mm, numeric), `prewelding`.

`nextId` is computed at load as `db.length ? Math.max(...db.map(e=>e.id)) + 1 : 1`, and recomputed the same way any time a full remote/imported dataset replaces `db` (`autoLoadFromGithub`, `githubPull`, `importDB`). It is a purely local, in-memory monotonic counter with no coordination between users — two people adding entries locally before pushing/pulling can produce **id collisions**, which is a real risk given the shared-token multi-user model (see Known quirks below).

#### Persistence and GitHub sync architecture

- **`localStorage['baanddb_v1']`** (`DB_KEY`) holds the JSON-serialized working `db` array — read via `loadDB()` (falls back to a 1-entry `SEED` array if missing/corrupt) and written via `saveDB(db)` after every local mutation (save/delete/import/bulk-save/pull).
- **GitHub sync uses one shared, encrypted token — not individual PATs per user.** The design intent (per in-code comments and the on-page "Sådan virker det" note) is that operators don't need to generate their own GitHub Personal Access Token on every PC; instead one real token is generated once by an admin and stored, encrypted, inside the repo itself.
  - **Setup (`setupSharedToken()`)**: an admin pastes a real GitHub PAT (`gh_setup_token`, Contents: Read & Write scope) plus a new shared password (`gh_setup_password`/`gh_setup_password2`, must match). The function calls `encryptToken(token, password)`, then PUTs the resulting encrypted blob to the repo file `Baanddb/gh-auth.json` (`AUTH_PATH`) via the GitHub Contents API, authenticated with that same raw token (used once, then discarded from memory/inputs — the plaintext token is never itself persisted anywhere, only its ciphertext lives in the repo). After success it also saves the new password locally for the admin's own convenience via `saveGhPassword()`.
  - **Encryption primitives** (Web Crypto API, all in the `---- Password-based shared-token encryption ----` section):
    - `deriveAesKey(password, saltB64, iterations)` — PBKDF2-SHA256 with `KDF_ITERATIONS = 300000`, deriving a 256-bit AES-GCM key from the password + a salt (random 16 bytes on encrypt, or the stored salt on decrypt).
    - `encryptToken(token, password)` — derives a fresh key+salt, generates a random 12-byte IV, AES-GCM-encrypts the token, and returns `{ salt, iv, iterations, ciphertext }` all base64-encoded (`bufToB64`/`b64ToBuf` helpers) — this is exactly the JSON shape written to `gh-auth.json`.
    - `decryptToken(blob, password)` — re-derives the key using the blob's stored salt/iterations, decrypts with the blob's IV; throws (caught and rethrown as "Forkert adgangskode.") on any AES-GCM auth-tag mismatch, which is how a wrong password is detected (AES-GCM decryption fails cleanly rather than silently producing garbage).
    - `resolveToken(password)` — the "unlock" entry point: fetches the current `gh-auth.json` via the **public raw URL** (`rawGithubUrl` against `AUTH_PATH`, no auth needed since the repo is public), then calls `decryptToken`. Throws a Danish error if no shared token has been set up yet, or if the password is wrong.
  - **The shared password itself is never transmitted or stored remotely** — it only ever exists in the browser: typed into `#gh_password`, optionally cached in `localStorage['baanddb_gh_password']` (`GH_PASSWORD_KEY`, via `saveGhPassword()`/`loadGhPassword()`/`applyGhPassword()` on page load) purely as a local convenience so the user doesn't retype it every visit, and used only to locally derive the AES key that decrypts the token already sitting in the repo. The page's own explicit warning (`.gh-note`) states the repo is public so the encrypted blob is visible to anyone — security rests entirely on password strength/secrecy, not on the blob being hidden.
- **Pull priority**: every pull path (`autoLoadFromGithub`, `githubPull`) tries the **public raw GitHub URL first** (`rawGithubUrl()` → `https://raw.githubusercontent.com/{user}/{repo}/main/{path}`, cache-busted with `?t=timestamp`), which needs no password since the repo is public. Only if that fails (non-OK response) does it fall back to the authenticated Contents API (`GET .../contents/{path}` with `Authorization: Bearer {token}`), which requires resolving the shared token via `resolveToken(password)` — so pull only ever needs a password when the raw URL is unreachable (e.g., transient CDN/cache issue) and a password is available.
- **Push always requires the shared token** — `githubPush()` unconditionally calls `resolveToken(password)` first; there is no unauthenticated push path (correct, since GitHub's Contents API write endpoint requires auth). It then fetches the current file SHA (`getFileSha`, needed for GitHub's optimistic-concurrency PUT), base64-encodes the pretty-printed `db` JSON (`unescape(encodeURIComponent(...))` trick to safely btoa non-Latin1 chars, e.g. Danish æøå in `bemaerkning`), and PUTs it to the Contents API with a commit message stamped with entry count and a Danish-locale timestamp.
- **`autoLoadFromGithub()`** runs once automatically at the bottom of the script on every page load (unconditionally, not gated on any explicit user action), immediately after `renderPreview()` and `applyGhPassword()`, before `switchMachine('Store HF')`. It shows a spinner status in the header (`setSyncStatus`), tries the public raw URL, falls back to the authenticated API only if a password happens to already be cached in localStorage, and if both fail, silently falls back to whatever is already in `localStorage`/`db` ("Bruger lokal cache") — network/parse errors are swallowed (caught, not surfaced as page errors) so a fully offline user still gets a usable page with stale local data.

#### `localDirty` and `deletedIds` (tombstones) — the two-bug fix

This mechanism exists specifically to stop background/auto pulls from silently discarding a user's own unpushed local edits, and to stop a stale/cached remote pull from resurrecting something the user just deleted. The two mechanisms are independent but interact at the same gate.

- **`localDirty`** (in-memory var `localDirty`, backed by `localStorage['baanddb_local_dirty']` = `LOCAL_DIRTY_KEY`):
  - `loadLocalDirty()` reads it as boolean (`=== '1'`) at page load into the module-level `localDirty` var.
  - `setLocalDirty(val)` is the only way it's ever changed: sets the in-memory flag AND persists it (`localStorage.setItem` on true / `removeItem` on false) in the same call — this dual persistence was itself the bugfix noted in-code: an in-memory-only flag didn't survive a page reload, so a user could save an edit, reload before pushing, and a fresh auto-load would see no dirty flag and silently clobber the unpushed edit with the old remote copy.
  - **Set to `true`** by every local-mutation path: `saveEntry()` (add/edit), `deleteEntry()`, `importDB()`, `saveBulk()`.
  - **Set to `false`** only after: a successful `githubPush()` (local now matches what's on GitHub), or a successful `githubPull()` — either the raw-URL branch or the authenticated-API fallback branch (both explicitly call `setLocalDirty(false)`), since a pull is itself confirmed by a "Erstat lokal database med data fra GitHub?" `confirm()` dialog, i.e. an intentional, user-acknowledged overwrite.
  - **Checked in `autoLoadFromGithub()` only** (not in manual `githubPull()`, which is already gated by explicit confirm): both the raw-URL success branch and the authenticated-API fallback branch check `if (localDirty)` immediately after parsing the fetched array and **before** applying it — if dirty, the fetch result is discarded entirely (not even tombstone-pruned or merged), a "⚠ Lokale ændringer bevaret (ikke overskrevet)" status is shown, and the function returns without touching `db`/`nextId`/localStorage. This means **while `localDirty` is true, auto-load is a complete no-op on the actual data** — it still makes the network request and could theoretically warn about it, but does no write of any kind, including no tombstone pruning (see below).
- **`deletedIds`** (in-memory `Set`, backed by `localStorage['baanddb_deleted_ids']` = `DELETED_IDS_KEY`, JSON array of ids):
  - `loadDeletedIds()`/`saveDeletedIds()` handle load/persist as a Set ↔ JSON array.
  - `deleteEntry(id)` adds the id to `deletedIds`, persists it, and also calls `setLocalDirty(true)` — both a tombstone and the dirty flag are recorded for a single delete.
  - `applyTombstones(parsed)` is run on every freshly-pulled remote array (in all three pull-adjacent code paths: `autoLoadFromGithub` raw branch, `autoLoadFromGithub` API-fallback branch, and `githubPull`'s equivalent branches) **after** the `localDirty` early-return, i.e. tombstone application only ever happens on data that's actually about to be written into `db`. It does two things in one pass: (1) prunes `deletedIds` down to only ids that still exist in the freshly-fetched `parsed` array (i.e., once the remote itself no longer has an id, there's nothing left to guard against, so the tombstone for it is dropped — this is what keeps the tombstone list from growing unboundedly), persisting the pruned set immediately; (2) returns `parsed` filtered to exclude any entry whose id is still tombstoned, so a stale/CDN-cached raw-URL response (or an out-of-date collaborator's push) that still contains a since-deleted entry cannot resurrect it locally.
- **How they interact**: a pull (auto or manual) is a two-gate process — first `localDirty` decides whether the pull is allowed to write anything at all (if dirty, the whole thing is skipped, tombstone pruning included); only once that gate passes does `applyTombstones()` run on the incoming data to reconcile deletions. This means a tombstone can persist and keep growing for longer than the "remote already caught up" ideal case whenever the user has unpushed local changes sitting around, because pruning is deferred until the next pull that's actually allowed to proceed (i.e. until `localDirty` clears via push, or the user does a manual confirmed pull). This is an accepted tradeoff, not a further bug: correctness (never resurrecting a local delete, never clobbering an unpushed edit) is prioritized over eagerly shrinking the tombstone list.

#### Print behavior

None — there is no `@media print` block, no `window.print()` call, and no printer-specific styling anywhere in the file.

#### Known quirks / gotchas

- **Dead modal markup**: `#editModal` / `#modalFormContainer` / `closeModal()` / `saveModal()` exist in the HTML but `closeModal`/`saveModal` are never defined in `<script>` — clicking those buttons would throw a `ReferenceError`. `editEntry(id)` bypasses this modal entirely and edits in the main admin-page form instead. Do not assume the modal is functional; either wire it up or remove the dead markup if touching this area.
- **No cross-client id coordination**: `nextId` is a purely local, per-browser monotonic counter. Two people entering new local entries independently (before either pushes) will likely generate colliding `id` values; the next push simply overwrites whichever `db` array is pushed last, and there is no merge — pushing is a full-file overwrite of `Baanddb/database.json`, not a diff/merge. This is consistent with the tombstone design (which assumes a full-replace pull/push model) but means concurrent multi-user editing without frequent push/pull cycles is unsafe.
- **Search has no distance ceiling**: fuzzy ("near") matches via Levenshtein distance or mm-diff have no cutoff — searching for something with zero good matches will still return up to 8 "near" results ranked by whatever distance exists, which could be misleadingly far off and should not be assumed to imply relevance just because it's labeled and colored as a match.
- **Bulk mode is Store HF only**: there's no bulk path for Lille HF; `saveBulk()` hardcodes `maskine: 'Store HF'`.
- **`switchMachine` clears fields as a side effect**: calling `switchMachine()` while a form has values in the "wrong" machine's exclusive fields silently wipes them (by design, to prevent stale cross-machine data), so any future code path that calls `switchMachine()` after populating fields (rather than before, as `editEntry` correctly does) would lose data.
- **`gh_user`/`gh_repo`/`gh_path` hidden inputs are vestigial**: `ghSettings()` returns hardcoded literals (`westfrost`/`Induminati`/`Baanddb/database.json`) rather than reading the hidden `#gh_user`/`#gh_repo`/`#gh_path` inputs present in the DOM — those inputs are labeled "Hidden inputs to satisfy ghSettings reads" in a comment but are not actually read by the current `ghSettings()`; changing them in the DOM would have no effect.
- **Public repo security caveat is explicit and load-bearing**: the encrypted `gh-auth.json` blob is visible to anyone (public repo), so the entire push-access security model rests on the shared password's strength/secrecy — this is called out on-page, not hidden.
- **Auto-load runs unconditionally on every page load** with no toggle to disable it; the only thing that suppresses it from overwriting local data is `localDirty`.

#### Current version

Footer at the bottom of the file: **v1.9, dated 14-09-2026** — `<div ...>Bånd &amp; Medbringer DB &middot; v1.9 &middot; 14-09-2026</div>`.

---

### Ordrer/ — Ordreliste-værktøj

**File:** `/home/user/Induminati/Ordrer/index.html` (single self-contained file, 913 lines — no separate CSS/JS files)
**Current version:** `v3.0 · 18-08-2026` (footer: `<footer>Byg til intern brug &middot; v3.0 &middot; 18-08-2026</footer>`)
**Status:** Live front-page tool (moved out of `Test/` per commit `637ced0`, "Flyt Ordreliste-værktøj fra Test til forsiden")

#### 1. Purpose

This tool cleans and rolls forward the daily "Frigivne produktionsordrer" (released production orders) export from Business Central. BC's raw export has inconsistent columns (varies by which PC it was exported from) and no tracking of what changed day-to-day. The tool's job is to:

- Strip the raw export down to a fixed whitelist of relevant columns.
- Optionally **diff against yesterday's already-cleaned output** so that manually-entered tracking data (a "Rykket"/"moved" date, a "Grund"/reason, a "Ny leveringsdato"/new delivery date typed in by staff) isn't lost when the sheet is regenerated the next day.
- Detect and flag **newly appeared order numbers** that weren't in yesterday's file.
- Auto-fill a "Rykket" (moved) timestamp when staff have filled in "Ny leveringsdato" but haven't yet marked it as moved — a lightweight audit trail of when a delivery date change was noticed.
- Pull in "Intern sælger" (internal salesperson) from a separate Salgsordrer (sales order) export, matched via `Kildenr.` (source number).
- Filter the result down to only the weeks the user cares about (with everything overdue always included), and produce a clean, filtered, sortable, properly-typed `.xlsx` that becomes tomorrow's "i går" (yesterday) input — i.e. the tool is designed to be run once per day in a loop, chaining its own output as next-day input.

#### 2. UI walkthrough (top to bottom)

**Header** — standard site topbar (`Trin 2 · Sammenligning` step tag), "← Forside" link back to `../index.html`.

**Panel 1 — "1. Upload ark"** (three-column `.upload-grid`, collapses to 2/1 columns on smaller screens):
- **"I dag" (required)** — `#dropToday` / `#fileInputToday`, accepts `.xlsx,.xls`. Expects the raw BC "Frigivne produktionsordrer" export.
- **"I går" (optional)** — `#dropYesterday` / `#fileInputYesterday`. Expects this tool's own previous output (already cleaned). Has a `#clearYesterday` "Fjern 'i går'-fil" link (only shown once a file is loaded) that resets `yesterdayRawRows`, the filename display, and the file input.
- **Salgsordrer (required)** — `#dropSales` / `#fileInputSales`. Expects a sales-order export containing `Nummer` and `Intern sælger` columns.
- All three are drag-and-drop zones (`setupDrop()`) that also respond to click-to-browse; a shared `#status` message box (`.status.ok/.err/.info`) reports load results/errors for whichever zone was last touched.

**Panel 2 — "2. Vælg uge(r)"** — six checkboxes `#weekOptions .week-cb[data-offset=0..5]`, "Denne uge" through "Uge +5", offset 0 checked by default. Each label shows a computed date range (`weekRange0..5`, dd/mm–dd/mm) and ISO week number (`weekNum0..5`, "Uge NN"), populated once at page load via `getWeekRange()`/`getISOWeekNumber()`.

**Panel 3 — "3. Hvad værktøjet gør"** — a static Danish explainer (`.rules`) documenting the exact cleaning/comparison rules (mirrors the JS logic below — kept in sync manually, not generated). Contains the **"Kør" (`#processBtn`)** button (disabled until "i dag" + Salgsordrer are both loaded) and **"Download resultat (.xlsx)" (`#downloadBtn`)** button (disabled until processing has run).

**Panel 4 — "4. Resultat"** (`#previewPanel`, hidden until first run) — shows a row/column count (`#rowCount`, plus "· N markeret som nye" if any, plus "(viser første 200)" when truncated) and an HTML preview table (`#previewTable`) capped at 200 rows, inside a scrollable `.table-scroll` container with a sticky header row.

**External libraries** (both loaded from cdnjs, no bundling):
- `xlsx.full.min.js` (SheetJS 0.18.5) — used **only for reading** the three uploaded files, in `readWorkbookRows()`: `XLSX.read(data, {type:'array'})` then `XLSX.utils.sheet_to_json(sheet, {defval:''})`. It picks the sheet whose name contains "frigivne" (case-insensitive), falling back to the first sheet.
- `exceljs.min.js` (ExcelJS 4.4.0) — used **only for writing** the download, in the `downloadBtn` click handler: builds an `ExcelJS.Workbook`, adds a real Excel Table object, applies per-cell formatting, and streams out an `.xlsx` blob.

#### 3. File processing / column cleaning

Column whitelist is defined at the top of the script (commit `0e0fa61` switched this from a blacklist to a whitelist, so unknown/extra columns from varying export PCs are dropped automatically):

```js
const COLUMNS_TO_KEEP = ['Nummer', 'Varekategori', 'Beskrivelse', 'Kildenr.', 'Bekræftet leveringsdato', 'Status', 'Beskrivelse 2'];
```

`buildCleanedTodayRows()` does the cleaning, in this order:
1. Filters `originalHeaders` down to only those in `COLUMNS_TO_KEEP` (anything else is silently dropped, regardless of name); also computes `missing` — any whitelisted columns not found in the source, surfaced later as a warning.
2. Reorders columns: `Varekategori` is moved to sit right after `Nummer` (`MOVE_COLUMN`/`MOVE_AFTER`); `Beskrivelse 2` is moved to sit right after `Status`.
3. Appends three new empty columns — `Rykket`, `Grund`, `Ny leveringsdato` (`NEW_COLUMNS`) — positioned right after `Beskrivelse 2` (or after `Status` if `Beskrivelse 2` wasn't present, or appended at the end if neither anchor exists).
4. Inserts an `Intern sælger` column right after `Kildenr.` (or appended at the end if `Kildenr.` is absent).
5. Maps every raw row into the new header set: `NEW_COLUMNS` cells start blank; `DATE_LIKE_COLUMNS` (`Bekræftet leveringsdato`, `Rykket`, `Ny leveringsdato`) get run through `formatDateDK()`; everything else is copied through as-is (missing values become `''`).
6. Drops fully-empty rows (`isRowEmpty()`).
7. Applies the week filter (see §5).
8. Drops rows whose `Status` is `6. SFE` or `3. FÆRDIG` (`STATUS_VALUES_TO_DELETE`).

Date parsing/formatting helpers: `excelSerialToDate()` converts Excel's numeric date serials; `parseDateValue()` accepts a `Date`, a numeric serial, or a `dd-mm-yyyy` string; `formatDateDK()` renders any of those back out as `dd-mm-yyyy` text (used for display/preview and for the intermediate cleaned-row representation — actual Date objects are only reconstructed at export time).

#### 4. Comparison logic ("i dag" vs "i går")

Diff key is **`Nummer`** (`KEY_COLUMN`), compared as a trimmed string.

- If no "i går" file is uploaded, the result is simply the cleaned "i dag" rows (sorted — see §5) — the status message tells the user to save it and use it as tomorrow's "i går".
- If "i går" is present:
  - Yesterday's rows are re-aligned to today's header set (`yesterdayAligned`) and re-formatted for date-like columns, then empty rows dropped.
  - **"Rykket" auto-stamping**: for each yesterday row, if `Ny leveringsdato` is filled in but `Rykket` is still blank, `Rykket` is set to `todayDK()` (today's date) — a one-time stamp of when the change was first detected. If `Rykket` already has a value, the tool never touches either field again (per commit `40654ec`, "Ret 'Rykket'-logik ... til at stemple dags dato" — this used to copy something else in, now it stamps today's date).
  - **New rows**: any `Nummer` in today's cleaned set not present in yesterday's key set is a "new order" — collected into `newOrders` and their keys into `newRowKeys` (used for preview highlighting).
  - **Field sync for rows present in both** (built from `todayKeyStatus`/`todayKeyKildenr`/`todayKeyDate` maps keyed off the **raw** today rows, not the cleaned ones):
    - `Status` is always overwritten to today's value if different (`statusUpdated` counter).
    - `Bekræftet leveringsdato` is always overwritten to today's value if different (`dateUpdated` counter) — per commit `d4b9515`, "Opdater Bekræftet leveringsdato altid ved sammenligning".
    - `Kildenr.` is filled in from today **only if it was blank in yesterday's row and today has a value** — never overwrites an existing value (`kildenrFilled` counter).
    - `Rykket`, `Grund`, `Ny leveringsdato` are never touched by this sync step — they're the user's manually-maintained fields, preserved as-is from yesterday.
  - **Removal**: a yesterday row is dropped from the result only if its key is no longer present in today's raw data at all, or if today's status for that key is `6. SFE`/`3. FÆRDIG`. Critically, an order that just fell outside the selected week range is **not** removed — the week filter only applies to brand-new rows coming from "i dag" (see §5), so previously-tracked orders survive regardless of week selection.
  - Final result = `yesterdayAligned` (surviving, updated rows) concatenated with `newOrders`, then sorted.
  - `applySalesLookup()` (see below) runs on the final combined row set either way.

**Salgsordre lookup**: `buildSalesMap()` builds a `Nummer → Intern sælger` map from the sales-order file (first occurrence wins per key). `applySalesLookup()` matches each result row's `Kildenr.` against that map and writes `Intern sælger`; unmatched or empty `Kildenr.` leaves the field blank. This runs unconditionally on every process, both with and without a yesterday file (commit `068cc43`).

#### 5. Week filtering & sorting

- `getMonday(d)` / `getWeekRange(offsetWeeks)`: computes Monday 00:00:00 → Sunday 23:59:59.999 for the week that is `offsetWeeks` weeks after the current week's Monday. Offsets 0–5 are precomputed once at page load to populate the six checkbox labels' date ranges and ISO week numbers (`getISOWeekNumber()`, standard ISO-8601 week calc via Thursday-of-the-week trick).
- `selectedWeekRanges()` reads whichever `.week-cb` boxes are currently checked and returns their ranges.
- `isDateInRanges(date, ranges)`: **there is no lower bound** — the cutoff is only the `end` of the *latest* selected week (`Math.max` of all selected ranges' end times); anything with a `Bekræftet leveringsdato` on or before that cutoff passes, including anything overdue/in the past. This means unchecking "Denne uge" while keeping "Uge +2" checked still includes everything up through the end of "this week" and earlier — the checkboxes only ever push the *upper* boundary forward, they don't carve out gaps.
- This filter is applied **only inside `buildCleanedTodayRows()`**, i.e. only to rows freshly derived from "i dag". Rows carried over from "i går" during a comparison are exempt (per §4), so an order already being tracked never disappears just because it drifted past the week window.
- `processBtn` refuses to run if zero week checkboxes are checked (`showStatus('Vælg mindst én uge...', 'err')`).
- **Sorting**: `sortByDeliveryDate()` is applied to the final result in both branches (no-yesterday and with-yesterday), sorting by `Bekræftet leveringsdato` ascending (oldest first), with dateless rows pushed to the bottom, and original array order used as a stable tiebreaker for equal/missing dates (commit `129dce6`, most recent change to the file).

#### 6. Excel output generation

Triggered by `downloadBtn` (async handler, uses ExcelJS):

- Creates one worksheet named `Frigivne produktionsordrer`.
- Column widths auto-sized per column: `min(max(longestValueLength+1, 8), 22)`.
- Row values are built via `tableRows`: for `DATE_LIKE_COLUMNS`, `parseDateValue()` converts the stored string back into a real JS `Date` object (falling back to the raw string if unparseable) — so dates land in the workbook as genuine Excel date cells, not text (commit `3167b4a`).
- **This is written as an actual ExcelJS Table object** (`ws.addTable({name:'FrigivneProduktionsordrer', ref:'A1', headerRow:true, totalsRow:false, style:{theme:'TableStyleMedium2', showRowStripes:true}, columns:[...{filterButton:true}], rows: tableRows})`) — commit `5642cbe` deliberately switched to this from manual cell coloring specifically so the grey/white row banding is a *table property tied to row position*, not a fixed per-row fill, meaning it won't visually break/shift when the user sorts the data inside Excel. `filterButton:true` on every column also gives the header row Excel autofilter dropdowns.
- After the table is built, every cell (including empty ones, `includeEmpty:true`) gets a thin black border on all four sides and font size 10 (bold on the header row only). Date-column cells that are actual `Date` instances additionally get `numFmt = 'dd-mm-yyyy'`.
- Header row is frozen (`ws.views = [{state:'frozen', ySplit:1}]`).
- Page setup: landscape, A4 (`paperSize:9`), fit-to-width 1 page (height unconstrained, `fitToHeight:0`), narrow margins (0.3"/0.4"/0.2") — commit `d105c10`.
- Filename: `` `Frigivne Produktionsordrer - ${todayDK()}.xlsx` ``, e.g. `Frigivne Produktionsordrer - 25-08-2026.xlsx`.
- **Important gap: new-row highlighting is preview-only.** `newRowKeys` (used for the amber `.new-row` background and the `NY` badge in the on-screen HTML `#previewTable`, see `renderPreview()`) is **never referenced anywhere in the `downloadBtn` handler**. The exported `.xlsx` has no color-coding, no marker column, and no comment/note distinguishing new orders from carried-over ones — a maintainer wanting that in the actual file would need to add it explicitly (e.g. a fill on rows whose key is in `newRowKeys`, mirrored into `tableRows`/cell styling).

#### 7. Known quirks / gotchas

- **New-row marking doesn't survive into the downloaded file** (see §6) — only the live browser preview shows which rows are new. If a user relies on the exported file to see what's new, they won't find it there; this may be worth flagging to the user or fixing.
- **Week filter has no floor, only a ceiling** — checking only "Uge +3" still pulls in everything overdue and everything through the end of that week; it is not possible to look at a single future week in isolation. This is intentional per the in-app copy ("inklusiv alt bagudrettet/overskredet") but easy to misread as a per-week filter.
- **Week filter doesn't affect carried-over rows** — only fresh "i dag" rows are subject to the week cutoff during a comparison run; a tracked order that drifts past the selected week window stays in the result rather than disappearing. This is deliberate (documented in the panel-2 `.rules` copy) but is the kind of behavior a maintainer could "fix" by accident, breaking the intended workflow of never silently losing a tracked order.
- **`Rykket` stamping is one-way and irreversible via this tool**: once `Rykket` has any value, the tool will never overwrite it again even if `Ny leveringsdato` changes further — by design (documented behavior), but worth knowing before "fixing" what looks like a stale timestamp.
- **Status/date sync always wins**: `Status` and `Bekræftet leveringsdato` are unconditionally overwritten from today's raw export on every comparison, even if a user had manually edited those specific cells in a previously-downloaded/re-uploaded "i går" file — only `Kildenr.` has fill-if-blank protection, and only `Rykket`/`Grund`/`Ny leveringsdato` are fully hands-off.
- **`missing` column warning** (`COLUMNS_TO_KEEP` entries absent from the source) degrades the status message from `ok` (green) to `info` (amber) but does not block processing — the tool proceeds with whatever columns it can find.
- **"I går" alignment silently reshapes older files**: `yesterdayAligned` is built by re-mapping yesterday's rows onto *today's* header set (`headers.forEach(h => ...)`), so if yesterday's file has a materially different column layout (e.g. from before a code change altered `COLUMNS_TO_KEEP`/`NEW_COLUMNS`), those old columns are simply dropped rather than erroring — worth checking column-list changes don't quietly discard data on the next day's run.
- **Sheet selection heuristic**: `readWorkbookRows()` picks the sheet whose name contains "frigivne" (case-insensitive) or falls back to the first sheet in the workbook — if BC's export or a saved output ever has multiple sheets without "frigivne" in the right one's name, the wrong sheet could be read silently.
- The `#clearYesterday` overlap-with-status-message bug mentioned in commit `86fc70a` ("Ret overlap mellem statusbesked og 'Fjern i går-fil'-link") appears already resolved in current markup/CSS — the clear link lives inside its own `.upload-col` under the Yesterday drop zone, while `#status` is a separate full-width element below the upload grid; no overlap is visible in the current layout.

#### Key functions/constants reference (for quick navigation)

`COLUMNS_TO_KEEP`, `NEW_COLUMNS`, `KEY_COLUMN`, `DATE_LIKE_COLUMNS`, `STATUS_VALUES_TO_DELETE` (constants, top of `<script>`) · `readWorkbookRows()` (SheetJS read) · `buildCleanedTodayRows()` (whitelist + reorder + new columns + week filter + status filter) · `buildSalesMap()` / `applySalesLookup()` (Intern sælger join) · `sortByDeliveryDate()` · `getWeekRange()` / `getMonday()` / `getISOWeekNumber()` / `isDateInRanges()` (week logic) · `parseDateValue()` / `formatDateDK()` / `excelSerialToDate()` / `todayDK()` (date handling) · `processBtn` click handler (lines ~702–812, main diff/merge logic) · `renderPreview()` (HTML preview + new-row badges) · `downloadBtn` click handler (lines ~843–910, ExcelJS export).

---

### Opskæring/ — Opskæringsberegner

**File:** `/home/user/Induminati/Opskæring/index.html` (single self-contained file, ~1567 lines: inline `<style>` + inline `<script>`, plus `xlsx.full.min.js` (SheetJS 0.18.5, CDN) for reading the optional stock-list upload — otherwise no external deps besides Google Fonts). Current version: **v3.3 · 14-09-2026** (footer at line 1566).

#### 1. Purpose

Solves the "how do we cut this order's belts out of the mother rolls we have" problem for conveyor-belt production. Input is a set of one or more mother rolls (stock rolls, each with a width and length) and a set of belt orders (each a width × length × quantity). The tool computes a cutting plan — which rolls to use, how many transverse cuts and how many longitudinal strips per cut, and which belts (or "dorn" bundles of belts) come out of each strip — that minimizes wasted roll length/area, and produces both an on-screen visual/tabular plan and a printable A4 work order ("arbejdsseddel") that a machine operator follows at the cutting table.

#### 2. UI walkthrough (top to bottom)

- **Moderruller (mother rolls) card** — a repeatable row list (`#roll-list`), each row: **Antal** (qty, integer ≥1, defaults to empty/1 on first row), **Bredde mm**, **Længde mm**, and a `×` delete button. "Tilføj moderrulle" button adds another row. Hint text explains rolls are consumed **in the order listed** — top row is cut first, so put the roll you'd rather use first on top, and the one you want to keep intact at the bottom (roll order is not itself an optimization variable — the algorithm doesn't reorder rolls, it fills them top-to-bottom). At the top of this card, a **lagerliste-upload** (`#lager-drop`, click-or-drag `.xlsx`/`.xls`) lets the operator feed in a stock export instead of typing rolls by hand — see §3a. Rows added this way are tagged and visually distinct (a small "Fra lager: <kode>" chip) but are otherwise perfectly normal, editable rows; manually-typed rows can always be added before, after, or alongside them.
- **Bånd der skal skæres (belts to be cut) card** — identical repeatable row list (`#band-list`): Antal / Bredde mm / Længde mm / delete. "Tilføj linje" adds rows. Tab from the last row's length field auto-adds a new row and focuses it (`makeRow`'s keydown handler).
- **Tillæg og begrænsninger (allowances & limits) card**:
  - **Buffer pr. bånd** (`#buffer`, number, default 0) — added to every belt's length before cutting (cut length = length + buffer). Meant for trim/inspection allowance.
  - **Maks strimler pr. båndbredde** (`#max-strimler`, integer ≥1, blank = unlimited) — caps how many side-by-side strips of the *same width* may appear in one row (transverse cut). Useful when the shop only has a limited number of knives/spacers set for a given width.
- **Dorn — pak bånd i bredden card**:
  - **Brug dorn-pakning** checkbox (`#dorn-on`, checked by default) — toggles the whole dorn-packing feature.
  - **Skæretillæg pr. dorn** (`#dorn-tillaeg`, default 0) — extra width added per dorn bundle for the knife kerf/spacing when later slitting the wide strip into individual belts.
  - **Maks bredde pr. dorn** (`#dorn-maxbredde`, default 700) — max total width of a dorn bundle.
  - **Maks bånd-længde for dorn** (`#dorn-maxlaengde`, default 5500) — belts longer than this are never dorn-packed (too long/heavy to bundle on a mandrel presumably).
  - Hint explains the rule precisely (see §3).
- **Ordre / Reference card** — free-text **Ordrenummer / Kunde** and optional **Note** fields, used only for labeling the result header, the printed work order, and history entries (not used in calculation).
- **Error/warning boxes** (`#error-box`, `#warn-box`) — hidden by default, shown above the result on validation failure or non-fatal warnings.
- **"Beregn opskæring" button** (`#btn-calc`) — runs `calculate()`. Also triggered by pressing Enter in any input field (global keydown listener).
- **`#result`** — populated dynamically by `renderResult()` after a successful calculation (see §4).
- **Gemte beregninger (saved calculations) card** — history list (`#history-list`) backed by `localStorage` key `opsk_history` (max 15 entries, newest first). Each entry is clickable to reload all inputs (`loadHistEntry`) and has its own delete button; "Ryd alt" clears everything after a `confirm()`.

#### 3. Core algorithm

**Model: three-stage guillotine cutting**, matching the physical process exactly (comment at line 399 makes this explicit):
1. **Tværsnit** (transverse cut) — cut a full-width **row/section** off the mother roll at some length H.
2. **Længdesnit** (longitudinal cut) — slit that row into side-by-side **strips** (columns) of various widths.
3. **Tværsnit** — cut each strip into its individual belts (or a dorn bundle, later slit into N identical belts).

Rolls are consumed strictly in the order entered; within a roll, sections are appended end-to-end until the roll runs out or nothing more fits.

**Step 0 — "units" (`buildUnits`, line 341).** Belt line items are grouped by (width, length). For each group, if dorn packing is on, `qty ≥ 2`, and `length ≤ dorn.maxL`, it computes `perDorn = floor((dorn.maxW - dorn.tillaeg) / width)`; if `perDorn ≥ 2` the group's belts are split into dorn bundles ("units" of kind `'dorn'`) sized as evenly as possible across `ceil(qty/perDorn)` bundles (avoids one bundle ending up with a single leftover belt — e.g. splits 10 into 5+5, not 6+4). Groups that don't qualify become individual `'band'` units. Every unit carries `w` (width), `len` (cut length = original length + buffer), and a `bands` array (the underlying real belts it represents) — a dorn unit's `bands` array has N entries so the work order can always say "cut this strip into N belts of width W." `explodeUnit()` (line 387) reverses a dorn back into individual band units when the dorn can't be placed (too wide/long for any roll, or gets rejected by the retry logic below).

**Step 1 — filling one row (`fillSection`, line 433).** Given a target row width B and row length cap H: units are bucketed by width (`byW`), each bucket sorted longest-first. Repeatedly picks, among all widths that still fit in remaining width `wRem` (and haven't hit `maxPerWidth` count), the width whose next strip (`fillColumn`) can be packed with the greatest filled length — because "area gained per unit of roll width consumed" equals the filled length for a fixed row length H. `fillColumn` (line 412) greedily packs units end-to-end into a single strip, longest available unit first, without exceeding cap H. Resulting strips (columns) are sorted widest-first (ties by fill) so identical widths in a row end up adjacent — keeps knife setups grouped and gives the operator all same-width belts consecutively. The row's actual length is `max` over all strips' filled length (not H) — trailing slack in shorter strips becomes their `rest`.

**Step 2 — choosing row length H (`bestSection` + `candidateLengths`, lines 513/479).** Rather than trying arbitrary H values, `candidateLengths` restricts candidates to actual achievable strip lengths: every unit's own `len`, plus subset-sums of repeated unit lengths (bounded search, capped at 4000 partial sums), clipped to `[minH, maxH]` where `minH` is forced to be at least the longest remaining unit's length (so nothing is perpetually deferred). If more than `CAND_LIMIT` (90) candidates result, it downsamples evenly. For each candidate H, `fillSection` is run and scored by absolute **waste** (`H×B - filled area`); ties go to the *longer* row (more material moved + saves a knife changeover). Lowest-waste (then longest) row wins.

**Step 3 — filling a roll and multiple rolls (`placePass`, line 540).** For each roll in listed order, repeatedly calls `bestSection` on the remaining available length and appends the winning section, removing placed units from the pool, until nothing more fits or the pool is empty.

**Step 4 — merging identical-layout rows (`mergeSameLayoutSections`, line 565).** After a pass, consecutive/any rows on the same roll that ended up with the exact same set of strip widths are merged into one longer row (strips paired shortest-filled-first to keep the merged row as short as possible) — this never costs extra roll length (`max(a)+max(b) ≥ max(a+b)`) and saves a knife-setup change. `attemptPlan` (line 614) alternates `placePass` and `mergeSameLayoutSections` up to 3 times (merging can free up length that lets more leftover units be placed).

**Step 5 — retry/backoff on unplaceable dorns (`planCutting`, line 641).** If some units are left over (`leftovers`) after `attemptPlan`, the algorithm identifies which dorn groups contain the problem belt sizes, explodes just those dorns back into individual belts, and reruns `attemptPlan` from scratch on the whole unit set (not resuming a half-built plan — comment explains resuming would lock in the very rows that failed). This repeats up to 5 rounds, keeping whichever attempt scores best via `planScore`/`betterPlan` (fewest unplaced belts first, then least total roll length used).

**Global constraints respected:** roll width (belt/dorn width ≤ roll width), roll length (cut length ≤ available roll length), `maxPerWidth` (max same-width strips per row), dorn max width/length and kerf allowance. Rolls too narrow/short for a unit are pre-filtered in `bestSection`; units too big for *any* roll are exploded immediately in `attemptPlan` (line 619).

Key function map: `buildUnits` (belts→units incl. dorn grouping) → `explodeUnit` (undo dorn) → `fillColumn`/`fillSection` (pack one row) → `candidateLengths`/`bestSection` (pick best row length) → `placePass` (fill all rolls) → `mergeSameLayoutSections` (combine identical rows) → `attemptPlan` (one full pass+merge cycle) → `planCutting` (top-level: retry with dorn splitting) → `calculate()` (UI glue, validation, calls `planCutting`, then `renderResult`). `vaelgRullerFraLager` (line 791, see §3a) sits on top of this same stack — it calls `planCutting` repeatedly with different candidate roll sets, it never modifies the packing engine itself.

#### 3a. Lagerliste-import og automatisk rullevalg (`vaelgRullerFraLager`, line 785)

Added so the operator can feed the tool a stock export instead of (or alongside) typing mother rolls by hand, and have it pick the fewest possible physical rolls needed to complete the current belt order.

**Input format.** An uploaded `.xlsx` (read with the same `xlsx.full.min.js`/SheetJS already used by `Ordrer/` and `Kapacitet/`, loaded from CDN — the only external dependency this page has beyond Google Fonts) is expected to be a Business Central-style export with columns `Kode` (optional), `Beskrivelse` (optional), `Bredde`, and `Længde`. Column matching is by header name (`parseLagerRows`, line 728), not position, and any other columns present in the export (`Planlagt disponibel balance`, `Bruttobehov`, `Fastlagt tilgang`, etc.) are ignored entirely — only `Bredde`/`Længde` are required; missing either aborts the whole import with a named-column error instead of silently proceeding.

**Antal is always 1 per row — never derived from any quantity/balance column, by explicit instruction (14-09-2026).** An earlier version computed the physical roll count from BC's `Planlagt disponibel balance` (total m² on hand ÷ one roll's area, rounded) — this was deliberately removed: that column doesn't reliably reflect how many *whole, usable* rolls are actually sitting on the shelf, so trusting it could silently tell the operator to cut from rolls that don't really exist in that quantity. Every row in the uploaded file — regardless of what other columns it has — is now treated as exactly **one** physical roll of that Kode/Bredde/Længde. If the same variant genuinely exists more than once in stock, it must appear as separate rows in the spreadsheet (or the user adds more manually after auto-select). A row with non-positive/non-finite width or length is silently skipped and counted in the status line; there is no other validation.

**Selection algorithm.** Every variant is expanded into `antal` individual roll instances (`{kode, beskrivelse, w, len}`), sorted ascending by area (tie-broken by length, then width, then kode). Two phases, both reusing `buildUnits`/`planCutting` unchanged against the page's *current* belt list, buffer, dorn settings, and `maxPerWidth`:
1. **Single-roll check** — for every instance whose own area is at least the order's total base area (`Σ qty × b × (l+buffer)`, a cheap necessary-but-not-sufficient filter that skips the many too-small candidates without running the packer on them), run `planCutting` with *just that one roll*. The first (smallest, since ascending) instance that leaves zero leftovers wins outright — this is what guarantees a genuine 1-roll solution is found and preferred over combining several smaller ones, whenever one exists.
2. **Incremental growth** — if no single roll suffices, build a pool from empty, always adding the next-smallest remaining instance and re-running `planCutting` **on the whole pool from scratch** each time (same "never resume a half-built plan" principle as `planCutting`'s own retry loop) until it succeeds or the entire stock list is exhausted.

This is a heuristic, not a proof of global-minimum roll count — consistent with the rest of the engine, which is greedy/heuristic throughout (see §6) — but it always finds a true 1-roll solution when one exists, and phase 2 never uses more rolls than the number of additions actually needed to reach feasibility.

**Feasibility short-circuit.** Before running any of the above, the click handler (not the pure function itself) checks every belt line against the *widest*/*longest* single item anywhere in the uploaded stock (mirroring `calculate()`'s own roll-vs-belt validation) and refuses with a specific, immediate error if something is structurally too big for anything on the list — this avoids the pathological case (confirmed by testing against a real 52-variant/974-roll export) where an impossible order would otherwise silently burn through the *entire* stock list one roll at a time (hundreds of `planCutting` calls, still fast in absolute terms — under half a second even in that worst case — but pointless) before reporting the shortfall.

**Wiring into `#roll-list`.** On success, previously auto-added rows (marked via `dataset.lagerKode` on the row element) are removed first — manually-typed rows are matched by *not* having that attribute and are never touched — then the chosen instances are grouped by `kode` (so two distinct stock items that happen to share dimensions still render as two separate, individually-traceable rows) into one row per group with `qty` = count, inserted in the same ascending-size order the search used. Each such row shows a small "Fra lager: `<kode>`" chip (`title` = full `Beskrivelse`) below the normal Antal/Bredde/Længde fields (`.band-row.has-kode` / `.roll-kode` in CSS — the row wraps to a second line only when this chip is present). **Editing a tagged row's Bredde or Længde by hand immediately strips the tag and chip** (an `input` listener in `makeRow`) — the row no longer corresponds exactly to that stock item, so showing its kode would be misleading. The kode/beskrivelse then ride along through the normal calculation path: `readRows()` reads them off `dataset` into each row object, `calculate()` copies them onto `rollDefs`, `attemptPlan` copies them onto its `roll` objects, and `renderResult`/`openPrintWindow`/the "urørte moderruller" list all append `· <kode>` to the roll header when present — so an operator reading the printed arbejdsseddel knows exactly which physical roll off the shelf each "Moderrulle N" refers to. History (`saveToHistory`/`loadHistEntry`) round-trips kode/beskrivelse the same way as any other roll field, so reloading a saved calculation preserves the traceability.

**When the stock can't fully cover the order** (not a structural mismatch, just not enough of it — genuinely possible on a large order against a real, finite warehouse), the function returns `daekket: false` plus the specific `leftovers` from the last attempt; the whole stock list *does* get added to `#roll-list` in that case (grouped as above) — this is intentional, not a bug to "fix" by capping it: it's an honest reflection that the entire uploaded stock was tried and still came up short, and the operator needs to see the full picture to know what to source or produce more of.

#### 4. Data flow

1. **User input** → `readRows()` parses roll rows and belt rows from the DOM into `{qty, b, l, srcRow, kode, beskrivelse}` objects (`kode`/`beskrivelse` are always empty strings for belt rows and for hand-typed roll rows — they're only non-empty for roll rows produced by the lagerliste auto-select, §3a), validating (integer qty ≥1, width/length >0), collecting per-row error strings; blank rows are silently skipped, partially-filled rows are hard errors.
2. `calculate()` (line 923) reads buffer, `maxPerWidth`, and the dorn settings object `{on, tillaeg, maxW, maxL}`, validates them, expands roll rows by quantity into `rollDefs` (one object per physical roll, carrying `kode`/`beskrivelse` along), and cross-validates every belt line fits the widest/longest available roll (else a specific error naming the offending line and the roll limits).
3. `_uid` (a module-level counter) is reset to 0 and `buildUnits()` builds the unit list (dorn bundles + single-band units) from the grouped belt rows.
4. `planCutting(rollDefs, units, maxPerWidth)` returns `{ rolls, unusedRolls, leftovers }` where each `roll` object is `{ idx, w, len, kode, beskrivelse, sections, usedLen }`, each `section` is `{ len, cols, area, widthUsed, sideRest }`, each `col` (strip) is `{ w, items (units), filled, x, rest }`.
5. A sanity check compares `placedBands + lostBands` against `totalBands` and pushes an internal-consistency warning if they don't match (defensive check on the algorithm itself — should never fire; if it does, something in the packing broke).
6. `renderResult(d)` builds the on-screen result: overall summary cards (belts placed/total, rolls used, total used length, utilization %, waste in m²), an optional red "Manglende materiale" (missing material) card listing unplaced belts grouped by width/length, then per-roll cards (stats grid + `sectionsHTML` table + `drawRollCanvas` visualization, each header appending `· <kode>` when the roll came from a lagerliste), a list of any completely untouched rolls, and a "Udskriv arbejdsseddel" print button. It also calls `saveToHistory(d)`.
7. **History**: `saveToHistory` snapshots `{id, v:3, date, time, orderRef, orderNote, inputs, summary}` into `localStorage['opsk_history']` (capped at 15, newest first) — `inputs.rolls[i]` includes `kode`/`beskrivelse` when present. `entryInputs()` provides backward compatibility for older history entry shapes (`rollDefs`/`bandRows`/`bands` fields from earlier versions) so old saved calculations still load correctly (those never have kode/beskrivelse, which is fine — falsy just means no chip). Clicking a history item calls `loadHistEntry()` which repopulates every input field and rebuilds the roll/band row lists (kode/beskrivelse included, so the "Fra lager" chip survives a reload), then scrolls to top — it does **not** auto-recalculate.

#### 5. Print/output behavior

Clicking **"Udskriv arbejdsseddel"** (`openPrintWindow(d)`, line 1229) builds a complete standalone HTML document string (own `<style>` tailored for A4 portrait print, 12mm margins, page-break rules on sections/roll headers) reusing the same `sectionsHTML`/`describeColumn`/`piecesHTML` functions as the on-screen render (single source of truth — comment at line 1010 flags this deliberately). Content: header with title, order ref/note, roll count, buffer, dorn settings summary, date/time; the "manglende materiale" table if anything is unplaced; per-roll header line (dimensions + stats + `· <kode>` when applicable) followed by the same row/strip/piece breakdown table as on screen (dorn rows highlighted, side-rest and length-rest rows shown in a muted italic style). It opens a new browser window (`window.open`), writes the HTML, and calls `w.print()` after a short delay (or on window load) — wrapped in try/catch since some browsers block/restrict `print()`. If the popup is blocked, an `alert()` tells the user to allow popups. No PDF/file is generated — it relies on the browser's native print dialog (print-to-PDF is up to the user).

#### 6. Known quirks / gotchas

- **`_uid` is a global counter, reset to 0 at the top of every `calculate()` call** (line 980) **and at the top of every `vaelgRullerFraLager()` call** (line 794) — if any future refactor calls `buildUnits`/`explodeUnit` outside of one of these two entry points without resetting it first, unit IDs could collide with a stale `used` Set from a previous run. Currently safe because `used` sets are always freshly created per `fillColumn`/`fillSection` call, and — critically for `vaelgRullerFraLager` — the reset happens **once**, before its single `buildUnits()` call, and is *never* repeated between its many subsequent `planCutting()` calls in the same search (those all share the one persistent `units` array; resetting `_uid` again mid-search would let freshly-exploded temporary unit IDs collide with the real ones).
- **"Dorn" units retain their exploded `bands` array permanently** — even after packing, `netAreaOf` and all the descriptive/print functions iterate `u.bands` to know what's really inside a dorn bundle, rather than trusting `u.w`/`u.len` alone. Don't strip this array in any future edit.
- **Dorn viability check**: `perDorn = floor((dorn.maxW - dorn.tillaeg) / g.b)`; if the kerf allowance (`dorn.tillaeg`) alone is ≥ the effective max dorn width, `perDorn` naturally comes out < 2 and dorn packing silently disables for that group — but there's also an explicit UI warning for this exact case (around line 975) computed against `min(dorn.maxW, maxRollW)`.
- **Row length candidates are heuristically capped** (`CAND_LIMIT = 90`, subset-sum cap `CAP = 4000`) — for large/varied order sets this is an approximation, not an exhaustive search; it will not always find the mathematically optimal row length, just a good one from achievable lengths.
- **Retry/backoff only tries 5 rounds** (`planCutting`, line 650) and only reacts to belts that ended up in `leftovers` — if a plan technically "succeeds" (nothing left over) but is inefficient, there's no further optimization attempt; the algorithm is greedy/heuristic throughout, not globally optimal. `vaelgRullerFraLager` (§3a) inherits this — it is explicitly documented as heuristic, not a proof of minimum roll count.
- **Roll order is fixed by user input order**, not optimized — the algorithm never tries reordering rolls to find a better overall plan, per the explicit UI hint. This also applies to auto-selected rolls: they're inserted in the ascending-by-area order the search used, and the real `calculate()` run then consumes them in that same DOM order.
- **Merging identical-layout rows can run up to 3 iterations** interleaved with re-placing leftovers (line 624) — if this ever needs a 4th pass for some edge case, it currently silently stops (bounded loop, not a fixed-point iteration to convergence).
- **History backward compatibility**: `entryInputs()` (line 1501) handles at least 3 different historical localStorage shapes (`v3` current `inputs` object, vs. legacy `rollDefs`/`bandRows`/`bands`) — do not remove this shim without checking whether users still have old entries in `localStorage`.
- **Internal consistency self-check** (around line 990) — a warning fires if `placedBands + lostBands !== totalBands`; this should be treated as a real bug indicator if it ever appears, not dismissed.
- **`maxPerWidth` interacting with leftovers** produces a specific warning suggesting the user raise/remove the limit (around line 993) — this is a UX hint, not an automatic retry without the constraint.
- **`vaelgRullerFraLager`'s worst case is genuinely slow-ish, by design, not a bug**: an order that turns out structurally impossible against the uploaded stock is caught early by the feasibility short-circuit (§3a) and returns instantly, but an order that's merely *short* on quantity/length (every constraint is individually satisfiable, there just isn't enough total stock) will exhaust the entire candidate list one `planCutting` call at a time before reporting the shortfall — this is now less likely to bite in practice than when the tool derived `antal` from a balance column (each Kode contributes at most 1 candidate roll now, so a real export's total candidate count is exactly its row count, not inflated by a computed multiplier), but the worst case is still bounded and was previously confirmed at ~300ms for a 974-roll/52-variant export before this change; keep the function button-triggered, not called in a loop or on every keystroke.
- **Stock quantity is never inferred, only counted in rows** (14-09-2026, see §3a) — if a warehouse genuinely holds more than one of a given Kode/size, that must show up as separate rows in the uploaded file. A maintainer tempted to "improve" this by re-deriving `antal` from some other BC column should not do so without being explicitly asked — the whole point of removing the previous balance-based derivation was that it could overstate real availability.
- **A tagged row's "Fra lager" chip is dropped the instant its Bredde or Længde is hand-edited** (the `input` listener added in `makeRow` for `cls === 'roll'` rows) — this is deliberate (the row no longer matches that stock item exactly) but means a maintainer debugging "why did the kode disappear" should check for this before assuming a bug.
- Field labels and all UI/print text are in **Danish** — variable/function names mix Danish domain terms (`dorn`, `moderrulle`, `bånd`, `strimler`, `tillæg`, `kaplængde`, `lager`) with English code structure; a maintainer unfamiliar with Danish should note: *moderrulle* = mother roll, *bånd* = belt, *dorn* = mandrel/bundle-packing mode, *strimmel/strimler* = strip(s), *kaplængde* = cut length, *tillæg* = allowance/addition, *skæretillæg* = cutting allowance (kerf), *siderest* = side leftover (unused width), *længderest* = length leftover, *lager* = stock/warehouse, *lagerliste* = stock list.

#### 7. Version

**v3.3 · 14-09-2026** (footer, line 1566: `Opskæringsberegner · v3.3 · 14-09-2026`).

---

### DXF/ — DXF → NCP Konverter

**File:** `/home/user/Induminati/DXF/index.html` (single self-contained file, ~2030 lines). Danish-language UI. Page `<title>` is "DXF → NCP Konverter" but the on-page `<h1>` reads "DXF / SVG → NCP Vandskærer Konverter" with a small tag `IMF_PBL` — the tool actually accepts both DXF and SVG input despite the shorter title/footer label. Version footer (bottom of file): **v1.2 · 07-07-2026**.

#### 1. Purpose

Converts 2D CAD drawings (DXF or SVG) into `.ncp` G-code-like programs for a waterjet/CNC cutting machine (an "IMF_PBL" controller dialect — commands like `MOVEABS`, `CWABS/CCWABS`, `FASTABS`, `SETPORT`). It parses vector entities out of the uploaded file, normalizes/scales them into micrometers, lets the operator preview the geometry and the resulting cut path, then emits the NCP text file for download. It also has a secondary standalone mode ("03 — Manuelt emne") to generate simple parametric shapes (rectangle, circle, flange/washer) without any source file at all — useful for quick one-off cuts.

#### 2. UI walkthrough

Left panel (`.panel`), top to bottom:

- **01 — DXF / SVG Fil**: a drag-and-drop zone (`#dropZone`) plus hidden `<input type=file accept=".dxf,.svg">`. Drop or click-to-browse triggers `handleFile()`. Shows a green "file loaded" chip (`#fileLoaded`/`#fileName`) once a file is read.
- Hidden machine-config fields (not exposed in the UI, but read by the generator): `#vel` (50000), `#fastvel` (166000), `#pressure` (3800), `#startWait` (1000), `#material` ("POM/Standard/5.000"), `#outputName`. These are fixed constants baked into the page rather than user-editable controls.
- **02 — Indstillinger** (settings):
  - `#arcMode` select — "Native CWABS/CCWABS (anbefalet)" vs. segmenting arcs into 5°/2°/1° line chords.
  - `#dxfUnit` select — mm / m / inch / µm (µm = "already in NCP unit"), drives `getScaleFactor()`.
  - `#cutOrder` select — "DXF-rækkefølge" (as-drawn) vs. "Optimer" (nearest-neighbor travel optimization via `optimizeCutOrder()`).
  - `#leadIn` number input (mm, default 3) — lead-in/lead-out distance; explanatory text notes the cutter starts 3mm outside the contour and plunges in (and 3mm inside a hole's void for internal cuts).
- **03 — Manuelt emne** (manual shape generator): tab group (`switchShapeTab()`) for Firkant (rectangle: width/height/corner radius), Cirkel (outer diameter), Flange (outer Ø + inner Ø/hole). Has its own output filename field (`#shapeOutputName`) and a "⚡ Generer fra mål" button (`generateShapeNCP()`) that builds geometry directly and skips DXF/SVG parsing entirely.
- **Fundet geometri** (entity info, hidden until a file loads): stat tiles for entity count and bbox size in mm, plus colored badges per entity type (`updateEntitySection()`).
- **Log** panel (`#log`) — timestamped/colored status lines (`log(msg, type)`, types `ok`/`warn`/`err`/`info`/`accent`).
- **Actions**: "⚡ Generer NCP-fil" (`#btnConvert`, disabled until parse succeeds, wired to `generateNCP()`), and "↓ Download NCP" (`#btnDownload`, hidden until output exists, calls `downloadNCP()`).

Right panel is the preview area with a tab group (Geometri / NCP kode, `switchTab()`):
- **Geometri tab**: `<canvas id="preview">` rendering the parsed geometry, plus floating zoom +/−/fit buttons (`zoom()`, `fitView()`) and a bottom-left overlay (`#coordOverlay`) showing size/zoom/entity count.
- **NCP kode tab**: `#viewNcp` — syntax-highlighted plain-text NCP output, line count shown in `#previewInfo`.

#### 3. DXF parsing

`parseDXF(text)` is a **hand-rolled line-by-line DXF parser** — no library, no format sniffing beyond finding the `ENTITIES` section by scanning for a bare `ENTITIES` line. It walks the file as pairs of (group code, value) lines, looks for `0`-code entity-type markers, and dispatches per type. Parsing stops at `ENDSEC`/`EOF`.

Supported entity types:
- **LINE** — reads codes 10/20 (start) and 11/21 (end); degenerate (near-zero-length, `dist < 0.5`) lines are dropped.
- **ARC** — codes 10/20 (center), 40 (radius), 50/51 (start/end angle in degrees).
- **CIRCLE** — codes 10/20 (center), 40 (radius).
- **LWPOLYLINE / POLYLINE** — vertex points collected via repeated 10/20 pairs (helper `readEntityProps`), bulge factors from code 42 (per-vertex, keyed by point index), closed flag from bit 0 of code 70.
- **SPLINE** — control points collected from 10/20 pairs (same collection path as polylines, since `readEntityProps` treats spline control points identically); **splines are NOT true NURBS-evaluated** — they are just treated as a polyline through the raw control points, with a warning logged (`⚠ SPLINE fundet (...) — approksimeres som polyline`). This is a shape-fidelity gotcha: a spline rendered this way will generally NOT match the true curve, especially for coarse control-point spacing.

Any entity type not explicitly matched (e.g. ELLIPSE, TEXT, MTEXT, DIMENSION, INSERT/block references, HATCH, SOLID, POINT) is **silently ignored** — the `0`-code dispatch has no `else`/fallback branch, so unrecognized entities produce no log message and no error; they simply vanish from the output. There is no block/INSERT expansion, no layer filtering/exclusion UI (layer is captured per entity but never used to filter), and no handling of DXF `LAYER` or `HEADER` sections (units, etc. — units are taken purely from the user's `#dxfUnit` dropdown, not from the DXF's own `$INSUNITS`).

All coordinates are converted to **integer micrometers** via `toUm(v) = Math.round(v * scaleFactor)`, where `scaleFactor` comes from `getScaleFactor()` (mm→1000, m→1000000, inch→25400, µm→1). After parsing, `normalizeEntities()` shifts all geometry so the bounding-box minimum is at (0,0) — logging the applied offset in mm.

**SVG parsing** (`parseSVG`) is a separate, equally hand-rolled path: walks `line/rect/circle/ellipse/polyline/polygon/path` elements, applies cumulative `transform` matrices (`matrix/translate/scale/rotate`, composed via `multiplyMatrix`), attempts to detect mm-vs-user-unit scale from `viewBox`+`width="...mm"`, and has a full custom SVG path-data tokenizer/interpreter supporting M/L/H/V/C/S/Q/T/A/Z (cubic and quadratic Béziers flattened by recursive subdivision `subdivideCubic`/`subdivideQuadratic`; elliptical arcs converted to points by `svgArcToPoints`). Ellipses are always segmented into ~72 points with a warning logged.

#### 4. Canvas preview

`renderCanvas()` is the core draw routine: clears the canvas, draws a light grid (`#E3EAF0`, step 10mm or 50mm depending on zoom level) and darker axes at X=0/Y=0 (`#AABDCB`), then iterates `parsedEntities` drawing each with `ctx.beginPath()/stroke()` using a per-type color map:
- LINE → `#0B4F79` (dark blue / `--accent2`)
- ARC → `#C9640F` (burnt orange / `--accent-hover`)
- CIRCLE → `#1C7FBF` (link blue / `--link`)
- POLYLINE → `#2E9E52` (green / `--success`)
- SPLINE → `#9A6B00` (amber / `--warn`)

After stroking all entities, it draws a small green filled dot (`#2E9E52`, r=3px) at the computed start point (`entityStart()`) of every entity — a visual marker for where each cut begins.

Zoom/pan: `canvasTransform = {scale, tx, ty}`. Mouse wheel zooms around the cursor position (`wheel` listener, factor 1.12), click-drag pans (`mousedown/mousemove/mouseup`), and the on-screen +/− buttons call `zoom(1.3)`/`zoom(1/1.3)`. `fitView()` recomputes canvas size from its wrapper, computes bbox via `getBBox()`, and centers/scales to fit with 40px padding — called on file load (`renderPreview()`) and on window resize (only if entities exist). Coordinate transform: `toSX(x) = x*scale+tx`, `toSY(y) = y*scale+ty` — note Y is NOT flipped, so DXF/screen Y both increase downward-as-plotted in this canvas (i.e., no inversion for the typical "Y-up" CAD convention — arcs are drawn with `ctx.arc(..., -a2*π/180, -a1*π/180)`, negating angles to compensate).

#### 5. NCP output generation

Two entry points produce NCP text, both duplicating the same header/segment-loop structure:
- `generateNCP()` — driven by parsed DXF/SVG entities, triggered by `#btnConvert`.
- `generateShapeNCP()` — driven by the manual-shape generator (rect/circle/flange), fully independent code path with its own copy of the emission loop.

Pipeline for `generateNCP()`:
1. Optionally reorders entities via `optimizeCutOrder()` (nearest-neighbor greedy travel-salesman heuristic based on `entityStart()`/`entityEnd()`) if cut-order = "optimize".
2. `buildSegments(entities)` converts each entity into a list of low-level move commands (`cmdsFromEntity`) — `MOVEABS`, `CCWABS`, `CWABS` — and then **chains** consecutive entities whose endpoints touch within `TOLERANCE = 100µm (0.1mm)`, reversing entities as needed (`reverseCmd`) so they connect into one continuous segment. Each resulting segment becomes one pierce-cut-off cycle.
   - LINE → two MOVEABS.
   - ARC → MOVEABS to arc start, then either one native `CCWABS` (DXF arcs assumed CCW) or a series of MOVEABS chord segments if arc-mode is a fixed degree step.
   - CIRCLE → MOVEABS to rightmost point, then either two half-circle `CCWABS` moves (since a single CCWABS can't express 360°) or segmented MOVEABS chords.
   - POLYLINE/SPLINE → MOVEABS per vertex, using per-vertex bulge (`bulgeToArc()`) to emit `CCWABS`/`CWABS` instead of a straight MOVEABS when a bulge is present and arc-mode is "native". SPLINE entities have no bulge data (bulges only come from LWPOLYLINE), so splines always become straight MOVEABS polylines regardless of arc-mode.
3. For each segment, `computeLeadIn()` computes a point offset backwards (opposite the initial cut direction) by the configured lead-in distance, outside the contour's start.
4. Emits per-segment NCP block: `FASTABS` to lead-in point → `WAIT 10` → `SETPORT A4=00000001` (pierce/water on) → `WAIT 10` → `WAIT {startWait}` (dwell) → the chained `MOVEABS`/`CWABS`/`CCWABS` moves → `WAIT 10` → `SETPORT A4=00000000` (off) → `WAIT 10` → `WAIT 200`.
5. File header: `IMF_PBL_v1.0`, then comment lines `;FILE:`, `;MATR:`, `;DRAWING:`, `;DATE:` (`todayDanish()` → dd-mm-yyyy), `;PRESSURE:`, then `FASTVEL`, `VEL`, `;Valgte dyser : TOOL:1`. Ends with `PROGEND`.

Output is joined with `\r\n` (CRLF) and downloaded via `downloadNCP()`, which manually re-encodes the string to raw bytes (masking each char code with `& 0xff`) to force **ISO-8859-1/Latin-1** output rather than UTF-8 — presumably for controller compatibility.

**Syntax highlighting**: `renderNcpPreview()` splits output by line and wraps each in a `<span>` class based on a simple `startsWith()` prefix check — `cmd-comment` (`;`), `cmd-header` (`IMF_`/`FASTVEL`/`VEL `/`PROGEND`), `cmd-fast` (`FASTABS`), `cmd-move` (`MOVEABS`), `cmd-arc` (`CWABS`/`CCWABS`), `cmd-control` (`SETPORT`/`WAIT`) — each mapped to a CSS color variable in the stylesheet (e.g. `.cmd-move{color:var(--accent2)}`). Text is escaped via `esc()` (only `&` and `<`) before insertion as `innerHTML`.

#### 6. Known quirks / gotchas

- **Unsupported DXF entities are silently dropped** with no warning — ELLIPSE, TEXT/MTEXT, DIMENSION, HATCH, SOLID, POINT, INSERT (block references), 3D entities, etc. all vanish without a log line, since the `0`-code dispatch in `parseDXF` has no fallback/else branch (contrast with the SVG parser's ellipse warning, and SPLINE's explicit warning).
- **SPLINE is not truly evaluated** — it's approximated as a straight-line polyline through the raw control points (not even a proper NURBS sampling), which can differ significantly from the actual curve for sparse control points. A warning is logged but the shape may still be visibly wrong.
- **No DXF units/HEADER awareness** — the `$INSUNITS` DXF header variable is never read; the user must correctly pick the unit from `#dxfUnit`, and picking wrong silently produces a mis-scaled part.
- **No block/INSERT expansion** — entities inside DXF block definitions referenced via INSERT are not resolved/flattened, so block-based drawings will parse as mostly empty.
- **LWPOLYLINE bulge handling only applies in "native" arc mode** — if the user picks a segmented arc mode (5°/2°/1°), bulges are ignored and arcs in polylines become straight chords between vertices (no re-segmentation of the bulge arc itself), unlike ARC/CIRCLE entities which do get properly segmented in that mode.
- **Entity chaining tolerance is fixed at 100µm (0.1mm)** (`TOLERANCE` constant in `buildSegments`) and not user-configurable — drawings with small gaps between segments beyond that will be split into separate pierce cycles instead of one continuous cut.
- **Y axis is not flipped** for canvas draw vs. DXF's usual Y-up convention; arc angles are drawn with negated angles (`-a2`, `-a1`) to compensate visually, which is a fragile compensating hack rather than a coordinate-system transform — worth checking carefully if canvas-vs-NCP-output visual mismatch bugs ever arise.
- **All coordinates rounded to whole micrometers** (`Math.round`) at multiple stages (parse-time `toUm`, arc start/end points, bulge arc centers, lead-in points) — cumulative rounding could introduce sub-micron drift in chained/optimized paths, though this is unlikely to matter practically for waterjet tolerances.
- **`bulgeToArc()` contains dead code** — it computes `cx`/`cy` via a trig formula (lines ~1654-1655) that is immediately discarded in favor of a second "simplified: midpoint method" calculation a few lines later. Only the midpoint-method result is returned; the first calculation is inert leftover code.
- **`readEntityProps`'s `_ctrlpts` is effectively unused/dead**: it initializes `ctrlpts = []` but never pushes to it, so `props._ctrlpts` always falls back to `polypts`. SPLINE entities thus get identical point capture behavior to LWPOLYLINE (raw 10/20 pairs), reinforcing that splines are never true curve-fit.
- **Machine parameters are hardcoded, not exposed in the UI** — velocity, fast-travel velocity, pressure, start-wait dwell, and material string are all fixed hidden `<input>` values (50000, 166000, 3800, 1000, "POM/Standard/5.000"); changing them requires editing the HTML source, not the running page.
- **Output filename field** (`#outputName`) is also a hidden input, populated automatically from the uploaded file's basename in `handleFile()` — there's no visible UI to rename the output for DXF/SVG conversions (only the manual-shape generator has a visible filename field, `#shapeOutputName`).
- Title/header/footer inconsistency: `<title>` and the version footer both say "DXF → NCP Konverter" (omitting SVG), while the visible `<h1>` and actual functionality cover both DXF and SVG — a documentation nit, not a functional bug.

---

### Kapacitet/ — Kapacitetsoverblik (Test/WIP)

**File:** `/home/user/Induminati/Kapacitet/index.html` (single self-contained HTML file, no build step; linked from `Test/index.html`, not yet promoted to the front page). Uses one external dependency loaded from CDN: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` (SheetJS, for reading `.xlsx`/`.xls` uploads).

#### 1. Purpose

Kapacitetsoverblik visualizes projected order volume against actual production capacity, per department and per week, so planners can see whether upcoming weeks are on track, tight, or overloaded before the work actually lands on the floor. It works by combining two manually-maintained config tables — a list of departments with their weekly capacity (headcount × hours/week), and a mapping from BC "Varekategori" (item category) values to a department + a standard-hours estimate — with an uploaded "Frigivne produktionsordrer" export (the same export format the Ordreliste tool consumes). It buckets each order into a future week (by `Bekræftet leveringsdato`) and a department (via the category mapping), sums estimated hours per department per week, and compares that against each department's weekly capacity, rendering the result as a bar chart + table with three-color status (good/warn/crit).

#### 2. UI walkthrough

**Header (14-09-2026):** now the same full-width dark-blue bar + decorative logo icon + `<h1>` + "← Forside" `.btn-home` link used by every other tool page — previously this page had no header bar at all, just a bare `<h1>Kapacitetsoverblik</h1>` + `.step-tag` span sitting inside `.wrap` with a plain `border-bottom`. Fixing that required moving `<header>` to be a direct child of `<body>` (before `.wrap`, so it can be full-bleed) and moving `body`'s old `padding:32px 24px 64px` onto `.wrap` instead (the header has its own `padding:18px 28px`). A new `--dark:#0B4F79` token was added to the **light** `:root` block only — deliberately **not** to the `@media (prefers-color-scheme: dark)` override below it, so the header bar stays the same fixed blue regardless of OS theme, exactly like every other page's header (which has no dark-mode awareness at all). The existing dark-mode block itself is otherwise untouched.

The page is organized as 5 numbered panels:

**Panel 1 — "Afdelinger & kapacitet"**
- `#deptTable` / `#deptTbody`: editable rows, one per department. Columns: Afdeling (text input, name), Ansatte (number input, employee count), Timer/ansat/uge (number input, hours/employee/week, default `37`), Kapacitet/uge (read-only computed cell, `#cap-<id>`), and a "Fjern" (remove) danger button per row.
- `#addDeptBtn` ("+ Tilføj afdeling"): appends a new blank department row (`{id, name:'', employees:0, hoursPerEmployee:37}`).
- Collapsible **GitHub-sync** sub-section (`#ghHeader`/`#githubBody`, toggled open/closed by clicking the header): a password-type input `#gh_token` for a GitHub Personal Access Token (persisted to localStorage on every keystroke via `saveGhSettings()`), and two buttons `#btnPush` ("⬆ Push opsætning") and `#btnPull` ("⬇ Pull opsætning"). A `#syncLog` line shows the result of the last sync action.

**Panel 2 — "Varekategori → afdeling & standardtid"**
- `#qtyColumnRow` (hidden until relevant): a `#qtyColumnSelect` dropdown to choose which uploaded column holds the piece/quantity count, used only when a category's calculation mode is "pr. styk" (per-unit).
- `#mappingTable`/`#mappingTbody`: one row per item category. Columns: Varekategori (auto-discovered categories render as read-only mono text; manually-added ones render as an editable text input), Afdeling (`<select>` populated from the department list, empty option `— vælg —`), Beregning (`<select>` with `pr. ordre` = `per_order` fixed-hours-per-order vs `pr. styk` = `per_unit` hours × quantity column), Timer (number input, the hours value used in the calc), and a "Fjern" button.
- Rows whose `departmentId` is unset get CSS class `unmapped` (`tr.unmapped td{background:#fdf3e0}`, dark-mode override `#3a2f14`) — a light amber highlight distinct from the good/warn/crit palette, just flagging "needs attention" in the config table.
- `#addCategoryBtn` ("+ Tilføj kategori manuelt"): appends a blank mapping row (`{id, category:'', departmentId:'', mode:'per_order', hours:0, auto:false}`).

**Panel 3 — "Upload ordreliste"**
- `#dropOrders`: click-or-drag file dropzone for `.xlsx`/`.xls`, backed by hidden `#fileInputOrders`. Shows the chosen filename in `#filenameOrders`.
- `#uploadStatus`: status banner (ok/err/info) reporting sheet name, row count, missing required columns, and how many new categories were auto-added to Panel 2's mapping table.

**Panel 4 — "Beregn"**
- `#weeksInput`: number input, "Antal uger frem" (weeks ahead to compute), default `8`, clamped `1–26`.
- `#computeBtn` ("Beregn kapacitet"): disabled until a file is successfully uploaded (and re-disabled if the upload is missing required columns); triggers `runCompute()`.
- `#computeStatus`: status banner summarizing rows/weeks/departments processed.

**Panel 5 — "Resultat"** (hidden — `display:none` — until first successful compute)
- A legend (`.legend`) explaining the four status-dot colors (see thresholds below).
- `#chartsContainer`: one `.dept-chart-card` per department, each with a title, a subtitle line (`N ansatte × Ht = capacityT/uge kapacitet · N ordre(r) i alt`), an optional italic note when capacity is 0/unset, and an inline SVG bar chart (`buildDeptChart()`).
- A "Tabel" heading + `#tableContainer`: a plain HTML table, one row per department, one column per week, each cell showing hours booked, a % of capacity (when capacity is set), a colored status dot, and a text status label underneath.
- A "Advarsler & ikke-tildelte kategorier" heading + `#warningsContainer`: lists unmapped categories (with order counts, sorted descending) and aggregate skip counts (status-excluded orders, orders without a valid date, orders outside the computed week window, per-unit orders missing a valid quantity).
- A fixed-position `#tooltip` div, shown/hidden on pointer/focus events over chart bars.

#### 3. Capacity calculation logic

**Data model** (persisted as `config` object, see section 6):
```js
config = {
  departments: [{ id, name, employees, hoursPerEmployee }],
  mapping:     [{ id, category, departmentId, mode: 'per_order'|'per_unit', hours, auto }],
  quantityColumn: ''  // header name of the uploaded column used for 'per_unit' mode
}
```
- **Capacity per department per week** = `capacityOf(dept)` = `employees × hoursPerEmployee`, rounded to 1 decimal.
- **Week windows**: `runCompute()` builds `weeksCount` (from `#weeksInput`, clamped 1–26) consecutive Mon–Sun ranges starting from the current week (`getWeekRange(i)` → `getMonday(new Date())` + `i*7` days), each labeled `dd/mm–dd/mm` via `formatShortDate`.
- **Row processing** (`runCompute()`, iterating `uploadedRows`):
  1. Skip if `Status` is in `STATUS_EXCLUDE = ['6. SFE', '3. FÆRDIG']` (counted as `skippedStatus`).
  2. Look up `Varekategori` in the mapping (only mappings with a `departmentId` set are indexed, via `mappingByCategory`); if none found, tally into `unmapped` map (category → count), not counted as hours anywhere.
  3. Parse `Bekræftet leveringsdato` via `parseDateValue()` (handles Excel serial numbers via `excelSerialToDate()`, `Date` objects, and `dd-mm-yyyy` strings); if unparseable, counted as `skippedNoDate`.
  4. Find which of the computed week ranges the date falls into; if none (order due outside the N-week window), counted as `skippedOutsideWindow`.
  5. Compute `hours`: for `mode === 'per_order'`, it's just the mapping's fixed `hours` value; for `mode === 'per_unit'`, it's `hours × qty` where `qty` comes from `row[config.quantityColumn]` — if no quantity column is configured or the value isn't numeric, counted as `skippedQty` and hours contributed as 0 (the order is NOT dropped, it's still counted toward `orders[weekIdx]` but contributes 0 hours).
  6. Adds `hours` to `results[dept].hours[weekIdx]` and increments `results[dept].orders[weekIdx]`.
- **Category auto-discovery**: on file upload, `handleOrdersFile()` scans all distinct non-empty `Varekategori` values and auto-adds any not already in `config.mapping` as a new row with `auto:true`, `departmentId:''`, `mode:'per_order'`, `hours:0` — these show up as unmapped (amber row) until a human assigns a department and hours.
- **Required upload columns**: `Varekategori`, `Status`, `Bekræftet leveringsdato` (checked against `Object.keys(rows[0])`); missing columns produce an error status and disable the compute button.
- **Quantity column candidates**: `QTY_CANDIDATES = ['Restantal', 'Bestilt antal', 'Antal', 'Mængde', 'Restmængde', 'Levering antal', 'Ordreantal']` — `populateQtyColumnSelect()` auto-picks the first one present in the uploaded headers if the user hasn't already chosen one.
- **Visualization**: both a chart and a table, built by `renderResults()`:
  - Chart: `buildDeptChart()` builds a hand-rolled inline SVG bar chart per department (no charting library) — one bar per week, height scaled to `maxVal = max(capacity, maxHours, 1) * 1.15`, a dashed horizontal reference line at the capacity level (labeled `<capacity>t`), rounded-top bar rectangles (`roundedTopRectPath()`) colored via `statusColor()`, invisible larger `.bar-hit` rects layered per bar for tooltip hit-testing (`attachChartTooltips()` wires pointerenter/pointermove/pointerleave/focus/blur to a shared `#tooltip` element positioned via `positionTooltip()`).
  - Table: plain HTML `<table>`, department rows × week columns, each cell = hours + optional `(pct%)` + colored status dot + status label.

#### 4. Good/warn/crit status thresholds

Defined once via two small pure functions, used consistently by both the chart and the table:
```js
function statusColor(pct, capacity) {
  if (capacity <= 0) return 'var(--baseline)';
  if (pct > 100) return 'var(--crit)';
  if (pct >= 85) return 'var(--warn)';
  return 'var(--good)';
}
function statusLabel(pct, capacity) {
  if (capacity <= 0) return 'Ikke sat';
  if (pct > 100) return 'Overbelastet';
  if (pct >= 85) return 'Tæt på grænsen';
  return 'OK';
}
```
- **`--good`** (`#0A7832` light / `#0ca30c` dark): booked hours `< 85%` of weekly capacity → "God margin" / "OK".
- **`--warn`** (`#CA8A04` light / `#fab219` dark): `85%–100%` inclusive-of-85 → "Tæt på grænsen".
- **`--crit`** (`#D03B3B` light / `#e66767` dark): `> 100%` → "Overbelastet".
- **`--baseline`** (`#B7C7D2` light / `#383835` dark): used when `capacity <= 0` (department has no employees/hours configured yet) → "Kapacitet ikke sat" — a neutral/grey 4th state, not really a severity level but shown alongside the other three in the legend and used for both the chart's capacity reference line/axis and as the color fallback.
- **Where they appear**: the legend at the top of Panel 5 (colored `.legend-dot` squares + Danish descriptions with the exact percentage cutoffs spelled out), each chart bar's fill color (`buildDeptChart` via `statusColor`), the tooltip's status line (`Status: <label>`), and each table cell's `.status-dot` + label text underneath the hours/percentage.
- **Distinctness from brand palette confirmed**: these four tokens are defined separately from the site's blue/orange brand tokens (`--ink`, `--paper`, `--surface`, `--secondary`, `--accent`/`--accent-soft`) in the same `:root` block, and are semantically green/amber/red/grey — they are **not** derived from or aliased to `--accent` (orange) anywhere in the file. This matches the stated intent that data-meaningful status colors were deliberately kept out of the site-wide blue/orange recolor. Note: the *unmapped-category row* highlight (`tr.unmapped td` amber background, `#fdf3e0`/`#3a2f14`) and the `.status.info`/`.gh-note` amber tones are separate ad-hoc amber shades, not using the `--warn` token — worth knowing if a future recolor wants full consistency, but they're config-table UI hints, not part of the good/warn/crit data-status system.

#### 5. Dark mode support

The file has its own `@media (prefers-color-scheme: dark)` block (lines ~25–40) that redefines the entire `:root` custom-property palette for OS-level dark mode: `--ink` (white), `--paper`/`--surface` (near-black), `--line`/`--baseline` (dark greys), `--secondary`/`--muted` (light greys), `--accent` (a brighter blue `#3987e5` instead of orange — notably the dark-mode accent here is blue, not the site's orange), `--accent-soft` (dark navy), and the three status colors `--good`/`--warn`/`--crit` get brighter/more saturated dark-mode-friendly variants. There are two smaller companion dark-mode overrides further down: `tr.unmapped td` background (`#3a2f14`) and `.status.info` background/color. This is purely a `prefers-color-scheme` media query — there is no manual light/dark toggle control or `[data-theme]` attribute handling, and no JS reads or sets a theme preference; it only responds to the OS/browser setting. Per the task brief, this is distinct from the rest of the site (most other pages have no dark-mode block at all) and was deliberately left in place during the recent site-wide light-theme recolor — only the default/light `:root` values were unified to the shared blue/orange palette, not this page's dark override. The 14-09-2026 header fix (§2) added `--dark:#0B4F79` for the new header bar to the light block only, again deliberately not to this dark-mode block — the header bar is exempt from the OS dark-mode theming and stays the fixed site blue, same as every other page's header.

#### 6. GitHub sync / persistence

Not stateless — it has two independent layers of persistence, both scoped to `config` (departments + mapping + quantityColumn only; **uploaded order rows are never persisted**, they live only in the in-memory `uploadedRows`/`uploadedHeaders` variables and are lost on page reload):

- **localStorage** (`CONFIG_KEY = 'kapacitet_config_v1'`): `loadConfig()`/`saveConfig()` read/write the whole `config` object as JSON on every edit (department/category field changes, add/remove rows). This is the tool's default/automatic persistence — no explicit save button needed for local use.
- **GitHub sync** (optional, manual, config-only — same purpose as similar sync patterns likely used elsewhere in the repo): hardcoded target `GH_USER='westfrost'`, `GH_REPO='Induminati'`, `GH_PATH='Kapacitet/config.json'`.
  - **Pull** (`#btnPull`): fetches `https://raw.githubusercontent.com/westfrost/Induminati/main/Kapacitet/config.json` (no auth required — public repo), confirms via a native `confirm()` dialog before overwriting local config, then `applyLoadedConfig()` merges it in, re-derives `nextDeptId`/`nextMapId` from max existing IDs, saves to localStorage, and re-renders both tables.
  - **Push** (`#btnPush`): requires a GitHub Personal Access Token (stored in localStorage under `GH_SETTINGS_KEY = 'kapacitet_gh_settings'`, entered via the password-type `#gh_token` field with `Contents: Read & Write` permission). Fetches the current file SHA via `getFileSha()` (GET to the GitHub Contents API), then `PUT`s the new base64-encoded JSON via the Contents API with a commit message `Opdateret kapacitetsopsætning (<timestamp>)`, including the SHA if the file already existed (create-or-update in one code path).
  - The token is stored in plaintext in localStorage (`saveGhSettings()` fires on every `oninput`) — same trust model as manual GitHub sync elsewhere in this codebase; no server-side proxy, direct browser → GitHub API calls.
- **No sync of uploaded orders**: only the department/mapping *configuration* is shared via GitHub, never the actual order data — each user must upload their own BC export locally each session.

#### 7. Known quirks / gotchas, and WIP status

- **No TODO/FIXME comments** in the file — the "unfinished" framing comes from its Test/ placement and the explicit disclaimer in Panel 2's rules text: *"Der findes intet systematisk grundlag for dette i BC endnu — udfyld ud fra jeres erfaring og forfin over tid"* ("There's no systematic basis for this in BC yet — fill it in from experience and refine over time"). In other words, the hours-per-category estimates are acknowledged guesswork, not derived from any real BC data source — that's the core reason it's still WIP/not promoted to the front page.
- **Orders lost on reload**: the uploaded order list is never persisted anywhere (not localStorage, not GitHub) — only the config (departments + category mapping) survives a refresh. Every session requires re-uploading the Ordreliste export before compute is possible.
- **`per_unit` silently zeroes missing quantities**: if a category is set to "pr. styk" but the row's quantity value is non-numeric or `config.quantityColumn` isn't set, the order still counts toward `orders[weekIdx]` (order count) but contributes `0` hours — it does not get excluded/warned individually, only tallied in the aggregate `skippedQty` warning count. This could understate load without being obvious per-row.
- **Date parsing is narrow**: `parseDateValue()` only understands Excel serial numbers, native `Date` objects, and strings matching exactly `dd-mm-yyyy`; any other string date format silently becomes `skippedNoDate`.
- **Week window is always "now"-anchored**: `getWeekRange()` always starts from `getMonday(new Date())` — there's no way to pick an arbitrary start date or look at past weeks; the tool is always forward-looking from today.
- **`unmapped` categories are silently dropped from all totals** (not just flagged) — an order in a category with no assigned department contributes zero hours anywhere and only shows up in the warnings list, which could make a department's true load look lower than reality if new categories appear in an upload and aren't triaged.
- **GitHub token stored in plaintext localStorage**, sent as a Bearer token directly from the browser to the GitHub REST API — no backend proxy. Anyone with browser/devtools access to the machine could read it.
- **Hardcoded repo path** `Kapacitet/config.json` and hardcoded `westfrost/Induminati` — if the repo is ever renamed/forked, this breaks silently (pull would 404, well-handled via `res.ok` check → error message, but not automatically discovered).
- **To be "done" / promoted to front page**, based on the code's own caveats, it would likely need: (a) a real, validated data source or sign-off process for the per-category standard-hours table instead of ad-hoc guesses, (b) probably some persistence or caching of the uploaded order data so users don't have to re-upload every session, and (c) general review/testing since it currently lives under `Test/` alongside other unfinished tools. There is no in-code indication of what specifically blocks promotion beyond the "no systematic basis yet" disclaimer.

#### 8. Current version

Footer (bottom of `<body>`): **`Byg til intern brug · v1.2 · 14-09-2026`** — note it uses the generic "Byg til intern brug" label rather than the tool's own name, consistent with the CLAUDE.md note that some pages use a generic footer phrase rather than restating the tool name.

---

## Hvordan denne fil holdes opdateret

Denne CLAUDE.md er skrevet til at være **udførlig nok til at en fremtidig Claude-session uden forudgående kontekst kan vedligeholde ethvert værktøj i repo'et** ud fra den alene. Når du laver en væsentlig ændring på en side (ny funktion, omskrevet algoritme, ny arkitektur som fx sync-mekanikken), opdatér det pågældende afsnit her i samme ændring — ikke kun `README.md` (som holdes kort og bruger-vendt) men også denne fil (som er teknisk og udførlig). Hold især "Kendte historiske bugs rettet her"-afsnittene ajour, så samme fejl ikke bliver genindført af en session der ikke kender historikken.

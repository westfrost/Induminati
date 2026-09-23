# Induminati — noter til Claude

Statisk site, ingen build-step. Hvert værktøj er én selvstændig `index.html` (indlejret CSS/JS). Se `README.md` for en kort, bruger-vendt oversigt over struktur og deployment.

**Denne fil er delt op pr. værktøj.** Denne rodfil (`CLAUDE.md`) dækker kun det, der er fælles for hele repo'et — arkitektur, konventioner, farveskema, header-mønster, versionsfooter-konvention, git-workflow, og et overordnet resumé af database-side-mønstret. Den udførlige tekniske reference for hvert enkelt værktøj (algoritmer, datamodeller, kendte bugs og hvorfor de blev rettet) ligger i stedet i en `CLAUDE.md` inde i det pågældende værktøjs egen mappe — Claude Code indlæser den automatisk oveni denne fil, når en session arbejder i den mappe, og filen er også selvstændig nok til at kunne fødes ind i en helt ny session for netop det værktøj. Se "Hvordan denne fil holdes opdateret" nederst for hvorfor og hvordan opdelingen vedligeholdes.

**De enkelte værktøjers filer:**
- `Test/CLAUDE.md` — Test-oversigten (hub-side for WIP-værktøjer)
- `Styreliste/CLAUDE.md` — Styreliste Beregner
- `Samlevejledninger/CLAUDE.md` — Samlevejledninger (database-side)
- `Baanddb/CLAUDE.md` — Bånd & Medbringer DB (database-side, Samlevejledningers "søster")
- `Ordrer/CLAUDE.md` — Ordreliste-værktøj
- `Opskæring/CLAUDE.md` — Opskæringsberegner
- `DXF/CLAUDE.md` — DXF → NCP Konverter
- `Kapacitet/CLAUDE.md` — Kapacitetsoverblik (Test/WIP)

`index.html` (forsiden) er så lille og rent statisk, at dens noter blot står nedenfor i denne fil i stedet for i en separat `index.html/`-mappe (det er trods alt en fil, ikke en mappe med et værktøj i).

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
/<Værktøj>/CLAUDE.md     → Teknisk reference for netop dette værktøj — se ovenfor
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

**Database-sider (Baanddb, Samlevejledninger).** Disse to værktøjer er de eneste med en "database": et array af poster gemt i browserens `localStorage`, med valgfri synkronisering til/fra GitHub. Begge sider deler nøjagtig samme arkitektur og samme klasse af tidligere bugs — se de to værktøjers egne `CLAUDE.md`-filer (`Baanddb/CLAUDE.md`, `Samlevejledninger/CLAUDE.md`) for fuld detalje, men kort opsummeret:
- **Push** kræver et GitHub-token, men i stedet for at hver bruger opretter sit eget, er ét rigtigt token krypteret (AES-GCM, nøgle udledt af en fælles adgangskode via PBKDF2, 300.000 iterationer) og gemt i selve repo'et som `<Mappe>/gh-auth.json`. Alle der kender adgangskoden kan låse tokenet op i browseren og pushe (`resolveToken()`/`decryptToken()`). Da repo'et er offentligt, kan den krypterede fil ses af alle — sikkerheden afhænger derfor alene af adgangskodens styrke. Førstegangsopsætning (`setupSharedToken()`) kræver ét rigtigt GitHub PAT engangs.
- **Pull** virker altid uden adgangskode (henter direkte fra `raw.githubusercontent.com`, offentligt repo), falder tilbage til Contents API + delt token hvis det fejler.
- **`localDirty`-flag** (persisteret i `localStorage`, IKKE kun i hukommelsen — det var selv en bugfix) forhindrer at et baggrunds-pull overskriver ændringer brugeren har lavet lokalt, men endnu ikke pushet. Sættes ved enhver lokal gem/slet/importér, ryddes kun efter et vellykket push eller et bevidst manuelt pull.
- **`deletedIds`-tombstones** (også persisteret) forhindrer at en slettet post kan "genopstå" hvis et pull henter en forældet/cachet remote-kopi der stadig har den. Et pull filtrerer altid tombstonede id'er fra og rydder selv tombstones for id'er remote'en ikke længere har.
- **Samlevejledninger** pull'er derudover automatisk og stille i baggrunden når siden åbnes (`autoPullOnOpen()`), så alle altid ser den nyeste data uden manuelt at skulle trykke "Pull". Baanddb har tilsvarende `autoLoadFromGithub()`.

Disse to mekanismer (`localDirty` og tombstones) blev tilføjet for at rette to reelle, brugerrapporterede bugs — se `Baanddb/CLAUDE.md` og `Samlevejledninger/CLAUDE.md` for præcis hvordan og hvorfor. Rør ikke ved dem uden at forstå begge bugs først.

---

## index.html — Forside

**Fil:** `/home/user/Induminati/index.html` (~141 linjer). **Version:** v1.4 · 18-08-2026.

**Formål:** Landingsside/launcher for alle live værktøjer. Rent statisk — ingen JS overhovedet, kun HTML+CSS.

**Opbygning:** Header med logo (link til `Test/index.html`) + "Interne værktøjer"-undertekst. `main` indeholder en `.app-grid` (responsivt grid, 3→2→1 kolonner) af `.app-card`-links, ét pr. live værktøj, hver med et lille SVG-ikon (stroke `#0B4F79`, baggrund `#E5F1FA`), titel, kort beskrivelse og en "Åbn →"-pil. Rækkefølgen af kortene afspejler ikke nødvendigvis nogen bestemt prioritet — når et værktøj flyttes hertil fra `Test/`, indsættes det blot et sted i grid'et. Footer med version.

**Vedligehold:** Når et værktøj flyttes fra `Test/index.html` hertil (eller omvendt), skal både denne sides `.app-grid` og `README.md`s værktøjstabeller opdateres i samme ændring, og siden versionsbumpes.

---

## Hvordan denne fil holdes opdateret

CLAUDE.md-dokumentationen for Induminati er delt i to niveauer: **denne rodfil** dækker kun det, der er fælles for hele repo'et (arkitektur, farveskema, header-mønster, versionsfooter-konvention, git-workflow, database-side-resuméet), og **hvert værktøjs egen `<Værktøj>/CLAUDE.md`** dækker den udførlige tekniske detalje for netop det værktøj (algoritmer, datamodeller, kendte bugs og hvorfor de blev rettet). Formålet med opdelingen er, at en session der kun arbejder på ét værktøj (fx via en dedikeret Claude Code-session pr. værktøj) automatisk får præcis den kontekst, den har brug for, uden at skulle indlæse alle de andre værktøjers historik.

**Når du ændrer noget:**
- **Ændring i ét bestemt værktøj** (ny funktion, omskrevet algoritme, ny arkitektur, rettet bug) → opdatér **det værktøjs egen `CLAUDE.md`** i samme ændring. Hold især "Kendte historiske bugs"/"Known quirks"-afsnittene ajour, så samme fejl ikke bliver genindført af en session der ikke kender historikken.
- **Ændring i noget fælles** (farveskema, header-mønstret, versionsfooter-konventionen, git-workflowet, eller selve database-side-mekanikken der er fælles for Baanddb/Samlevejledninger) → opdatér **denne rodfil**.
- **Nyt værktøj oprettes** → opret en tilsvarende `<Værktøj>/CLAUDE.md` for det (samme stil: filsti/version øverst, et blockquote-link tilbage til `../CLAUDE.md` for de fælles konventioner, derefter Formål/UI/detaljer/kendte quirks), og tilføj det til listen øverst i denne fil.
- **Værktøj flyttes eller fjernes** → flyt/fjern dets `CLAUDE.md` tilsvarende, og opdatér listen øverst i denne fil samt `README.md`.

Ikke kun `README.md` (som holdes kort og bruger-vendt) men også CLAUDE.md-strukturen skal altså afspejle den faktiske repo-struktur til enhver tid.

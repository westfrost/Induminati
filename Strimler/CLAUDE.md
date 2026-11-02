# Strimler/index.html — Strimmelberegner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Strimler/index.html`. **Version:** v1.3 · 02-11-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Beregn hvor mange strimler råbånd der skal bruges til en ordre. Råbåndet (Volta Spike) kommer i ruller à 100 mm × 60 m; strimlerne svejses sidevejs sammen til færdige bånd. Ingen eksterne scripts.

**Regler (fra brugeren 28-10-2026):**
- **Bredde (v1.3):** `n = floor(W / strimmelbredde) + 1`, **+1 ekstra hvis resten `W − floor(W/sw)·sw` er ≥ grænsen (default 50 mm, feltet "Ekstra strimmel ved rest ≥")**. Brugerens regler: 400 → 5 (28-10-2026); 370 → 5 og 570 → 7, fordi 4/6 er for lidt, grænse 50 mm (02-11-2026). Dvs. 340 → 4, 349 → 4, 350 → 5, 420 → 5, 500 → 6, 100 → 2. **Ingen svejsetab-beregning** — v1.0 havde et konfigurerbart "svejsetab pr. samling" og viste "bredde efter svejsning"; fjernet i v1.1 efter brugerønske. Genindfør det ikke.
- **Længde:** strimmel = færdig længde + **50 mm** (til at skære rent). Svejsebommen kan maks. **1700 mm**; er båndet længere, deles det i `k = ceil(L / 1700)` lige store sektioner, strimmel = `L/k + 50` (fx 1800 → 2 × 950). Grænsen gælder den færdige længde (1700 → én strimmel à 1750). Strimmellængden rundes op til hele mm.
- Pr. bånd: `n × k` strimler; pr. linje × antal bånd.

**Ruller:** kun **antal ruller** vises (i "Samlet for ordren"), beregnet ved at fordele alle strimler first-fit-decreasing på ruller à 60 m (skæretab ikke medregnet). v1.0–v1.1 viste også en skæreplan pr. rulle (bjælke, brugt/rest, hvilke strimler) — **fjernet i v1.2 efter brugerønske**; genindfør den ikke.

**Skæreseddel (v1.3):** knappen "Print skæreseddel" kalder `window.print()`; `@media print` skjuler header/main og viser kun `#print` (sort/hvid, Arial): overskrift "SKÆRESEDDEL — Volta Spike 100 mm" + dato, valgfrit "Ordre:" (feltet "Ordrenr. / kunde", gemmes i `state.order`), tabel pr. linje (Bånd, Antal, Strimler pr. bånd `n [× k] × længde`, **Skær "N stk à L mm"**, afkrydsningsboks ☐) og "I alt: strimler · meter · ruller". `#print` er skjult på skærm.

**UI:** flere linjer (bredde × længde × antal), resultat pr. linje + samlet (strimler, meter, ruller). Forudsætninger (strimmelbredde, rullelængde, svejsebom-maks., længdetillæg, rest-grænse) kan rettes. Linjer, ordrefelt og forudsætninger gemmes i `localStorage` `strimler.v1`.

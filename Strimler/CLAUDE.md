# Strimler/index.html — Strimmelberegner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Strimler/index.html`. **Version:** v1.1 · 28-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Beregn hvor mange strimler råbånd der skal bruges til en ordre. Råbåndet (Volta Spike) kommer i ruller à 100 mm × 60 m; strimlerne svejses sidevejs sammen til færdige bånd. Ingen eksterne scripts.

**Regler (fra brugeren 28-10-2026):**
- **Bredde:** altid **én strimmel mere end der går op i bredden**: `n = floor(W / strimmelbredde) + 1` → 400 mm = **5** strimler (brugerens eksempel), 350 = 4, 500 = 6, 100 = 2. **Ingen svejsetab-beregning** — v1.0 havde et konfigurerbart "svejsetab pr. samling" (default 5 mm) og viste "bredde efter svejsning / mm at skære af"; det blev fjernet helt i v1.1 efter brugerønske ("kun at der går fem strimler på et 400 bånd"). Genindfør det ikke.
- **Længde:** strimmel = færdig længde + **50 mm** (til at skære rent). Svejsebommen kan maks. **1700 mm**; er båndet længere, deles det i `k = ceil(L / 1700)` lige store sektioner, strimmel = `L/k + 50` (fx 1800 → 2 × 950). Grænsen gælder den færdige længde (1700 → én strimmel à 1750). Strimmellængden rundes op til hele mm.
- Pr. bånd: `n × k` strimler; pr. linje × antal bånd.

**Ruller:** alle strimler fordeles first-fit-decreasing på ruller à 60 m (skæretab mellem strimler ikke medregnet); vist som skæreplan pr. rulle med rest.

**UI:** flere linjer (bredde × længde × antal), resultat pr. linje + samlet (strimler, meter, ruller). Forudsætninger (strimmelbredde, rullelængde, svejsebom-maks., længdetillæg) kan rettes. Linjer og forudsætninger gemmes i `localStorage` `strimler.v1`.

# Strimler/index.html — Strimmelberegner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Strimler/index.html`. **Version:** v1.0 · 28-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Beregn hvor mange strimler råbånd der skal bruges til en ordre. Råbåndet (Volta Spike) kommer i ruller à 100 mm × 60 m; strimlerne svejses sidevejs sammen til færdige bånd. Ingen eksterne scripts.

**Regler (fra brugeren 28-10-2026):**
- **Bredde:** der forsvinder materiale ved hver sidesvejsning, så fx 400 mm kræver **5** strimler (4 er for lidt). Implementeret som: mindste `n` hvor `n·strimmelbredde − (n−1)·svejsetab ≥ færdig bredde`. **Svejsetab pr. samling er ikke oplyst af brugeren — default 5 mm** (giver 5 strimler til 386–480 mm, 4 til 291–385 mm). Kan rettes under "Forudsætninger".
- **Længde:** strimmel = færdig længde + **50 mm** (til at skære rent). Svejsebommen kan maks. **1700 mm**; er båndet længere, deles det i `k = ceil(L / 1700)` lige store sektioner, strimmel = `L/k + 50` (fx 1800 → 2 × 950). Grænsen gælder den færdige længde (1700 → én strimmel à 1750). Strimmellængden rundes op til hele mm.
- Pr. bånd: `n × k` strimler; pr. linje × antal bånd.

**Ruller:** alle strimler fordeles first-fit-decreasing på ruller à 60 m (skæretab mellem strimler ikke medregnet); vist som skæreplan pr. rulle med rest.

**UI:** flere linjer (bredde × længde × antal), resultat pr. linje + samlet (strimler, meter, ruller). Forudsætninger (strimmelbredde, rullelængde, svejsebom-maks., længdetillæg, svejsetab) kan rettes. Linjer og forudsætninger gemmes i `localStorage` `strimler.v1`.

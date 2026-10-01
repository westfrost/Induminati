# Test/index.html — Test-oversigt

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Test/index.html` (~92 linjer). **Version:** v1.4 · 01-10-2026.

**Formål:** Samme mønster som forsiden, men for work-in-progress-værktøjer der endnu ikke er klar til drift. Rent statisk HTML+CSS, ingen JS. Hvert kort har en ekstra `.app-badge` med teksten "TEST" (orange-toned, `#A3540E`/`#FCEADA`). Header-logoet linker tilbage til `../index.html`. Footer har en "Tilbage til forsiden"-link.

**Nuværende kort:** Kapacitetsoverblik (`../Kapacitet/`), Rullelængde (`../Rullelaengde/`, tilføjet v1.3), Variantoprydning (`../Varianter/`, tilføjet v1.4).

**Vedligehold:** Samme som index.html — når et værktøj er klar, flyt dets kort herfra til `index.html` (og fjern `TEST`-badgen), opdatér `README.md`, og versionsbump begge sider i samme ændring.

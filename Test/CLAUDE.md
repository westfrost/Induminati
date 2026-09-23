# Test/index.html — Test-oversigt

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Test/index.html` (~78 linjer). **Version:** v1.2 · 18-08-2026.

**Formål:** Samme mønster som forsiden, men for work-in-progress-værktøjer der endnu ikke er klar til drift. Rent statisk HTML+CSS, ingen JS. Hvert kort har en ekstra `.app-badge` med teksten "TEST" (orange-toned, `#A3540E`/`#FCEADA`). Header-logoet linker tilbage til `../index.html`. Footer har en "Tilbage til forsiden"-link.

**Vedligehold:** Samme som index.html — når et værktøj er klar, flyt dets kort herfra til `index.html` (og fjern `TEST`-badgen), opdatér `README.md`, og versionsbump begge sider i samme ændring.

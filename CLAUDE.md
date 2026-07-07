# Induminati — noter til Claude

Statisk site, ingen build-step. Hvert værktøj er én selvstændig `index.html` (indlejret CSS/JS). Se `README.md` for fuld oversigt over struktur, farveskema og deployment.

## Vedligehold README.md

Når du tilføjer, fjerner eller flytter et værktøj (fx mellem `Test/` og forsiden), eller laver en væsentlig funktionsændring på en side, opdatér `README.md` i samme ændring — værktøjstabellerne og beskrivelserne skal altid afspejle den faktiske repo-struktur.

## Farveskema

Alle sider deler samme lyse blå/orange palette (se `README.md` for de præcise hex-værdier). Nye sider eller UI-elementer skal bruge samme CSS custom properties-mønster (`:root { --dark; --accent; --text; --bg/--smoke; --surface/--light; --border; --muted; ... }`) frem for nye ad-hoc farver. Semantiske statusfarver (success/danger/advarsel) er undtaget — de skal blive ved med at betyde grøn/rød/gul, ikke tvinges ind i blå/orange.

## Versionsnummer pr. side

De fleste sider har en versions-footer i bunden, fx:
`<div ...>Bånd &amp; Medbringer DB &middot; v1.2 &middot; 07-07-2026</div>`

Hver gang der laves en opdatering af en side (funktionsændring, redesign, bugfix — ikke rene formateringsrettelser), skal den sides versionsnummer bumpes (patch/minor, fx v1.2 → v1.3) og datoen sættes til dags dato, i samme ændring. Hvis siden endnu ikke har en versions-footer, tilføj en (samme stil/format som de øvrige sider) næste gang den redigeres væsentligt.

## Merge/push til main

Efter enhver ændring der er committet og pushet til feature-branchen: spørg altid med det samme om det skal merges/pushes til `main` (dvs. gå live), i stedet for at antage at branchen bare skal stå og vente. Merge først når brugeren bekræfter.

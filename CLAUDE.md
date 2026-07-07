# Induminati — noter til Claude

Statisk site, ingen build-step. Hvert værktøj er én selvstændig `index.html` (indlejret CSS/JS). Se `README.md` for fuld oversigt over struktur, farveskema og deployment.

## Vedligehold README.md

Når du tilføjer, fjerner eller flytter et værktøj (fx mellem `Test/` og forsiden), eller laver en væsentlig funktionsændring på en side, opdatér `README.md` i samme ændring — værktøjstabellerne og beskrivelserne skal altid afspejle den faktiske repo-struktur.

## Farveskema

Alle sider deler samme lyse blå/orange palette (se `README.md` for de præcise hex-værdier). Nye sider eller UI-elementer skal bruge samme CSS custom properties-mønster (`:root { --dark; --accent; --text; --bg/--smoke; --surface/--light; --border; --muted; ... }`) frem for nye ad-hoc farver. Semantiske statusfarver (success/danger/advarsel) er undtaget — de skal blive ved med at betyde grøn/rød/gul, ikke tvinges ind i blå/orange.

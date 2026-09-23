# Styreliste/index.html — Styreliste Beregner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Styreliste/index.html` (~722 linjer). **Version:** v1.4 · 19-07-2026.

**Formål:** Beregner placering af styrelister (guide rails) på et transportbånd — hvor mange, hvor bredt et bånd, hvilken styrelistebredde, og enten center-til-center-afstand (2+ lister) eller manuel afstand fra venstre kant (1 liste). Producerer et opmålt SVG-diagram og en måltabel, samt en printbar arbejdsseddel.

**UI:** Parametre-panel (venstre): Båndbredde (mm), Antal styrelister (1–20), Styrelistebredde (mm), og et dynamisk felt der enten hedder "C/C afstand" (2+ lister, altid synligt hvis n>1) eller "Afstand til kant" (kun 1 liste — feltet `#ccField` skjules helt ved n≤1 via `updateCCVisibility()`, ikke omdøbt/omfunktionaliseret som tidligere). Ved 1 liste og tomt felt centreres listen automatisk; ellers måles altid fra **venstre** kant (`ccVal + guideWidth/2`) — der er **ingen** kant-vælger (venstre/højre) længere, den blev bevidst fjernet (se historik nedenfor). "Beregn"-knap, "↺ Nulstil"-knap (rydder alle felter), og en "⎙ Udskriv"-knap der først vises efter en beregning.

**Beregning (`calculate()`):** Validerer bredde/antal/styrelistebredde (>0, antal ≤20), beregner styrelisternes centerpositioner (symmetrisk fordelt omkring båndcenter for 2+, centreret eller kant-forskudt for 1), tjekker om nogen liste rager uden for båndet eller overlapper naboer, og renderer både et SVG-diagram (`renderDiagram()` — håndtegnet dimensionslinjer med pile, "K/K" kant-til-kant-mål fremhævet i orange, "C/C" center-til-center-mål i blåt) og en måltabel (`renderTable()`).

**Print:** `@media print` skjuler header/panel/version-footer, viser kun diagram+tabel i A4 landscape.

**Historik/kendt kontekst:** Havde tidligere (kortvarigt, tilføjet af en anden session) en "Mål fra"-dropdown (venstre/højre kant) ved 1 styreliste — brugeren bad om at få den fjernet igen ("den er ligegyldig"), så feltet måler nu altid fra venstre kant. Pas på ikke at genindføre den uden eksplicit at være bedt om det.

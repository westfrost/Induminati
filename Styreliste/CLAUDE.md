# Styreliste/index.html — Styreliste Beregner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Styreliste/index.html` (~1008 linjer). **Version:** v2.3 · 23-09-2026.

**Formål:** Beregner placering af **styrelister på bagsiden af transportbånd** og producerer et opmålt SVG-diagram (set fra båndets bagside), en afmærkningstabel, en måltabel og en printbar arbejdsseddel (A4 landscape, én side).

**Domæne — læs før du ændrer tekster:** En styreliste er en trapezformet V-profil (kilerems-profil) i PU/PVC, som svejses eller limes på båndets bagside og kører i en rille i tromler og glidebord, så båndet holdes på sporet (tracking). Der bruges både K- og M-profiler; de mest almindelige bredder er 6, 8, 10, 13 og 17 mm. Vis derfor kun tallet i UI'et, aldrig K/M-præfiks. Der er **ingen produkter, ingen "baner" og ingen "lysåbning"** i dette værktøj; brugeren har eksplicit afvist "lysåbning" som begreb. Styrelistehøjde er heller ikke relevant og skal ikke genindføres. Brug neutrale termer: C/C, K/K (kant til kant), afstand til båndkant.

## UI (parametre-panel)
- **Båndbredde**, **Antal styrelister** (1–20), **Styrelistebredde**. Styrelistebredde har en egen dropdown (`.combo` + `#guideList`, `initCombo()`) — **ikke** `<datalist>`, fordi browserens datalist filtrerer forslagene efter feltets indhold (stod der "10", viste den kun "10"); brugeren vil altid se hele listen. Åbner ved fokus/klik, piletaster + Enter vælger, Esc lukker listen (stopPropagation, så siden ikke nulstilles), aktuel værdi markeres med ✓. Forslagene er de mest almindelige bredder 6, 8, 10, 13, 17 mm — **kun tallene, ingen K-/M-betegnelse**, fordi der bruges både K- og M-profiler (oplyst af brugeren). Båndbredde har bevidst **ingen** forslag — brugeren ønskede det ikke.
- **Afstand angives som** (kun synlig ved 2+ lister) — segmenteret radiogruppe (`name="mode"`, global `mode`):
  - `cc` — én C/C-afstand for alle par (felt `#cc`).
  - `kk` — ønsket K/K afstand (felt `#kk`); C/C = K/K + listebredde (omvendt beregning).
  - `ind` — individuelle C/C-afstande (felt `#ccList`), adskilt af `;`, mellemrum eller `/` (IKKE komma — komma er decimaltegn). Skal være præcis n−1 værdier.
  - `eq` — "Jævnt": samme afstand mellem listerne og ud til båndkanterne: afstand = (B − n·w)/(n+1).
- **Afstand til venstre kant** (`#edgeDist`) — fælles for alle antal lister: fra venstre båndkant til liste 1's venstre kant. Tomt = centreret (1 liste: på båndmidten; 2+: listegruppen symmetrisk om båndmidten). Skjult i `eq`-mode. Der måles **altid fra venstre** — se historik.
- **Arbejdsseddel** (`<details>`): Ordrenr., Bånd/linje, Initialer — vises kun i print-hovedet.
- Knapper: "⎙ Udskriv arbejdsseddel" (kun når der er et gyldigt resultat), "🔗 Del link" (kopierer URL), "↺ Nulstil". **Esc** nulstiller (undtagen når styrelistebredde-dropdown'en er åben — så lukker Esc kun listen).
- Der er **ingen "Beregn"-knap** — alt genberegnes live på hvert `input`-event (`update()`).
- Alle talfelter er `type="text"` med `inputmode`, og `num()` accepterer både komma og punktum. Output formateres med komma (`fmt()`, max 2 decimaler).

## Tilstand (URL + localStorage)
`saveState()` skriver alle ikke-tomme felter som query-parametre (`b n w e cc kk ind o l i` + `m` for mode ≠ cc) via `history.replaceState`, og samme objekt til `localStorage['styreliste.v2']`. `loadState()` foretrækker URL-parametre, ellers localStorage. Nulstil rydder begge. Alt er pakket i try/catch.

## Beregning (`compute()`)
Returnerer `{missing}` (felt mangler → placeholder-tekst, ingen rød fejl), `{error}` (ugyldig værdi → rød tekst) eller et resultat med `centers`, `spacings`, `guides[]` (pr. liste: `l/c/r`, `outL/outR` = hvor meget den rager ud, `ovPrev/ovNext` = overlap med nabo, `flag`) og `warnings[]`. Advarsler (rager ud / overlap / ikke plads i eq-mode) vises i en gul `.warn-box` (semantisk advarselsfarve `--warn-*`, ikke brand), og **kun de berørte lister** farves røde; overlap og udragende dele tegnes med rød skravering.

## Diagram (`renderDiagram()`)
- `viewBox`-baseret SVG (760 bred), skalerer med containeren. På mobil (≤720px) har SVG'en `min-width:600px` og ruller vandret inde i `.diagram-wrap` i stedet for at blive ulæseligt lille.
- x-aksen (`xAxis()`) dækker `min(0, venstre liste)`…`max(B, højre liste)`, så lister uden for båndet stadig kan ses.
- Lodret opbygning: båndbredde-mål → nummercirkler (1…n) → bånd med lister → række 1 (kantafstande + listebredde vist én gang på liste 1 — **uden ⌀-tegn**, brugeren bad eksplicit om kun tallet) → K/K (orange) → C/C (blå) → POS-række (center målt fra venstre kant, lodrette tal) → signaturforklaring (inkl. "Set fra båndets bagside").
- **Kollisionsfri labels:** `stackTiers()` fordeler labels grådigt på "etager"; `dimRow()` skifter over/under målelinjen og længere ud, og returnerer den plads rækken skal bruge, så rækkerne aldrig overlapper. For smalle mål (<14 px) tegnes pilene udefra. Nummercirklerne stables på samme måde.

## Tabeller (`renderTables()`)
- **Afmærkning:** pr. liste: venstre kant og center målt fra **venstre** båndkant, højre kant målt fra **højre** båndkant (`B − g.r`). Hver kolonneoverskrift har en `<small>`-undertekst der siger hvilken kant der måles fra.
- **Mål:** båndkant → liste 1, K/K + C/C pr. par (samles i én "alle n−1 par"-række når alle afstande er ens og n>2), liste n → båndkant, samlet C/C, "afstand mellem lister og til kant" (eq), listebredde, båndbredde. OK/Advarsel-badge.

## Print
`@media print`: skjuler header/panel/footer, viser `.print-head` (titelblok med dato, ordrenr., linje, initialer, status og parameterresumé), diagram (max 70 mm) og de to tabeller side om side. Tykkere streger (`line:not(.ext)`). Med ~4 lister passer det på én A4 landscape-side; mange lister kan give side 2.

## Historik/kendt kontekst
- Havde tidligere (kortvarigt, tilføjet af en anden session) en "Mål fra"-dropdown (venstre/højre kant) ved 1 styreliste — brugeren bad om at få den fjernet igen ("den er ligegyldig"), så der måles altid fra venstre kant. Pas på ikke at genindføre den uden eksplicit at være bedt om det.
- v1.x viste "⌀20" over hver liste — ⌀ (diameter) var forkert for en bredde; brugeren vil kun have tallet.
- v1.x-noterne beskrev en `updateCCVisibility()` der skjulte feltet ved 1 liste, men koden omdøbte i virkeligheden feltet (`updateCCLabel()`). Siden v2.0 er det løst ved ét fælles "Afstand til venstre kant"-felt for alle antal lister, og C/C-felterne vises kun ved 2+.
- v2.3 (23-09-2026): `<datalist>` på styrelistebredde erstattet af egen dropdown der altid viser alle forslag (6/8/10/13/17) uanset feltets indhold. Undertekst efter "Afmærkning"-overskriften fjernet.
- v2.2 (23-09-2026): Afmærkningens "Højre kant" viste listens højre kant målt fra *venstre* båndkant (fx 255 ved 500 mm bånd, 10 mm liste centreret), men brugeren forventer afstanden fra *højre* båndkant (245). Kolonnen måler nu fra højre båndkant, og overskrifterne siger eksplicit hvilken kant hver kolonne måles fra. Skift den ikke tilbage.
- v2.1 (23-09-2026): styrelistehøjde + tværsnit fjernet (irrelevant for V-profiler på bagsiden), "lysåbning"/"baner"/"produktbredde"-sprog fjernet, forslagslisten viser kun tallene 6/8/10/13/17 (både K- og M-profiler bruges), "Set fra båndets bagside" i diagrammet, header-undertekst "Bagside af transportbånd".
- v2.0 (23-09-2026): stor udvidelse — live-beregning, 4 afstandsmetoder (C/C, K/K, individuel, jævn), asymmetrisk placering for 2+, afmærkningstabel, URL/localStorage, datalist-forslag, responsivt kollisionsfrit diagram med nummerering og POS-række, pr.-liste fejlmarkering, (tværsnit — fjernet igen i v2.1), arbejdsseddel-print, gul advarselsboks, komma-decimaler, Esc-nulstil.

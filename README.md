# Induminati

Interne webværktøjer til Induminati, hostet som en statisk side via GitHub Pages på [induminati.dk](https://induminati.dk).

Ingen build-step, ingen framework, ingen backend. Hvert værktøj er én selvstændig `index.html`-fil med indlejret CSS og JS. Data gemmes i browserens `localStorage`, med valgfri synkronisering til GitHub for de sider der har en "database" (se nedenfor).

## Struktur

```
/index.html              → Forside, links til live værktøjer
/Test/index.html         → Oversigt over work-in-progress værktøjer
/<Værktøj>/index.html    → Ét værktøj pr. mappe
```

### Live værktøjer (linket fra forsiden)

| Mappe | Værktøj | Beskrivelse |
|---|---|---|
| `Opskæring/` | Opskæringsberegner | Optimal opskæring af transportbånd fra moderrulle. Minimerer spild. |
| `Styreliste/` | Styreliste Beregner | Beregn placering og mål for styrelister på transportbånd. |
| `DXF/` | DXF → NCP Konverter | Konverter DXF-filer til NCP-format til vandskæring og CNC. |
| `Baanddb/` | Bånd & Medbringer DB | Opslagsdatabase over bånd- og medbringertyper med søgning og GitHub-sync. |
| `Ordrer/` | Ordreliste-værktøj | Renser og sammenligner "Frigivne produktionsordrer"-eksporter fra BC dag for dag. |

### Test / work in progress (linket fra `Test/index.html`)

| Mappe | Værktøj | Beskrivelse |
|---|---|---|
| `Kapacitet/` | Kapacitetsoverblik | Visualiser ordremængde vs. reel kapacitet pr. afdeling og uge. |
| `Samlevejledninger/` | Samlevejledninger | Opslagsværk over samlevejledninger for PU- og PVC-bånd — temperatur, holdetid, tryk og bemærkninger. |

Når et test-værktøj er klar til drift, flyttes det fra `Test/index.html` til forsidens `index.html`.

## Design / farveskema

Alle sider deler samme lyse farveskema med blå som primærfarve og orange som accentfarve:

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

Farverne defineres som CSS custom properties i hver sides `:root`-blok. Semantiske statusfarver (success/danger/advarsel, f.eks. kapacitets-tærskler eller valideringsfejl) er bevidst holdt adskilt fra de dekorative brand-farver og må ikke omdøbes til blå/orange — de skal blive ved med at betyde grøn/rød/gul.

## Database-sider (Baanddb, Samlevejledninger)

Disse to sider har en simpel "database" gemt i browserens `localStorage`, med mulighed for at synkronisere til/fra GitHub:

- **Push**: kræver et GitHub Personal Access Token (gemmes kun lokalt i browseren, aldrig i repo'et), skriver til `<Mappe>/database.json` via GitHub Contents API.
- **Pull**: virker uden token for et offentligt repo (henter direkte fra `raw.githubusercontent.com`), falder tilbage til Contents API + token hvis det fejler.
- **Samlevejledninger** pull'er automatisk og stille i baggrunden, når siden åbnes, så alle altid ser den nyeste data uden manuelt at skulle trykke "Pull".

## Deployment

GitHub Pages med custom domain (`CNAME` i repo-roden peger på `induminati.dk`). Siden opdateres når ændringer merges til `main` — arbejde sker på feature-branches og skal merges før det er live.

## Vedligeholdelse

Denne README skal holdes opdateret løbende: når et værktøj tilføjes, fjernes, flyttes mellem `Test/` og forsiden, eller får en væsentlig funktionsændring, opdatér tabellerne og beskrivelserne ovenfor i samme ændring.

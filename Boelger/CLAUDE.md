# Boelger/index.html — Bølgeberegner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Boelger/index.html`. **Version:** v1.0 · 31-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Bånd med bølger/buer: et hvidt (profil-)bånd svejses med højfrekvenssvejser ned på et blåt (bære-)bånd. Værktøjet regner ud, hvor langt der skal være mellem stregerne på det flade hvide bånd, så bølgerne får den rigtige **højde** når det trækkes sammen til **delingen** på det blå. Ingen eksterne scripts.

**Input (fra kundetegningen, brugerens skitse 31-10-2026):** Deling (top–top = bund–bund; samme mål som "længden"), Højde (fra blåt bånd til **toppen af det hvide**), Fladt stykke mellem bølgerne (der hvor der svejses), Tykkelse af hvidt bånd (felt, default 2). Desuden: bølgeform, antal bølger (valgfri → samlet længde), bredeste værktøj (default 20 mm; værktøjerne er 15 eller 20 mm), fod pr. ende ved stykker (default 20). Alt gemmes i `localStorage` `boelger.v1`.

**Geometri (midt i materialet):** buens bundbredde `b = deling − fladt − tykkelse`, stigning `r = højde − tykkelse` (fod-midte ved t/2, top-midte ved H − t/2). Buelængde `A` ved numerisk integration (Simpson, 2000 trin):
- **Bue (default, som brugerens tegning og fotos):** halv-ellipse med halvakser b/2 og r (= halvcirkel når r = b/2; kontrol: deling 100, højde 50, fladt 0, tykkelse 0 → 157,1 = π·50).
- **Blød sinus:** `y = r/2·(1 − cos 2πx/b)`.
Fladt stykke på det hvide (midt i materialet) = `deling − b` (= fladt + tykkelse). **Stregafstand = A + (deling − b).**

**Ét stykke vs. stykker (brugerens regel):** er det flade stykke **bredere end det bredeste værktøj**, kan det ikke svejses i ét hug → bølgerne laves i **stykker** (som det grønne bånd på brugerens foto): ét stykke pr. bølge = `A + 2 × fod`, streger ved fod / bue / fod. Fod pr. ende er en antagelse (default = 20 mm værktøjsbredde) — ikke oplyst af brugeren. Advarsel hvis 2 × fod > fladt stykke (nabofødder overlapper).

**Output:** stort resultat (stregafstand eller stykkelængde), buelængde, buens bundbredde/højde, fladt stykke, forhold hvidt:blåt (kun ét-stykke), samlet længde ved antal bølger, samt en skalatro SVG-skitse af 2 bølger over det udfoldede hvide bånd med streger.

**Ikke verificeret mod virkeligheden endnu** — brugeren bør sammenligne med en kendt båndtype og evt. kalibrere (fx hvis materialet strækkes/krymper ved svejsning).

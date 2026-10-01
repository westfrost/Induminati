# Varianter/index.html — Variantoprydning

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Varianter/index.html`. **Version:** v1.0 · 01-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Oprydning i varianter (afskårne båndstykker) på lageret. Brugeren går rundt med telefonen, søger varianten frem på mål (fx `140x2040`), skriver hvor mange stk der smides ud, og eksporterer til sidst et Excel-ark i det format, der bruges videre (se "Eksport"). Mobilvenlig: sticky søgefelt, store `−`/`+`-knapper, `inputmode="numeric"`, 16px+ font i felter (ingen iOS-zoom).

**Input — BC-udtræk ("Linjer (NN).xlsx"):** Ét ark med header-række der indeholder `Kode`, `Beskrivelse`, `Bredde`, `Længde`, `Planlagt disponibel balance` (+ flere kolonner der ignoreres). Header-rækken findes ved at lede efter en celle = "Kode". **Udtrækket indeholder ikke varenummeret** — derfor skal brugeren skrive Varenr før upload; hver upload er ét datasæt pr. varenr (gen-upload af samme varenr erstatter datasættet, markeringer på koder der stadig findes bevares). Mangler Bredde/Længde, parses de fra slutningen af beskrivelsen (`… 140 X 2.040`, punktum = tusindtal). `Planlagt disponibel balance` er m² på lager og vises som hjælp: "BC: 0,571 m² ≈ 2 stk" (balance / (B·L/1e6)). Læses med SheetJS.

**Søgning:** `140x2040` / `140 2040` / `140*2040` → bredde præcis, længde præcis eller som præfiks (`140x20` matcher 2000, 2040 …; `140x` = alle med bredde 140). Ét tal → bredde/længde/varenr. Ellers fritekst i kode/beskrivelse. Max 60 resultater vises. Findes et fuldt mål ikke, tilbydes "Tilføj manuelt" (med Varenr) → `state.manual`.

**Hurtigt flow:** skriv mål → Enter (fokus på første resultats antal) → skriv antal → Enter (søgefelt ryddes og får fokus igen).

**Placering:** Øverst ét fælles "Taget fra" (= *Gl placering*) og "Kommet hen" (= *Ny placering*) der gælder **alle** linjer på arket — ændres de, følger alle linjer uden egen placering med (de gemmes ikke pr. linje ved markering). Pr. linje kan "Ret placering" give en egen gl/ny (fx store varianter der ikke kan ligge på en hylde); tomt felt = brug fælles. Dette var et eksplicit brugerønske — lav det ikke om til at placering "fryses" pr. linje ved markering.

**State (`localStorage` `varianter.v1`):** `{settings:{gl,ny,title,unit,codeMode}, datasets:[{varenr,file,rows:[{code,desc,b,l,bal}]}], manual:[{id,varenr,b,l}], marks:{key:{count,gl,ny,t}}, lastVarenr}`. Nøgle = `varenr|kode` (manuel: `varenr|M<id>`). Kun lokalt på enheden — ingen sync.

**Eksport (ExcelJS):** Efterligner brugerens skabelon ("PU Døde varer"): ark `Ark1`, `A1` = overskrift (default "PU", Aptos Narrow 72pt), Excel-tabel `Tabel1` fra `B2` med stil `TableStyleLight2` og kolonnerne `Varenr | Variantkode | Ny placering | Gl placering | Kolonne1 | Antal | Enhed`. Varenr skrives som tal hvis det kun er cifre. Variantkode = `BxL` (default, som i skabelonen) eller BC-koden (`VAR…`) via indstilling; manuelle linjer bruger altid `BxL`. **Antal = m²** = stk × B × L / 1.000.000 (mm), afrundet til 4 decimaler. Enhed default "M2" (redigerbar). Kolonne1 tom. Rækker sorteret efter varenr, bredde, længde. Filnavn `<overskrift> - udsmidning DD-MM-YYYY.xlsx`.

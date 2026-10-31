# Boelger/index.html — Bølgeberegner

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Boelger/index.html`. **Version:** v1.1 · 31-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Bånd med bølger/buer: et hvidt (profil-)bånd svejses med højfrekvenssvejser ned på et blåt (bære-)bånd. Værktøjet regner ud, hvor langt der skal være mellem stregerne på det flade hvide bånd, så bølgerne får den rigtige **højde** når det trækkes sammen til **delingen** på det blå. Ingen eksterne scripts.

**Input (v1.1):** **Båndlængde** (altid) + **enten antal bølger eller deling** (segmenteret valg; brugerønske "enten det ene eller det andet"). Antal bølger → deling = L/N. Deling → N = floor(L/deling), med advarsel + forslag (N og N+1 bølger) hvis det ikke går op (rest > 0,5 mm). Derudover: Højde (fra blåt bånd til **toppen af det hvide**), Fladt stykke mellem bølgerne (valgfrit — **tomt = værktøjets bredde**), Tykkelse (default 2), bølgeform, svejseværktøj (Automatisk/15/20), fod pr. ende ved stykker (tom = værktøjets bredde). Gemmes i `localStorage` `boelger.v2` (v1.0 brugte `boelger.v1` uden båndlængde).

**Værktøjsvalg (brugerens regel 31-10-2026):** "altid det smalleste værktøj (15 mm), medmindre det går bedre op med 20 mm" — implementeret som: værktøjet hvis bredde ligger **tættest på det flade stykke**, uafgjort → 15. Intet fladt mål, eller fladt > 20 (stykker) → 15. Kan overstyres manuelt.

**Geometri (midt i materialet):** buens bundbredde `b = deling − fladt − tykkelse`, stigning `r = højde − tykkelse` (fod-midte ved t/2, top-midte ved H − t/2). Buelængde `A` ved numerisk integration (Simpson, 2000 trin):
- **Bue (default, som brugerens tegning og fotos):** halv-ellipse med halvakser b/2 og r (= halvcirkel når r = b/2; kontrol: deling 100, højde 50, fladt 0, tykkelse 0 → 157,1 = π·50).
- **Blød sinus:** `y = r/2·(1 − cos 2πx/b)`.
Fladt stykke på det hvide (midt i materialet) = `deling − b` (= fladt + tykkelse). **Stregafstand = A + (deling − b).**

**Ét stykke vs. stykker (brugerens regel):** er det flade stykke **bredere end det bredeste værktøj**, kan det ikke svejses i ét hug → bølgerne laves i **stykker** (som det grønne bånd på brugerens foto): ét stykke pr. bølge = `A + 2 × fod`, streger ved fod / bue / fod. Fod pr. ende er en antagelse (default = det valgte værktøjs bredde, ved stykker 15 mm) — ikke oplyst af brugeren. Advarsel hvis 2 × fod > fladt stykke (nabofødder overlapper).

**Output (v1.1, brugerønske: et færdigt "så langt et stykke / så mange stykker"):** ét stykke → **"Du skal bruge ét stykke hvidt bånd på N × stregafstand mm"** + "streg for hver X mm · N bølger"; stykker → **"Du skal bruge N stk. à (bue + 2 × fod) mm"** + samlet meter. Derunder: N × deling, valgt værktøj, fladt stykke, buelængde, opdeling af stregafstand/stykke, samt en skalatro SVG-skitse af 2 bølger over det udfoldede hvide bånd med streger.

**Ikke verificeret mod virkeligheden endnu** — brugeren bør sammenligne med en kendt båndtype og evt. kalibrere (fx hvis materialet strækkes/krymper ved svejsning).

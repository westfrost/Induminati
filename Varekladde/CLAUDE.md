# Varekladde/index.html — BC-varekladde

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Varekladde/index.html`. **Version:** v1.0 · 06-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Sidste led i variant-oprydningen (`../Varianter/` → evt. `../Samlark/` → her). Samler **alle** optællingslister ("PU Døde Varer <varenr>.xlsx", på tværs af varenr) til **én** varekladde der kan sættes direkte ind i Business Central som nedregulering. Ingen persistens af filer (kun i hukommelsen); kladde-felterne huskes i `localStorage` `varekladde.v1` (undtagen dato).

**Input:** Samme parser som Saml ark (header-række med "Varenr", kolonner på navn; `Varenr`/`Varenr.`, `Variantkode`, `Dimensioner`, `Antal`, `Enhed`/`Enhedskode`; gammel skabelon med mål i Variantkode understøttes). Identiske filer springes over (ingen dobbelt nedregulering).

**Sammenlægning:** Én kladdelinje pr. **varenr + variantkode (+ enhed)** — placering ignoreres (Placeringskode skal være tom), så samme variant fra flere ark/placeringer lægges sammen (Antal summeres, afrundet til 5 decimaler). **Udeladt** (vist under "N linjer ikke med i kladden"): linjer uden variantkode (fx manuelt tilføjede varianter — kan ikke nedreguleres uden variant) og linjer med antal 0. Sorteret efter varenr (numerisk), variantkode.

**Feltværdier (brugerens specifikation 06-10-2026):** Posttype = **Nedregulering**, Bilagsnr. = **AFR**, Lokationskode = **VIBORG**, Beskrivelse = **tom** (BC udfylder selv), Placeringskode = **tom**. Fra optællingen føres **kun Varenr., Variantkode og Antal (m²)** over (+ Enhedskode, typisk M2). Kladdenavn (default "SFE OP/NED", fra brugerens eksempel) og Bogføringsdato (default dags dato, DD-MM-ÅÅÅÅ, ugyldig dato deaktiverer output) er redigerbare. Alle øvrige kolonner (Årsagskode, Variant bredde/længde, Bredde, Længde, Pris, Beløb, Rabatbeløb, Kostpris, Udlign.postløbenr., Afdeling, Hovedgruppe, ItemDescription) er tomme.

**Output:**
- **"Kopiér til BC"**: tabulator-separeret tekst uden overskrift, **kolonne B–P** (Bogføringsdato → Enhedskode), dansk format (dato `DD-MM-ÅÅÅÅ`, decimalkomma). Bevidst *ikke* Kladdenavn (ikke en kolonne på kladde-siden) og *ikke* Pris/Beløb/Kostpris m.fl. — tomme celler indsat dér kunne overskrive de værdier BC selv beregner. Brugeren klikker i Bogføringsdato på første tomme linje og trykker Ctrl+V.
- **".xlsx"**: præcis BC's "Varekladder"-eksport (brugerens eksempel `eksempel på formatering varekladde.xlsx`): ark `Varekladder`, tabel `Table1` fra A1, `TableStyleMedium2`, alle 24 kolonner i samme rækkefølge og bredder, tekstformat `@` overalt undtagen Bogføringsdato (dato) og Antal (`#,##0.#####`). Varenr. skrives som tekst (som i BC's eksport). Filnavn `Varekladde AFR DD-MM-ÅÅÅÅ.xlsx`.

**UI:** Fast bjælke øverst (samme mønster som Variantoprydning/Saml ark): "N linjer · N varenr · total m²", "Ryd" (ER DU SIKKER-`confirm()`), "Kopiér til BC", ".xlsx". Forhåndsvisningen viser de faste felter én gang over tabellen og kun Varenr./Variantkode/Antal/Enhedskode i tabellen (mobilvenligt).

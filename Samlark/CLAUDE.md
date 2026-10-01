# Samlark/index.html — Saml ark

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Samlark/index.html`. **Version:** v1.0 · 01-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Efterbehandling til `../Varianter/` (Variantoprydning). Når flere personer/runder har talt varianter op, findes der flere "PU Døde Varer <varenr>.xlsx"-ark med samme varenr. Dette værktøj fletter dem til **én fil pr. varenr**. Lavet som separat værktøj (brugerens valg/accept) så Variantoprydning forbliver et rent tælleværktøj. Ingen persistens — alt ligger i hukommelsen, indtil siden lukkes.

**Input:** En eller flere `.xlsx` (multi-select eller træk-og-slip). Første ark i hver fil; header-rækken findes ved at lede efter en celle "Varenr", kolonner findes på navn (`Varenr`, `Variantkode`, `Dimensioner`, `Ny placering`, `Gl placering`, `Antal`, `Enhed` — rækkefølge er ligegyldig). Overskrift (fx "PU") = første tekst over header-rækken. **Bagudkompatibel med brugerens gamle skabelon** (uden `Dimensioner`, med `Kolonne1`): står der et mål `BxL` i Variantkode og ingen Dimensioner, flyttes det over i Dimensioner. En fil med *præcis* samme linjer som en allerede indlæst springes over med advarsel (forhindrer dobbelttælling hvis samme fil vælges to gange).

**Fletning:** Grupperes pr. varenr. Med "Læg ens linjer sammen" (default til) bliver linjer med samme `Variantkode | Dimensioner | Ny placering | Gl placering | Enhed` (case-/whitespace-normaliseret) til én linje med **summeret Antal (m²)**, afrundet til 4 decimaler; forskellig placering = separate linjer. Slås det fra, beholdes hver linje. Sammenlagte linjer får et "×N lagt sammen"-mærke i forhåndsvisningen (tooltip = kildefiler). Linjer sorteres efter bredde, længde.

**Output:** Samme format som Variantoprydnings eksport (ExcelJS): `Ark1`, `A1` = overskrift (Aptos Narrow 72), tabel `Tabel1` fra `B2`, `TableStyleLight2`, kolonner `Varenr | Variantkode | Dimensioner | Ny placering | Gl placering | Antal | Enhed`. Filnavn `PU Døde Varer <varenr>.xlsx`. Hold de to værktøjers eksportformat i sync, hvis det ændres ét sted.

**UI:** Fast bjælke øverst (samme mønster som Variantoprydning, brugerønske: altid synlig) med "N varenr · total m²", "Ryd" (med ER DU SIKKER-`confirm()`) og "Download alle (N)" (downloader filerne én ad gangen med 0,5 s mellemrum — browseren kan spørge om lov til flere downloads). Hvert varenr har også sin egen "Download"-knap. Tabeller scroller vandret i deres kort på mobil.

# Rullelaengde/index.html — Rullelængde

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**Fil:** `/home/user/Induminati/Rullelaengde/index.html`. **Version:** v1.1 · 01-10-2026. **Status:** Test/WIP (linket fra `Test/index.html`).

**Formål:** Beregn ca. længde af en båndrulle, der ikke kan rulles ud, ud fra ét enkelt mål og en lagtælling. Bygget til at blive brugt på telefonen ude ved rullen (mobilvenlig, store input-felter, `inputmode="decimal"`/`"numeric"`, 16px+ font i felter så iOS ikke zoomer).

**Metode:** Brugeren måler **M** = fra båndets yderside, gennem kernens midte, til hvor båndet starter på den modsatte side af kernen (kernerørets yderside). Det er R + r = (D + d)/2, dvs. præcis rullens gennemsnitsdiameter, så:

`L = π × M × n` (n = antal lag)

Lagene behandles som koncentriske cirkler; forskellen til en ægte (arkimedisk) spiral er < 1 ‰ og ignoreres. Lagtælle-metoden er valgt frem for tykkelses-metoden (`π(D²−d²)/4t`), fordi den er robust over for luft mellem lagene på løst viklede ruller.

**Input:**
- `M` (mm, påkrævet). Ét felt — et ekstra "M på kryds"-felt (gennemsnit af to mål) fandtes i v1.0, men blev fjernet i v1.1 efter brugerønske; genindfør det ikke.
- `Antal lag` (helt tal, påkrævet).
- Kontrol (valgfri): `Kerne Ø` **eller** `Båndtykkelse`.
  - Kun kerne Ø → yderdiameter `D = 2M − d` og beregnet tykkelse `t = (M − d)/n`.
  - Kun tykkelse → beregnet kerne Ø `d = M − n·t` (brugeren sammenligner med den rigtige).
  - Begge → afvigelse mellem beregnet og kendt tykkelse; ≤ 10 % = grøn "passer", ellers advarsel med forventet antal lag `(M − d)/t`.
- Komma og punktum accepteres begge som decimaltegn.

**Output:** Længde i meter (stort tal), "± 1 lag = ± π·M", gennemsnitsdiameter og evt. kontrolværdier. Genberegnes live ved hvert input.

**State:** Seneste indtastninger gemmes i `localStorage` under nøglen `rullelaengde.v1` (kun bekvemmelighed, ingen database/sync). "Nulstil" rydder felterne.

**Layout:** To kolonner (Mål | Resultat) + fuld-bredde "Sådan måler du"-kort med SVG-snittegning; under 640px én kolonne.

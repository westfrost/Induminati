# Kapacitet/ — Kapacitetsoverblik (Test/WIP)

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**File:** `/home/user/Induminati/Kapacitet/index.html` (single self-contained HTML file, no build step; linked from `Test/index.html`, not yet promoted to the front page). Uses one external dependency loaded from CDN: `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` (SheetJS, for reading `.xlsx`/`.xls` uploads).

## 1. Purpose

Kapacitetsoverblik visualizes projected order volume against actual production capacity, per department and per week, so planners can see whether upcoming weeks are on track, tight, or overloaded before the work actually lands on the floor. It works by combining two manually-maintained config tables — a list of departments with their weekly capacity (headcount × hours/week), and a mapping from BC "Varekategori" (item category) values to a department + a standard-hours estimate — with an uploaded "Frigivne produktionsordrer" export (the same export format the Ordreliste tool consumes). It buckets each order into a future week (by `Bekræftet leveringsdato`) and a department (via the category mapping), sums estimated hours per department per week, and compares that against each department's weekly capacity, rendering the result as a bar chart + table with three-color status (good/warn/crit).

## 2. UI walkthrough

**Header (14-09-2026):** now the same full-width dark-blue bar + decorative logo icon + `<h1>` + "← Forside" `.btn-home` link used by every other tool page — previously this page had no header bar at all, just a bare `<h1>Kapacitetsoverblik</h1>` + `.step-tag` span sitting inside `.wrap` with a plain `border-bottom`. Fixing that required moving `<header>` to be a direct child of `<body>` (before `.wrap`, so it can be full-bleed) and moving `body`'s old `padding:32px 24px 64px` onto `.wrap` instead (the header has its own `padding:18px 28px`). A new `--dark:#0B4F79` token was added to the **light** `:root` block only — deliberately **not** to the `@media (prefers-color-scheme: dark)` override below it, so the header bar stays the same fixed blue regardless of OS theme, exactly like every other page's header (which has no dark-mode awareness at all). The existing dark-mode block itself is otherwise untouched.

The page is organized as 5 numbered panels:

**Panel 1 — "Afdelinger & kapacitet"**
- `#deptTable` / `#deptTbody`: editable rows, one per department. Columns: Afdeling (text input, name), Ansatte (number input, employee count), Timer/ansat/uge (number input, hours/employee/week, default `37`), Kapacitet/uge (read-only computed cell, `#cap-<id>`), and a "Fjern" (remove) danger button per row.
- `#addDeptBtn` ("+ Tilføj afdeling"): appends a new blank department row (`{id, name:'', employees:0, hoursPerEmployee:37}`).
- Collapsible **GitHub-sync** sub-section (`#ghHeader`/`#githubBody`, toggled open/closed by clicking the header): a password-type input `#gh_token` for a GitHub Personal Access Token (persisted to localStorage on every keystroke via `saveGhSettings()`), and two buttons `#btnPush` ("⬆ Push opsætning") and `#btnPull` ("⬇ Pull opsætning"). A `#syncLog` line shows the result of the last sync action.

**Panel 2 — "Varekategori → afdeling & standardtid"**
- `#qtyColumnRow` (hidden until relevant): a `#qtyColumnSelect` dropdown to choose which uploaded column holds the piece/quantity count, used only when a category's calculation mode is "pr. styk" (per-unit).
- `#mappingTable`/`#mappingTbody`: one row per item category. Columns: Varekategori (auto-discovered categories render as read-only mono text; manually-added ones render as an editable text input), Afdeling (`<select>` populated from the department list, empty option `— vælg —`), Beregning (`<select>` with `pr. ordre` = `per_order` fixed-hours-per-order vs `pr. styk` = `per_unit` hours × quantity column), Timer (number input, the hours value used in the calc), and a "Fjern" button.
- Rows whose `departmentId` is unset get CSS class `unmapped` (`tr.unmapped td{background:#fdf3e0}`, dark-mode override `#3a2f14`) — a light amber highlight distinct from the good/warn/crit palette, just flagging "needs attention" in the config table.
- `#addCategoryBtn` ("+ Tilføj kategori manuelt"): appends a blank mapping row (`{id, category:'', departmentId:'', mode:'per_order', hours:0, auto:false}`).

**Panel 3 — "Upload ordreliste"**
- `#dropOrders`: click-or-drag file dropzone for `.xlsx`/`.xls`, backed by hidden `#fileInputOrders`. Shows the chosen filename in `#filenameOrders`.
- `#uploadStatus`: status banner (ok/err/info) reporting sheet name, row count, missing required columns, and how many new categories were auto-added to Panel 2's mapping table.

**Panel 4 — "Beregn"**
- `#weeksInput`: number input, "Antal uger frem" (weeks ahead to compute), default `8`, clamped `1–26`.
- `#computeBtn` ("Beregn kapacitet"): disabled until a file is successfully uploaded (and re-disabled if the upload is missing required columns); triggers `runCompute()`.
- `#computeStatus`: status banner summarizing rows/weeks/departments processed.

**Panel 5 — "Resultat"** (hidden — `display:none` — until first successful compute)
- A legend (`.legend`) explaining the four status-dot colors (see thresholds below).
- `#chartsContainer`: one `.dept-chart-card` per department, each with a title, a subtitle line (`N ansatte × Ht = capacityT/uge kapacitet · N ordre(r) i alt`), an optional italic note when capacity is 0/unset, and an inline SVG bar chart (`buildDeptChart()`).
- A "Tabel" heading + `#tableContainer`: a plain HTML table, one row per department, one column per week, each cell showing hours booked, a % of capacity (when capacity is set), a colored status dot, and a text status label underneath.
- A "Advarsler & ikke-tildelte kategorier" heading + `#warningsContainer`: lists unmapped categories (with order counts, sorted descending) and aggregate skip counts (status-excluded orders, orders without a valid date, orders outside the computed week window, per-unit orders missing a valid quantity).
- A fixed-position `#tooltip` div, shown/hidden on pointer/focus events over chart bars.

## 3. Capacity calculation logic

**Data model** (persisted as `config` object, see section 6):
```js
config = {
  departments: [{ id, name, employees, hoursPerEmployee }],
  mapping:     [{ id, category, departmentId, mode: 'per_order'|'per_unit', hours, auto }],
  quantityColumn: ''  // header name of the uploaded column used for 'per_unit' mode
}
```
- **Capacity per department per week** = `capacityOf(dept)` = `employees × hoursPerEmployee`, rounded to 1 decimal.
- **Week windows**: `runCompute()` builds `weeksCount` (from `#weeksInput`, clamped 1–26) consecutive Mon–Sun ranges starting from the current week (`getWeekRange(i)` → `getMonday(new Date())` + `i*7` days), each labeled `dd/mm–dd/mm` via `formatShortDate`.
- **Row processing** (`runCompute()`, iterating `uploadedRows`):
  1. Skip if `Status` is in `STATUS_EXCLUDE = ['6. SFE', '3. FÆRDIG']` (counted as `skippedStatus`).
  2. Look up `Varekategori` in the mapping (only mappings with a `departmentId` set are indexed, via `mappingByCategory`); if none found, tally into `unmapped` map (category → count), not counted as hours anywhere.
  3. Parse `Bekræftet leveringsdato` via `parseDateValue()` (handles Excel serial numbers via `excelSerialToDate()`, `Date` objects, and `dd-mm-yyyy` strings); if unparseable, counted as `skippedNoDate`.
  4. Find which of the computed week ranges the date falls into; if none (order due outside the N-week window), counted as `skippedOutsideWindow`.
  5. Compute `hours`: for `mode === 'per_order'`, it's just the mapping's fixed `hours` value; for `mode === 'per_unit'`, it's `hours × qty` where `qty` comes from `row[config.quantityColumn]` — if no quantity column is configured or the value isn't numeric, counted as `skippedQty` and hours contributed as 0 (the order is NOT dropped, it's still counted toward `orders[weekIdx]` but contributes 0 hours).
  6. Adds `hours` to `results[dept].hours[weekIdx]` and increments `results[dept].orders[weekIdx]`.
- **Category auto-discovery**: on file upload, `handleOrdersFile()` scans all distinct non-empty `Varekategori` values and auto-adds any not already in `config.mapping` as a new row with `auto:true`, `departmentId:''`, `mode:'per_order'`, `hours:0` — these show up as unmapped (amber row) until a human assigns a department and hours.
- **Required upload columns**: `Varekategori`, `Status`, `Bekræftet leveringsdato` (checked against `Object.keys(rows[0])`); missing columns produce an error status and disable the compute button.
- **Quantity column candidates**: `QTY_CANDIDATES = ['Restantal', 'Bestilt antal', 'Antal', 'Mængde', 'Restmængde', 'Levering antal', 'Ordreantal']` — `populateQtyColumnSelect()` auto-picks the first one present in the uploaded headers if the user hasn't already chosen one.
- **Visualization**: both a chart and a table, built by `renderResults()`:
  - Chart: `buildDeptChart()` builds a hand-rolled inline SVG bar chart per department (no charting library) — one bar per week, height scaled to `maxVal = max(capacity, maxHours, 1) * 1.15`, a dashed horizontal reference line at the capacity level (labeled `<capacity>t`), rounded-top bar rectangles (`roundedTopRectPath()`) colored via `statusColor()`, invisible larger `.bar-hit` rects layered per bar for tooltip hit-testing (`attachChartTooltips()` wires pointerenter/pointermove/pointerleave/focus/blur to a shared `#tooltip` element positioned via `positionTooltip()`).
  - Table: plain HTML `<table>`, department rows × week columns, each cell = hours + optional `(pct%)` + colored status dot + status label.

## 4. Good/warn/crit status thresholds

Defined once via two small pure functions, used consistently by both the chart and the table:
```js
function statusColor(pct, capacity) {
  if (capacity <= 0) return 'var(--baseline)';
  if (pct > 100) return 'var(--crit)';
  if (pct >= 85) return 'var(--warn)';
  return 'var(--good)';
}
function statusLabel(pct, capacity) {
  if (capacity <= 0) return 'Ikke sat';
  if (pct > 100) return 'Overbelastet';
  if (pct >= 85) return 'Tæt på grænsen';
  return 'OK';
}
```
- **`--good`** (`#0A7832` light / `#0ca30c` dark): booked hours `< 85%` of weekly capacity → "God margin" / "OK".
- **`--warn`** (`#CA8A04` light / `#fab219` dark): `85%–100%` inclusive-of-85 → "Tæt på grænsen".
- **`--crit`** (`#D03B3B` light / `#e66767` dark): `> 100%` → "Overbelastet".
- **`--baseline`** (`#B7C7D2` light / `#383835` dark): used when `capacity <= 0` (department has no employees/hours configured yet) → "Kapacitet ikke sat" — a neutral/grey 4th state, not really a severity level but shown alongside the other three in the legend and used for both the chart's capacity reference line/axis and as the color fallback.
- **Where they appear**: the legend at the top of Panel 5 (colored `.legend-dot` squares + Danish descriptions with the exact percentage cutoffs spelled out), each chart bar's fill color (`buildDeptChart` via `statusColor`), the tooltip's status line (`Status: <label>`), and each table cell's `.status-dot` + label text underneath the hours/percentage.
- **Distinctness from brand palette confirmed**: these four tokens are defined separately from the site's blue/orange brand tokens (`--ink`, `--paper`, `--surface`, `--secondary`, `--accent`/`--accent-soft`) in the same `:root` block, and are semantically green/amber/red/grey — they are **not** derived from or aliased to `--accent` (orange) anywhere in the file. This matches the stated intent that data-meaningful status colors were deliberately kept out of the site-wide blue/orange recolor. Note: the *unmapped-category row* highlight (`tr.unmapped td` amber background, `#fdf3e0`/`#3a2f14`) and the `.status.info`/`.gh-note` amber tones are separate ad-hoc amber shades, not using the `--warn` token — worth knowing if a future recolor wants full consistency, but they're config-table UI hints, not part of the good/warn/crit data-status system.

## 5. Dark mode support

The file has its own `@media (prefers-color-scheme: dark)` block (lines ~25–40) that redefines the entire `:root` custom-property palette for OS-level dark mode: `--ink` (white), `--paper`/`--surface` (near-black), `--line`/`--baseline` (dark greys), `--secondary`/`--muted` (light greys), `--accent` (a brighter blue `#3987e5` instead of orange — notably the dark-mode accent here is blue, not the site's orange), `--accent-soft` (dark navy), and the three status colors `--good`/`--warn`/`--crit` get brighter/more saturated dark-mode-friendly variants. There are two smaller companion dark-mode overrides further down: `tr.unmapped td` background (`#3a2f14`) and `.status.info` background/color. This is purely a `prefers-color-scheme` media query — there is no manual light/dark toggle control or `[data-theme]` attribute handling, and no JS reads or sets a theme preference; it only responds to the OS/browser setting. This is distinct from the rest of the site (most other pages have no dark-mode block at all) and was deliberately left in place during the site-wide light-theme recolor — only the default/light `:root` values were unified to the shared blue/orange palette, not this page's dark override. The 14-09-2026 header fix (§2) added `--dark:#0B4F79` for the new header bar to the light block only, again deliberately not to this dark-mode block — the header bar is exempt from the OS dark-mode theming and stays the fixed site blue, same as every other page's header.

## 6. GitHub sync / persistence

Not stateless — it has two independent layers of persistence, both scoped to `config` (departments + mapping + quantityColumn only; **uploaded order rows are never persisted**, they live only in the in-memory `uploadedRows`/`uploadedHeaders` variables and are lost on page reload):

- **localStorage** (`CONFIG_KEY = 'kapacitet_config_v1'`): `loadConfig()`/`saveConfig()` read/write the whole `config` object as JSON on every edit (department/category field changes, add/remove rows). This is the tool's default/automatic persistence — no explicit save button needed for local use.
- **GitHub sync** (optional, manual, config-only — same purpose as similar sync patterns used elsewhere in the repo): hardcoded target `GH_USER='westfrost'`, `GH_REPO='Induminati'`, `GH_PATH='Kapacitet/config.json'`.
  - **Pull** (`#btnPull`): fetches `https://raw.githubusercontent.com/westfrost/Induminati/main/Kapacitet/config.json` (no auth required — public repo), confirms via a native `confirm()` dialog before overwriting local config, then `applyLoadedConfig()` merges it in, re-derives `nextDeptId`/`nextMapId` from max existing IDs, saves to localStorage, and re-renders both tables.
  - **Push** (`#btnPush`): requires a GitHub Personal Access Token (stored in localStorage under `GH_SETTINGS_KEY = 'kapacitet_gh_settings'`, entered via the password-type `#gh_token` field with `Contents: Read & Write` permission). Fetches the current file SHA via `getFileSha()` (GET to the GitHub Contents API), then `PUT`s the new base64-encoded JSON via the Contents API with a commit message `Opdateret kapacitetsopsætning (<timestamp>)`, including the SHA if the file already existed (create-or-update in one code path).
  - The token is stored in plaintext in localStorage (`saveGhSettings()` fires on every `oninput`) — same trust model as manual GitHub sync elsewhere in this codebase; no server-side proxy, direct browser → GitHub API calls.
- **No sync of uploaded orders**: only the department/mapping *configuration* is shared via GitHub, never the actual order data — each user must upload their own BC export locally each session.

## 7. Known quirks / gotchas, and WIP status

- **No TODO/FIXME comments** in the file — the "unfinished" framing comes from its Test/ placement and the explicit disclaimer in Panel 2's rules text: *"Der findes intet systematisk grundlag for dette i BC endnu — udfyld ud fra jeres erfaring og forfin over tid"* ("There's no systematic basis for this in BC yet — fill it in from experience and refine over time"). In other words, the hours-per-category estimates are acknowledged guesswork, not derived from any real BC data source — that's the core reason it's still WIP/not promoted to the front page.
- **Orders lost on reload**: the uploaded order list is never persisted anywhere (not localStorage, not GitHub) — only the config (departments + category mapping) survives a refresh. Every session requires re-uploading the Ordreliste export before compute is possible.
- **`per_unit` silently zeroes missing quantities**: if a category is set to "pr. styk" but the row's quantity value is non-numeric or `config.quantityColumn` isn't set, the order still counts toward `orders[weekIdx]` (order count) but contributes `0` hours — it does not get excluded/warned individually, only tallied in the aggregate `skippedQty` warning count. This could understate load without being obvious per-row.
- **Date parsing is narrow**: `parseDateValue()` only understands Excel serial numbers, native `Date` objects, and strings matching exactly `dd-mm-yyyy`; any other string date format silently becomes `skippedNoDate`.
- **Week window is always "now"-anchored**: `getWeekRange()` always starts from `getMonday(new Date())` — there's no way to pick an arbitrary start date or look at past weeks; the tool is always forward-looking from today.
- **`unmapped` categories are silently dropped from all totals** (not just flagged) — an order in a category with no assigned department contributes zero hours anywhere and only shows up in the warnings list, which could make a department's true load look lower than reality if new categories appear in an upload and aren't triaged.
- **GitHub token stored in plaintext localStorage**, sent as a Bearer token directly from the browser to the GitHub REST API — no backend proxy. Anyone with browser/devtools access to the machine could read it.
- **Hardcoded repo path** `Kapacitet/config.json` and hardcoded `westfrost/Induminati` — if the repo is ever renamed/forked, this breaks silently (pull would 404, well-handled via `res.ok` check → error message, but not automatically discovered).
- **To be "done" / promoted to front page**, based on the code's own caveats, it would likely need: (a) a real, validated data source or sign-off process for the per-category standard-hours table instead of ad-hoc guesses, (b) probably some persistence or caching of the uploaded order data so users don't have to re-upload every session, and (c) general review/testing since it currently lives under `Test/` alongside other unfinished tools. There is no in-code indication of what specifically blocks promotion beyond the "no systematic basis yet" disclaimer.

## 8. Current version

Footer (bottom of `<body>`): **`Byg til intern brug · v1.2 · 14-09-2026`** — note it uses the generic "Byg til intern brug" label rather than the tool's own name, consistent with the note in `../CLAUDE.md` that some pages use a generic footer phrase rather than restating the tool name.

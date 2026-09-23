# Ordrer/ — Ordreliste-værktøj

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**File:** `/home/user/Induminati/Ordrer/index.html` (single self-contained file, ~920 lines — no separate CSS/JS files)
**Current version:** `v3.2 · 18-09-2026` (footer: `<footer>Byg til intern brug &middot; v3.2 &middot; 18-09-2026</footer>`)
**Status:** Live front-page tool (moved out of `Test/` per commit `637ced0`, "Flyt Ordreliste-værktøj fra Test til forsiden")

## 1. Purpose

This tool cleans and rolls forward the daily "Frigivne produktionsordrer" (released production orders) export from Business Central. BC's raw export has inconsistent columns (varies by which PC it was exported from) and no tracking of what changed day-to-day. The tool's job is to:

- Strip the raw export down to a fixed whitelist of relevant columns.
- Optionally **diff against yesterday's already-cleaned output** so that manually-entered tracking data (a "Rykket"/"moved" date, a "Grund"/reason, a "Ny leveringsdato"/new delivery date typed in by staff) isn't lost when the sheet is regenerated the next day.
- Detect and flag **newly appeared order numbers** that weren't in yesterday's file.
- Auto-fill a "Rykket" (moved) timestamp when staff have filled in "Ny leveringsdato" but haven't yet marked it as moved — a lightweight audit trail of when a delivery date change was noticed.
- Pull in "Intern sælger" (internal salesperson) from a separate Salgsordrer (sales order) export, matched via `Kildenr.` (source number).
- Filter the result down to only the weeks the user cares about (with everything overdue always included), and produce a clean, filtered, sortable, properly-typed `.xlsx` that becomes tomorrow's "i går" (yesterday) input — i.e. the tool is designed to be run once per day in a loop, chaining its own output as next-day input.

## 2. UI walkthrough (top to bottom)

**Header** — standard site topbar (`Trin 2 · Sammenligning` step tag), "← Forside" link back to `../index.html`.

**Panel 1 — "1. Upload ark"** (three-column `.upload-grid`, collapses to 2/1 columns on smaller screens):
- **"I dag" (required)** — `#dropToday` / `#fileInputToday`, accepts `.xlsx,.xls`. Expects the raw BC "Frigivne produktionsordrer" export.
- **"I går" (optional)** — `#dropYesterday` / `#fileInputYesterday`. Expects this tool's own previous output (already cleaned). Has a `#clearYesterday` "Fjern 'i går'-fil" link (only shown once a file is loaded) that resets `yesterdayRawRows`, the filename display, and the file input.
- **Salgsordrer (required)** — `#dropSales` / `#fileInputSales`. Expects a sales-order export containing `Nummer` and `Intern sælger` columns.
- All three are drag-and-drop zones (`setupDrop()`) that also respond to click-to-browse; a shared `#status` message box (`.status.ok/.err/.info`) reports load results/errors for whichever zone was last touched.

**Panel 2 — "2. Vælg uge(r)"** — six checkboxes `#weekOptions .week-cb[data-offset=0..5]`, "Denne uge" through "Uge +5", offset 0 checked by default. Each label shows a computed date range (`weekRange0..5`, dd/mm–dd/mm) and ISO week number (`weekNum0..5`, "Uge NN"), populated once at page load via `getWeekRange()`/`getISOWeekNumber()`.

**Panel 3 — "3. Hvad værktøjet gør"** — a static Danish explainer (`.rules`) documenting the exact cleaning/comparison rules (mirrors the JS logic below — kept in sync manually, not generated). Contains the **"Kør" (`#processBtn`)** button (disabled until "i dag" + Salgsordrer are both loaded) and **"Download resultat (.xlsx)" (`#downloadBtn`)** button (disabled until processing has run).

**Panel 4 — "4. Resultat"** (`#previewPanel`, hidden until first run) — shows a row/column count (`#rowCount`, plus "· N markeret som nye" if any, plus "(viser første 200)" when truncated) and an HTML preview table (`#previewTable`) capped at 200 rows, inside a scrollable `.table-scroll` container with a sticky header row.

**External libraries** (both loaded from cdnjs, no bundling):
- `xlsx.full.min.js` (SheetJS 0.18.5) — used **only for reading** the three uploaded files, in `readWorkbookRows()`: `XLSX.read(data, {type:'array'})` then `XLSX.utils.sheet_to_json(sheet, {defval:''})`. It picks the sheet whose name contains "frigivne" (case-insensitive), falling back to the first sheet.
- `exceljs.min.js` (ExcelJS 4.4.0) — used **only for writing** the download, in the `downloadBtn` click handler: builds an `ExcelJS.Workbook`, adds a real Excel Table object, applies per-cell formatting, and streams out an `.xlsx` blob.

## 3. File processing / column cleaning

Column whitelist is defined at the top of the script (commit `0e0fa61` switched this from a blacklist to a whitelist, so unknown/extra columns from varying export PCs are dropped automatically):

```js
const COLUMNS_TO_KEEP = ['Nummer', 'Varekategori', 'Beskrivelse', 'Kildenr.', 'Bekræftet leveringsdato', 'Status', 'Beskrivelse 2'];
```

`buildCleanedTodayRows()` does the cleaning, in this order:
1. Filters `originalHeaders` down to only those in `COLUMNS_TO_KEEP` (anything else is silently dropped, regardless of name); also computes `missing` — any whitelisted columns not found in the source, surfaced later as a warning.
2. Reorders columns: `Varekategori` is moved to sit right after `Nummer` (`MOVE_COLUMN`/`MOVE_AFTER`); `Beskrivelse 2` is moved to sit right after `Status`.
3. Appends three new empty columns — `Rykket`, `Grund`, `Ny leveringsdato` (`NEW_COLUMNS`) — positioned right after `Beskrivelse 2` (or after `Status` if `Beskrivelse 2` wasn't present, or appended at the end if neither anchor exists).
4. Inserts an `Intern sælger` column right after `Kildenr.` (or appended at the end if `Kildenr.` is absent).
5. Maps every raw row into the new header set: `NEW_COLUMNS` cells start blank; `DATE_LIKE_COLUMNS` (`Bekræftet leveringsdato`, `Rykket`, `Ny leveringsdato`) get run through `formatDateDK()`; everything else is copied through as-is (missing values become `''`).
6. Drops fully-empty rows (`isRowEmpty()`).
7. Applies the week filter (see §5).
8. Drops rows whose `Status` is `6. SFE` or `3. FÆRDIG` (`STATUS_VALUES_TO_DELETE`).

Date parsing/formatting helpers: `excelSerialToDate()` converts Excel's numeric date serials; `parseDateValue()` accepts a `Date`, a numeric serial, or a `dd-mm-yyyy` string; `formatDateDK()` renders any of those back out as `dd-mm-yyyy` text (used for display/preview and for the intermediate cleaned-row representation — actual Date objects are only reconstructed at export time).

## 4. Comparison logic ("i dag" vs "i går")

Diff key is **`Nummer`** (`KEY_COLUMN`), compared as a trimmed string.

- If no "i går" file is uploaded, the result is simply the cleaned "i dag" rows (sorted — see §5) — the status message tells the user to save it and use it as tomorrow's "i går".
- If "i går" is present:
  - Yesterday's rows are re-aligned to today's header set (`yesterdayAligned`) and re-formatted for date-like columns, then empty rows dropped.
  - **"Rykket" auto-stamping**: for each yesterday row, if `Ny leveringsdato` is filled in but `Rykket` is still blank, `Rykket` is set to `todayDK()` (today's date) — a one-time stamp of when the change was first detected. If `Rykket` already has a value, the tool never touches either field again (per commit `40654ec`, "Ret 'Rykket'-logik ... til at stemple dags dato" — this used to copy something else in, now it stamps today's date).
  - **New rows**: any `Nummer` in today's cleaned set not present in yesterday's key set is a "new order" — collected into `newOrders` and their keys into `newRowKeys` (used for preview highlighting).
  - **Field sync for rows present in both** (built from `todayKeyStatus`/`todayKeyKildenr`/`todayKeyDate`/`todayKeyBeskrivelse2` maps keyed off the **raw** today rows, not the cleaned ones):
    - `Status` is always overwritten to today's value if different (`statusUpdated` counter).
    - `Bekræftet leveringsdato` is always overwritten to today's value if different (`dateUpdated` counter) — per commit `d4b9515`, "Opdater Bekræftet leveringsdato altid ved sammenligning".
    - `Kildenr.` is filled in from today **only if it was blank in yesterday's row and today has a value** — never overwrites an existing value (`kildenrFilled` counter).
    - `Beskrivelse 2` is overwritten from today **only when today's value is non-blank and differs from yesterday's** (`beskrivelse2Updated` counter, added 17-09-2026) — a third, distinct sync pattern from both `Status`/date (always overwrite, even to blank) and `Kildenr.` (fill-only-if-yesterday-blank): here it's *today's* value that gates the overwrite, not yesterday's. Before this fix, `Beskrivelse 2` had no sync path at all — yesterday's value silently persisted forever and today's was discarded for any row present in both files (only brand-new rows ever showed today's value, since those come from `cleanedToday`/`newOrders` rather than `yesterdayAligned`). Explicitly requested and confirmed reversed-behavior fix; if today's `Beskrivelse 2` is blank, yesterday's value is left untouched (this is deliberately different from `Status`/date, which overwrite unconditionally including to blank).
    - `Rykket`, `Grund`, `Ny leveringsdato` are never touched by this sync step — they're the user's manually-maintained fields, preserved as-is from yesterday.
  - **Removal**: a yesterday row is dropped from the result only if its key is no longer present in today's raw data at all, or if today's status for that key is `6. SFE`/`3. FÆRDIG`. Critically, an order that just fell outside the selected week range is **not** removed — the week filter only applies to brand-new rows coming from "i dag" (see §5), so previously-tracked orders survive regardless of week selection.
  - Final result = `yesterdayAligned` (surviving, updated rows) concatenated with `newOrders`, then sorted.
  - `applySalesLookup()` (see below) runs on the final combined row set either way.

**Salgsordre lookup**: `buildSalesMap()` builds a `Nummer → Intern sælger` map from the sales-order file (first occurrence wins per key). `applySalesLookup()` matches each result row's `Kildenr.` against that map and writes `Intern sælger`; unmatched or empty `Kildenr.` leaves the field blank. This runs unconditionally on every process, both with and without a yesterday file (commit `068cc43`).

## 5. Week filtering & sorting

- `getMonday(d)` / `getWeekRange(offsetWeeks)`: computes Monday 00:00:00 → Sunday 23:59:59.999 for the week that is `offsetWeeks` weeks after the current week's Monday. Offsets 0–5 are precomputed once at page load to populate the six checkbox labels' date ranges and ISO week numbers (`getISOWeekNumber()`, standard ISO-8601 week calc via Thursday-of-the-week trick).
- `selectedWeekRanges()` reads whichever `.week-cb` boxes are currently checked and returns their ranges.
- `isDateInRanges(date, ranges)`: **there is no lower bound** — the cutoff is only the `end` of the *latest* selected week (`Math.max` of all selected ranges' end times); anything with a `Bekræftet leveringsdato` on or before that cutoff passes, including anything overdue/in the past. This means unchecking "Denne uge" while keeping "Uge +2" checked still includes everything up through the end of "this week" and earlier — the checkboxes only ever push the *upper* boundary forward, they don't carve out gaps.
- **A row with no parseable `Bekræftet leveringsdato` is never excluded by the week filter, since 18-09-2026.** In `buildCleanedTodayRows()`, `row.__weekDate` is `null` when the date cell was blank or in a format `parseDateValue()` doesn't recognize. The filter used to be `row.__weekDate && isDateInRanges(...)`, which discarded the row outright whenever `__weekDate` was falsy — a brand-new order with a not-yet-confirmed delivery date would silently vanish from the sheet the day it was created, with no warning (folded anonymously into the generic "N ordre(r) sorteret fra pga. ugevalg" count), and would then never resurface on its own, since it never made it into any day's output to be carried forward as "i går". Fixed by flipping the condition to `!row.__weekDate || isDateInRanges(...)` — a dateless row is now treated like an overdue one (which the filter already always includes) and passes through unconditionally; only a row that *has* a date past the selected cutoff is actually excluded. `sortByDeliveryDate()` already pushed dateless rows to the bottom (unchanged), so such an order now shows up on the sheet, just without a date, instead of not showing up at all. Reported by the user as a real incident: an order created Thursday for Friday delivery was missing from Friday's sheet; checking the raw "i dag" export confirmed the order was present (ruling out a timing/process miss), which pointed at this exact silent-drop path.
- This filter is applied **only inside `buildCleanedTodayRows()`**, i.e. only to rows freshly derived from "i dag". Rows carried over from "i går" during a comparison are exempt (per §4), so an order already being tracked never disappears just because it drifted past the week window.
- `processBtn` refuses to run if zero week checkboxes are checked (`showStatus('Vælg mindst én uge...', 'err')`).
- **Sorting**: `sortByDeliveryDate()` is applied to the final result in both branches (no-yesterday and with-yesterday), sorting by `Bekræftet leveringsdato` ascending (oldest first), with dateless rows pushed to the bottom, and original array order used as a stable tiebreaker for equal/missing dates (commit `129dce6`, most recent change to the file).

## 6. Excel output generation

Triggered by `downloadBtn` (async handler, uses ExcelJS):

- Creates one worksheet named `Frigivne produktionsordrer`.
- Column widths auto-sized per column: `min(max(longestValueLength+1, 8), 22)`.
- Row values are built via `tableRows`: for `DATE_LIKE_COLUMNS`, `parseDateValue()` converts the stored string back into a real JS `Date` object (falling back to the raw string if unparseable) — so dates land in the workbook as genuine Excel date cells, not text (commit `3167b4a`).
- **This is written as an actual ExcelJS Table object** (`ws.addTable({name:'FrigivneProduktionsordrer', ref:'A1', headerRow:true, totalsRow:false, style:{theme:'TableStyleMedium2', showRowStripes:true}, columns:[...{filterButton:true}], rows: tableRows})`) — commit `5642cbe` deliberately switched to this from manual cell coloring specifically so the grey/white row banding is a *table property tied to row position*, not a fixed per-row fill, meaning it won't visually break/shift when the user sorts the data inside Excel. `filterButton:true` on every column also gives the header row Excel autofilter dropdowns.
- After the table is built, every cell (including empty ones, `includeEmpty:true`) gets a thin black border on all four sides and font size 10 (bold on the header row only). Date-column cells that are actual `Date` instances additionally get `numFmt = 'dd-mm-yyyy'`.
- Header row is frozen (`ws.views = [{state:'frozen', ySplit:1}]`).
- Page setup: landscape, A4 (`paperSize:9`), fit-to-width 1 page (height unconstrained, `fitToHeight:0`), narrow margins (0.3"/0.4"/0.2") — commit `d105c10`.
- Filename: `` `Frigivne Produktionsordrer - ${todayDK()}.xlsx` ``, e.g. `Frigivne Produktionsordrer - 25-08-2026.xlsx`.
- **Important gap: new-row highlighting is preview-only.** `newRowKeys` (used for the amber `.new-row` background and the `NY` badge in the on-screen HTML `#previewTable`, see `renderPreview()`) is **never referenced anywhere in the `downloadBtn` handler**. The exported `.xlsx` has no color-coding, no marker column, and no comment/note distinguishing new orders from carried-over ones — a maintainer wanting that in the actual file would need to add it explicitly (e.g. a fill on rows whose key is in `newRowKeys`, mirrored into `tableRows`/cell styling).

## 7. Known quirks / gotchas

- **New-row marking doesn't survive into the downloaded file** (see §6) — only the live browser preview shows which rows are new. If a user relies on the exported file to see what's new, they won't find it there; this may be worth flagging to the user or fixing.
- **A dateless new order used to be silently dropped — fixed 18-09-2026, see §5.** Do not reintroduce a bare `row.__weekDate &&` check in `buildCleanedTodayRows()`'s week filter; a missing/unparseable `Bekræftet leveringsdato` must let the row through (like an overdue order), never exclude it.
- **Week filter has no floor, only a ceiling** — checking only "Uge +3" still pulls in everything overdue and everything through the end of that week; it is not possible to look at a single future week in isolation. This is intentional per the in-app copy ("inklusiv alt bagudrettet/overskredet") but easy to misread as a per-week filter.
- **Week filter doesn't affect carried-over rows** — only fresh "i dag" rows are subject to the week cutoff during a comparison run; a tracked order that drifts past the selected week window stays in the result rather than disappearing. This is deliberate (documented in the panel-2 `.rules` copy) but is the kind of behavior a maintainer could "fix" by accident, breaking the intended workflow of never silently losing a tracked order.
- **`Rykket` stamping is one-way and irreversible via this tool**: once `Rykket` has any value, the tool will never overwrite it again even if `Ny leveringsdato` changes further — by design (documented behavior), but worth knowing before "fixing" what looks like a stale timestamp.
- **Status/date sync always wins**: `Status` and `Bekræftet leveringsdato` are unconditionally overwritten from today's raw export on every comparison, even if a user had manually edited those specific cells in a previously-downloaded/re-uploaded "i går" file — only `Kildenr.` has fill-if-blank protection, and only `Rykket`/`Grund`/`Ny leveringsdato` are fully hands-off.
- **`missing` column warning** (`COLUMNS_TO_KEEP` entries absent from the source) degrades the status message from `ok` (green) to `info` (amber) but does not block processing — the tool proceeds with whatever columns it can find.
- **"I går" alignment silently reshapes older files**: `yesterdayAligned` is built by re-mapping yesterday's rows onto *today's* header set (`headers.forEach(h => ...)`), so if yesterday's file has a materially different column layout (e.g. from before a code change altered `COLUMNS_TO_KEEP`/`NEW_COLUMNS`), those old columns are simply dropped rather than erroring — worth checking column-list changes don't quietly discard data on the next day's run.
- **Sheet selection heuristic**: `readWorkbookRows()` picks the sheet whose name contains "frigivne" (case-insensitive) or falls back to the first sheet in the workbook — if BC's export or a saved output ever has multiple sheets without "frigivne" in the right one's name, the wrong sheet could be read silently.
- The `#clearYesterday` overlap-with-status-message bug mentioned in commit `86fc70a` ("Ret overlap mellem statusbesked og 'Fjern i går-fil'-link") appears already resolved in current markup/CSS — the clear link lives inside its own `.upload-col` under the Yesterday drop zone, while `#status` is a separate full-width element below the upload grid; no overlap is visible in the current layout.

## Key functions/constants reference (for quick navigation)

`COLUMNS_TO_KEEP`, `NEW_COLUMNS`, `KEY_COLUMN`, `DATE_LIKE_COLUMNS`, `STATUS_VALUES_TO_DELETE` (constants, top of `<script>`) · `readWorkbookRows()` (SheetJS read) · `buildCleanedTodayRows()` (whitelist + reorder + new columns + week filter + status filter) · `buildSalesMap()` / `applySalesLookup()` (Intern sælger join) · `sortByDeliveryDate()` · `getWeekRange()` / `getMonday()` / `getISOWeekNumber()` / `isDateInRanges()` (week logic) · `parseDateValue()` / `formatDateDK()` / `excelSerialToDate()` / `todayDK()` (date handling) · `processBtn` click handler (lines ~702–812, main diff/merge logic) · `renderPreview()` (HTML preview + new-row badges) · `downloadBtn` click handler (lines ~843–910, ExcelJS export).

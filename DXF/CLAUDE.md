# DXF/ — DXF → NCP Konverter

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**File:** `/home/user/Induminati/DXF/index.html` (single self-contained file, ~2030 lines). Danish-language UI. Page `<title>` is "DXF → NCP Konverter" but the on-page `<h1>` reads "DXF / SVG → NCP Vandskærer Konverter" with a small tag `IMF_PBL` — the tool actually accepts both DXF and SVG input despite the shorter title/footer label. Version footer (bottom of file): **v1.2 · 07-07-2026**.

## 1. Purpose

Converts 2D CAD drawings (DXF or SVG) into `.ncp` G-code-like programs for a waterjet/CNC cutting machine (an "IMF_PBL" controller dialect — commands like `MOVEABS`, `CWABS/CCWABS`, `FASTABS`, `SETPORT`). It parses vector entities out of the uploaded file, normalizes/scales them into micrometers, lets the operator preview the geometry and the resulting cut path, then emits the NCP text file for download. It also has a secondary standalone mode ("03 — Manuelt emne") to generate simple parametric shapes (rectangle, circle, flange/washer) without any source file at all — useful for quick one-off cuts.

## 2. UI walkthrough

Left panel (`.panel`), top to bottom:

- **01 — DXF / SVG Fil**: a drag-and-drop zone (`#dropZone`) plus hidden `<input type=file accept=".dxf,.svg">`. Drop or click-to-browse triggers `handleFile()`. Shows a green "file loaded" chip (`#fileLoaded`/`#fileName`) once a file is read.
- Hidden machine-config fields (not exposed in the UI, but read by the generator): `#vel` (50000), `#fastvel` (166000), `#pressure` (3800), `#startWait` (1000), `#material` ("POM/Standard/5.000"), `#outputName`. These are fixed constants baked into the page rather than user-editable controls.
- **02 — Indstillinger** (settings):
  - `#arcMode` select — "Native CWABS/CCWABS (anbefalet)" vs. segmenting arcs into 5°/2°/1° line chords.
  - `#dxfUnit` select — mm / m / inch / µm (µm = "already in NCP unit"), drives `getScaleFactor()`.
  - `#cutOrder` select — "DXF-rækkefølge" (as-drawn) vs. "Optimer" (nearest-neighbor travel optimization via `optimizeCutOrder()`).
  - `#leadIn` number input (mm, default 3) — lead-in/lead-out distance; explanatory text notes the cutter starts 3mm outside the contour and plunges in (and 3mm inside a hole's void for internal cuts).
- **03 — Manuelt emne** (manual shape generator): tab group (`switchShapeTab()`) for Firkant (rectangle: width/height/corner radius), Cirkel (outer diameter), Flange (outer Ø + inner Ø/hole). Has its own output filename field (`#shapeOutputName`) and a "⚡ Generer fra mål" button (`generateShapeNCP()`) that builds geometry directly and skips DXF/SVG parsing entirely.
- **Fundet geometri** (entity info, hidden until a file loads): stat tiles for entity count and bbox size in mm, plus colored badges per entity type (`updateEntitySection()`).
- **Log** panel (`#log`) — timestamped/colored status lines (`log(msg, type)`, types `ok`/`warn`/`err`/`info`/`accent`).
- **Actions**: "⚡ Generer NCP-fil" (`#btnConvert`, disabled until parse succeeds, wired to `generateNCP()`), and "↓ Download NCP" (`#btnDownload`, hidden until output exists, calls `downloadNCP()`).

Right panel is the preview area with a tab group (Geometri / NCP kode, `switchTab()`):
- **Geometri tab**: `<canvas id="preview">` rendering the parsed geometry, plus floating zoom +/−/fit buttons (`zoom()`, `fitView()`) and a bottom-left overlay (`#coordOverlay`) showing size/zoom/entity count.
- **NCP kode tab**: `#viewNcp` — syntax-highlighted plain-text NCP output, line count shown in `#previewInfo`.

## 3. DXF parsing

`parseDXF(text)` is a **hand-rolled line-by-line DXF parser** — no library, no format sniffing beyond finding the `ENTITIES` section by scanning for a bare `ENTITIES` line. It walks the file as pairs of (group code, value) lines, looks for `0`-code entity-type markers, and dispatches per type. Parsing stops at `ENDSEC`/`EOF`.

Supported entity types:
- **LINE** — reads codes 10/20 (start) and 11/21 (end); degenerate (near-zero-length, `dist < 0.5`) lines are dropped.
- **ARC** — codes 10/20 (center), 40 (radius), 50/51 (start/end angle in degrees).
- **CIRCLE** — codes 10/20 (center), 40 (radius).
- **LWPOLYLINE / POLYLINE** — vertex points collected via repeated 10/20 pairs (helper `readEntityProps`), bulge factors from code 42 (per-vertex, keyed by point index), closed flag from bit 0 of code 70.
- **SPLINE** — control points collected from 10/20 pairs (same collection path as polylines, since `readEntityProps` treats spline control points identically); **splines are NOT true NURBS-evaluated** — they are just treated as a polyline through the raw control points, with a warning logged (`⚠ SPLINE fundet (...) — approksimeres som polyline`). This is a shape-fidelity gotcha: a spline rendered this way will generally NOT match the true curve, especially for coarse control-point spacing.

Any entity type not explicitly matched (e.g. ELLIPSE, TEXT, MTEXT, DIMENSION, INSERT/block references, HATCH, SOLID, POINT) is **silently ignored** — the `0`-code dispatch has no `else`/fallback branch, so unrecognized entities produce no log message and no error; they simply vanish from the output. There is no block/INSERT expansion, no layer filtering/exclusion UI (layer is captured per entity but never used to filter), and no handling of DXF `LAYER` or `HEADER` sections (units, etc. — units are taken purely from the user's `#dxfUnit` dropdown, not from the DXF's own `$INSUNITS`).

All coordinates are converted to **integer micrometers** via `toUm(v) = Math.round(v * scaleFactor)`, where `scaleFactor` comes from `getScaleFactor()` (mm→1000, m→1000000, inch→25400, µm→1). After parsing, `normalizeEntities()` shifts all geometry so the bounding-box minimum is at (0,0) — logging the applied offset in mm.

**SVG parsing** (`parseSVG`) is a separate, equally hand-rolled path: walks `line/rect/circle/ellipse/polyline/polygon/path` elements, applies cumulative `transform` matrices (`matrix/translate/scale/rotate`, composed via `multiplyMatrix`), attempts to detect mm-vs-user-unit scale from `viewBox`+`width="...mm"`, and has a full custom SVG path-data tokenizer/interpreter supporting M/L/H/V/C/S/Q/T/A/Z (cubic and quadratic Béziers flattened by recursive subdivision `subdivideCubic`/`subdivideQuadratic`; elliptical arcs converted to points by `svgArcToPoints`). Ellipses are always segmented into ~72 points with a warning logged.

## 4. Canvas preview

`renderCanvas()` is the core draw routine: clears the canvas, draws a light grid (`#E3EAF0`, step 10mm or 50mm depending on zoom level) and darker axes at X=0/Y=0 (`#AABDCB`), then iterates `parsedEntities` drawing each with `ctx.beginPath()/stroke()` using a per-type color map:
- LINE → `#0B4F79` (dark blue / `--accent2`)
- ARC → `#C9640F` (burnt orange / `--accent-hover`)
- CIRCLE → `#1C7FBF` (link blue / `--link`)
- POLYLINE → `#2E9E52` (green / `--success`)
- SPLINE → `#9A6B00` (amber / `--warn`)

After stroking all entities, it draws a small green filled dot (`#2E9E52`, r=3px) at the computed start point (`entityStart()`) of every entity — a visual marker for where each cut begins.

Zoom/pan: `canvasTransform = {scale, tx, ty}`. Mouse wheel zooms around the cursor position (`wheel` listener, factor 1.12), click-drag pans (`mousedown/mousemove/mouseup`), and the on-screen +/− buttons call `zoom(1.3)`/`zoom(1/1.3)`. `fitView()` recomputes canvas size from its wrapper, computes bbox via `getBBox()`, and centers/scales to fit with 40px padding — called on file load (`renderPreview()`) and on window resize (only if entities exist). Coordinate transform: `toSX(x) = x*scale+tx`, `toSY(y) = y*scale+ty` — note Y is NOT flipped, so DXF/screen Y both increase downward-as-plotted in this canvas (i.e., no inversion for the typical "Y-up" CAD convention — arcs are drawn with `ctx.arc(..., -a2*π/180, -a1*π/180)`, negating angles to compensate).

## 5. NCP output generation

Two entry points produce NCP text, both duplicating the same header/segment-loop structure:
- `generateNCP()` — driven by parsed DXF/SVG entities, triggered by `#btnConvert`.
- `generateShapeNCP()` — driven by the manual-shape generator (rect/circle/flange), fully independent code path with its own copy of the emission loop.

Pipeline for `generateNCP()`:
1. Optionally reorders entities via `optimizeCutOrder()` (nearest-neighbor greedy travel-salesman heuristic based on `entityStart()`/`entityEnd()`) if cut-order = "optimize".
2. `buildSegments(entities)` converts each entity into a list of low-level move commands (`cmdsFromEntity`) — `MOVEABS`, `CCWABS`, `CWABS` — and then **chains** consecutive entities whose endpoints touch within `TOLERANCE = 100µm (0.1mm)`, reversing entities as needed (`reverseCmd`) so they connect into one continuous segment. Each resulting segment becomes one pierce-cut-off cycle.
   - LINE → two MOVEABS.
   - ARC → MOVEABS to arc start, then either one native `CCWABS` (DXF arcs assumed CCW) or a series of MOVEABS chord segments if arc-mode is a fixed degree step.
   - CIRCLE → MOVEABS to rightmost point, then either two half-circle `CCWABS` moves (since a single CCWABS can't express 360°) or segmented MOVEABS chords.
   - POLYLINE/SPLINE → MOVEABS per vertex, using per-vertex bulge (`bulgeToArc()`) to emit `CCWABS`/`CWABS` instead of a straight MOVEABS when a bulge is present and arc-mode is "native". SPLINE entities have no bulge data (bulges only come from LWPOLYLINE), so splines always become straight MOVEABS polylines regardless of arc-mode.
3. For each segment, `computeLeadIn()` computes a point offset backwards (opposite the initial cut direction) by the configured lead-in distance, outside the contour's start.
4. Emits per-segment NCP block: `FASTABS` to lead-in point → `WAIT 10` → `SETPORT A4=00000001` (pierce/water on) → `WAIT 10` → `WAIT {startWait}` (dwell) → the chained `MOVEABS`/`CWABS`/`CCWABS` moves → `WAIT 10` → `SETPORT A4=00000000` (off) → `WAIT 10` → `WAIT 200`.
5. File header: `IMF_PBL_v1.0`, then comment lines `;FILE:`, `;MATR:`, `;DRAWING:`, `;DATE:` (`todayDanish()` → dd-mm-yyyy), `;PRESSURE:`, then `FASTVEL`, `VEL`, `;Valgte dyser : TOOL:1`. Ends with `PROGEND`.

Output is joined with `\r\n` (CRLF) and downloaded via `downloadNCP()`, which manually re-encodes the string to raw bytes (masking each char code with `& 0xff`) to force **ISO-8859-1/Latin-1** output rather than UTF-8 — presumably for controller compatibility.

**Syntax highlighting**: `renderNcpPreview()` splits output by line and wraps each in a `<span>` class based on a simple `startsWith()` prefix check — `cmd-comment` (`;`), `cmd-header` (`IMF_`/`FASTVEL`/`VEL `/`PROGEND`), `cmd-fast` (`FASTABS`), `cmd-move` (`MOVEABS`), `cmd-arc` (`CWABS`/`CCWABS`), `cmd-control` (`SETPORT`/`WAIT`) — each mapped to a CSS color variable in the stylesheet (e.g. `.cmd-move{color:var(--accent2)}`). Text is escaped via `esc()` (only `&` and `<`) before insertion as `innerHTML`.

## 6. Known quirks / gotchas

- **Unsupported DXF entities are silently dropped** with no warning — ELLIPSE, TEXT/MTEXT, DIMENSION, HATCH, SOLID, POINT, INSERT (block references), 3D entities, etc. all vanish without a log line, since the `0`-code dispatch in `parseDXF` has no fallback/else branch (contrast with the SVG parser's ellipse warning, and SPLINE's explicit warning).
- **SPLINE is not truly evaluated** — it's approximated as a straight-line polyline through the raw control points (not even a proper NURBS sampling), which can differ significantly from the actual curve for sparse control points. A warning is logged but the shape may still be visibly wrong.
- **No DXF units/HEADER awareness** — the `$INSUNITS` DXF header variable is never read; the user must correctly pick the unit from `#dxfUnit`, and picking wrong silently produces a mis-scaled part.
- **No block/INSERT expansion** — entities inside DXF block definitions referenced via INSERT are not resolved/flattened, so block-based drawings will parse as mostly empty.
- **LWPOLYLINE bulge handling only applies in "native" arc mode** — if the user picks a segmented arc mode (5°/2°/1°), bulges are ignored and arcs in polylines become straight chords between vertices (no re-segmentation of the bulge arc itself), unlike ARC/CIRCLE entities which do get properly segmented in that mode.
- **Entity chaining tolerance is fixed at 100µm (0.1mm)** (`TOLERANCE` constant in `buildSegments`) and not user-configurable — drawings with small gaps between segments beyond that will be split into separate pierce cycles instead of one continuous cut.
- **Y axis is not flipped** for canvas draw vs. DXF's usual Y-up convention; arc angles are drawn with negated angles (`-a2`, `-a1`) to compensate visually, which is a fragile compensating hack rather than a coordinate-system transform — worth checking carefully if canvas-vs-NCP-output visual mismatch bugs ever arise.
- **All coordinates rounded to whole micrometers** (`Math.round`) at multiple stages (parse-time `toUm`, arc start/end points, bulge arc centers, lead-in points) — cumulative rounding could introduce sub-micron drift in chained/optimized paths, though this is unlikely to matter practically for waterjet tolerances.
- **`bulgeToArc()` contains dead code** — it computes `cx`/`cy` via a trig formula (lines ~1654-1655) that is immediately discarded in favor of a second "simplified: midpoint method" calculation a few lines later. Only the midpoint-method result is returned; the first calculation is inert leftover code.
- **`readEntityProps`'s `_ctrlpts` is effectively unused/dead**: it initializes `ctrlpts = []` but never pushes to it, so `props._ctrlpts` always falls back to `polypts`. SPLINE entities thus get identical point capture behavior to LWPOLYLINE (raw 10/20 pairs), reinforcing that splines are never true curve-fit.
- **Machine parameters are hardcoded, not exposed in the UI** — velocity, fast-travel velocity, pressure, start-wait dwell, and material string are all fixed hidden `<input>` values (50000, 166000, 3800, 1000, "POM/Standard/5.000"); changing them requires editing the HTML source, not the running page.
- **Output filename field** (`#outputName`) is also a hidden input, populated automatically from the uploaded file's basename in `handleFile()` — there's no visible UI to rename the output for DXF/SVG conversions (only the manual-shape generator has a visible filename field, `#shapeOutputName`).
- Title/header/footer inconsistency: `<title>` and the version footer both say "DXF → NCP Konverter" (omitting SVG), while the visible `<h1>` and actual functionality cover both DXF and SVG — a documentation nit, not a functional bug.

# DXF/ — DXF / SVG → NCP Konverter

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow), som gælder
> for alle værktøjer, denne fil inklusive.

**File:** `/home/user/Induminati/DXF/index.html` (single self-contained file, ~1900 lines). Danish-language UI. Version footer (bottom of file): **v2.0 · 30-10-2026**. v2.0 was a near-complete rewrite of the v1.x script (see §7 for what was wrong in v1.x — do not reintroduce those bugs).

## 1. Purpose

Converts 2D CAD drawings (DXF or SVG) into `.ncp` programs for a waterjet cutter ("IMF_PBL" controller dialect — `FASTABS`, `MOVEABS`, `CWABS`/`CCWABS`, `SETPORT`, `WAIT`, `PROGEND`). Pipeline: parse → chain into contours → classify outer/hole → lead-ins + cut order → (optional nesting on a sheet) → NCP text → ISO-8859-1 download. There is also a manual shape generator (rectangle with optional corner radius, circle, flange) that feeds the same pipeline, so manual shapes can be nested too.

## 2. Coordinate system & data model (read first)

- **Everything internal is in micrometers (µm, the NCP unit) as floats, Y up** (same as CAD/DXF). Rounding to integer µm happens **only** when NCP lines are emitted (`Math.round` in `generateNCP`).
- **SVG is Y-down**, so `parseSVG` mirrors Y (root matrix `[s,0,0,-s,0,0]`) — an SVG part is cut as it looks. (v1.x did not flip and the canvas drew Y-down, so DXF parts looked mirrored in the preview and SVG parts were cut mirrored.)
- **Machine zero = (0,0).** Without nesting the part is normalized so its bbox min is (0,0). With nesting, (0,0) is the sheet's bottom-left corner and parts are placed at absolute sheet coordinates.
- **Segments:** `{t:'L', x0,y0,x1,y1}` or `{t:'A', x0,y0,x1,y1,cx,cy,ccw}` (`Lseg`/`Aseg`). Arcs are defined by endpoints + center + direction; `arcSweep()` gives the signed sweep. Full circles are always **two half arcs** (CCWABS can't express 360°). `revSeg` swaps endpoints and flips `ccw` — this is how a contour is reversed correctly.
- **Paths** (parser output): `{segs, closed, layer}` — one per source entity (closed polylines/circles are already closed).
- **Contours** (`buildContours`): chained paths + `poly` (flattened at 10 µm), `bb` (exact, incl. arc extremes via `segBB`), signed `area` (CCW positive), `depth` (number of closed contours containing it), `parent` (smallest container index), `kind` = `outer` (closed, even depth) / `hole` (closed, odd depth) / `open`.
- **Matrices** are `[a,b,c,d,e,f]` (`mat.*`). `xfSegs(segs, m)` transforms segments; if `m` is not a similarity (non-uniform scale from an INSERT or SVG transform) arcs are flattened to lines first; a mirroring matrix (det<0) flips `ccw`.

## 3. Parsing

**DXF (`parseDXF`)** — hand-rolled, no library. `readPairs` → (code, value) pairs; walks `SECTION`s:
- `HEADER`: reads `$INSUNITS` (1 inch, 4 mm, 5 cm, 6 m, 13 µm). On **first load** of a file this sets the `#dxfUnit` dropdown; afterwards the user's choice wins. Changing the unit re-parses the stored file text (`srcText`) — in v1.x a unit change after loading did nothing.
- `BLOCKS`: block definitions (base point + records) for `INSERT`.
- `ENTITIES`: `readRecords` + `groupSeq` (attaches `VERTEX` records to `POLYLINE`, drops `ATTRIB`/`SEQEND`).
- Supported: `LINE`, `ARC`, `CIRCLE`, `LWPOLYLINE` (bulges → real arcs via `bulgeSeg`), old-style `POLYLINE`+`VERTEX` (meshes/polyface skipped), `SPLINE` (true rational B-spline evaluation via de Boor, `nurbsPts`; falls back to fit points with a warning), `ELLIPSE` (flattened, 180 pts/turn), `INSERT` (recursive, depth ≤ 8, scale/rotation/column-row arrays; block entities on layer `0` inherit the insert's layer).
- OCS: entities with extrusion Z < 0 (code 230) are mirrored in X (arbitrary-axis rule for N=(0,0,-1)) for CIRCLE/ARC/LWPOLYLINE/2D POLYLINE/INSERT; ELLIPSE flips its minor-axis direction. LINE/SPLINE/ELLIPSE coordinates are WCS.
- Paper-space entities (code 67 = 1) at top level are skipped (title blocks etc.).
- Everything else (TEXT, MTEXT, DIMENSION, HATCH, POINT, …) is **counted and listed in one log warning** — never silently dropped.

**SVG (`parseSVG`)** — DOMParser; elements `line/rect/circle/ellipse/polyline/polygon/path`, skipping anything inside `defs/clipPath/mask/symbol/marker/pattern`. `<use>` is not supported (warned). Transforms: `parseTransform` composes *all* functions in order (`matrix/translate/scale/rotate(a,cx,cy)/skewX/skewY`); cumulative matrix from all ancestors. Scale: `width` with an absolute unit (mm/cm/in/pt/pc) + `viewBox` → exact; otherwise SVG user units are treated as the selected unit. Circles and equal-radius rounded rects become real arcs; Béziers are flattened with a proper chord-distance flatness test (10 µm, `flatCubic`; quadratics are converted to cubics); `A` arcs via `svgArcToPoints` (with the spec's radius scale-up). Layer = nearest ancestor `<g>`'s `inkscape:label` or `id`.

## 4. Contours, lead-ins, cut order

- **Chaining** (`chainPaths`): open paths are joined end-to-end when endpoints are within `#chainTol` (Avanceret, default 0.1 mm), using a spatial hash. Chains are extended **forwards and backwards**, reversing paths with `revSegs` as needed; joined endpoints are snapped. Output keeps original drawing order (`ord`).
- **Normalization** happens in `rebuildPart()` after layer filtering (so turning off a dimension layer re-zeros the part).
- **Lead-in** (`computeLead`): perpendicular to the start tangent, into the waste — outside for `outer`, inside the hole for `hole` (direction derived from the contour's signed area). Shortened ×0.6 up to 10 times until the point is on the correct side and ≥ ½·length from the contour; falls back to piercing on the contour. Open contours keep the v1 behaviour (backwards along the start tangent). The lead-in is cut as the first `MOVEABS` after the pierce.
- **Cut order** (`orderContours`): a contour can only be cut after all contours inside it (`parent` links) are done → **holes before the outline they sit in, always**, in both modes. "Som tegnet" = drawing order subject to that rule; "Optimer" = nearest next lead-in from the current position.

## 5. Nesting ("04 — Nesting / Plade")

Inputs: sheet X/Y, spacing between parts, edge margin, count (0 = fill), rotation (`free` 0/90/180/270, `flip` 0/180 — keeps grain direction, `none`). Settings are remembered per browser in `localStorage` key `induminati-dxf-nest-v1` (wrapped in try/catch). The whole drawing is treated as **one part** (top-level contours, holes filled). Debounced 200 ms (`scheduleNest`), result cached by `nestParamsKey()`.

Algorithm (`nestCompute`) — raster no-fit + lattice search:
1. Cell size `r = max(maxDim/400, 25 µm)`. For each needed orientation, the rotated part's top-level outline is rasterized (`rasterFoot`: scanline fill + edge sampling, as per-row interval lists) and dilated by a disk of `k = ceil(spacing/(2r) + 1.5)` cells (conservative: the real gap ends up ~0.5–1 mm above the requested spacing for 100 mm parts).
2. `nfp(A,B)` builds a collision bitmap over all relative offsets from interval overlaps (difference arrays per dy).
3. Shapes: single orientations (0°, and 90° if free) plus **pairs** (0°+180°, 90°+270°) where B's offset minimizes the pair's bbox — this is what lets L/T/triangle parts interlock.
4. `latticeCands`: for each shape and both directions (rows / columns), `a` = shortest collision-free step, then for each row shift `bx` the smallest row height `by` with no collision against any lattice point → candidate lattices (staggered rows give hex packing for circles).
5. `placeLattice` lays every candidate on the sheet (each member of a pair placed individually if it fits) and the one with most parts wins (tie → smallest used bbox; with a count N, the first N in row order).
6. `checkGaps` re-measures the real min distance between neighbouring outlines (exact flattened geometry) — shown as an error if below the requested spacing.
7. `serpentine` orders the parts row by row, alternating direction; within each part `orderContours` applies (holes first).

With nesting, the outer-contour lead-in is capped at 80 % of the spacing so the pierce never lands in a neighbour (shown as a note).

## 6. UI / output

- Left panel: 01 file drop, 02 settings (unit, arc mode, cut order, lead-in), 03 manual shape ("Brug emne & generer" loads the shape and generates immediately), 04 nesting, "Fundet geometri" (part size, contour counts outer/hole/open, source entity badges, **layer checkboxes** when >1 layer), "Maskine & avanceret" (`<details>`: VEL, FASTVEL, pressure, start WAIT, material, chain tolerance — defaults 50000/166000/3800/1000/"POM/Standard/5.000"), log, file name + generate/download.
- Canvas: Y-up, DPR-sharp, pointer pan, wheel zoom at cursor, +/− zoom about the center, fit. Draws sheet + margin (when nesting), contours by kind (outer `#0B4F79`, hole `#1C7FBF`, open `#9A6B00`), lead-ins orange, pierce dots green, dashed rapid moves, sequence numbers when ≤ 60 pierces.
- `generateNCP(silent)`: header unchanged from v1 (`IMF_PBL_v1.0`, `;FILE`, `;MATR`, `;DRAWING`, `;DATE`, `;PRESSURE`, `FASTVEL`, `VEL`, `;Valgte dyser : TOOL:1`), then per pierce `;N{10+i}` → `FASTABS` lead-in → `WAIT 10` / `SETPORT A4=00000001` / `WAIT 10` / `WAIT {startWait}` → `MOVEABS` to contour start → moves/arcs → `WAIT 10` / `SETPORT A4=00000000` / `WAIT 10` / `WAIT 200`; `PROGEND`. Zero-length moves after rounding are skipped. Segmented arc mode splits **all** arcs (incl. former polyline bulges) into chords. Once generated, the NCP is regenerated silently whenever settings/geometry change (`ncpWanted`).
- NCP preview highlights only the first 5000 lines (huge nesting files made the DOM take >10 s); the download is always complete. Download = CRLF, ISO-8859-1 (chars > 255 → `?`).

## 7. Known historical bugs (fixed in v2.0 — don't reintroduce)

- **Reversed arcs became straight lines.** v1 chained entity *command lists* and reversed them by reversing the list; the arc command lost its start and was dropped by `slice(1)`, so any ARC/bulge that had to be run backwards to join a contour was cut as a straight chord. Now segments carry both endpoints and `revSeg` flips direction.
- **Hole lead-ins pierced the part.** v1 placed the lead-in backwards along the start tangent; for a hole that point lies in the part material. Now perpendicular into the waste, side chosen from area sign + outer/hole.
- **Holes could be cut after the outline** in "Optimer" mode (part drops/moves before its holes are cut). Now enforced via `parent` precedence in both modes.
- **Canvas Y not flipped while arcs were drawn as if it was** → arcs didn't meet lines in the preview and DXF parts looked mirrored. Now one Y-up transform for everything.
- **Bulges ignored in segmented arc mode** (became chords); **SPLINE drawn through control points**; **old-style POLYLINE/VERTEX ignored** (only a 0,0 point was read); **unknown entities silently dropped**; **unit change after load had no effect**; SVG transform lists composed in the wrong order and only one of each type.

## 8. Remaining limitations

- Nesting handles one part type per file (whole drawing = one part); no nesting of small parts inside other parts' holes; rotations only in 90° steps.
- No kerf compensation; no lead-out; start point of a closed contour is where the drawing starts it (circles: rightmost point).
- Arc emission rounds center and endpoints independently to µm (radius mismatch ≤ ~1.5 µm).
- `HATCH`, `TEXT`, `DIMENSION` etc. are not cut (by design — listed in the log). SVG `<use>` is not expanded.

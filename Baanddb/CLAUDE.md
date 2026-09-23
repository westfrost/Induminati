# Baanddb/ — Bånd & Medbringer DB

> Del af en opdelt CLAUDE.md — se `../CLAUDE.md` for fælles konventioner
> (farveskema, header-mønster, versionsfooter, git-workflow, samt et
> overordnet resumé af database-side-mønstret) — de gælder for alle
> værktøjer, denne fil inklusive. **Samlevejledninger**
> (`../Samlevejledninger/CLAUDE.md`) er denne sides "søster" — praktisk
> talt identisk GitHub-sync-arkitektur, bare med andre felt-navne og
> stier; en fejl rettet det ene sted bør efterprøves det andet.

## Purpose

`Baanddb/index.html` is a single self-contained HTML/CSS/JS page implementing a searchable lookup database of belt-welding machine settings ("recipes") for conveyor belts and carriers. Each database entry ties a belt type (`baandtype`) and carrier type (`medbringertype`)/length (`laengde`) to the exact welding-machine parameters (current, welding time, cooling time, squeeze, cylinder, pressure, contact, etc.) that produced a good weld on one of two physical machines. Operators search by belt type, carrier length, or carrier type to find the right recipe before running a job, instead of re-discovering settings by trial and error.

## UI walkthrough

Three top-level pages, switched via `showPage(name)` and the header `nav` buttons (SØG / ALLE POSTER / TILFØJ / REDIGER):

- **SØG (search, default page, `#page-search`)** — hero title + a search bar: a `<select id="searchType">` (Båndtype / Længde (mm) / Medbringertype) and a text `<input id="searchInput">` that fires `doSearch()` on every keystroke (`oninput`). When the query is empty, the "ALLE POSTER" preview (first 5 entries, `renderPreview()`) is shown instead of results. When non-empty, up to 8 scored/sorted results render as cards (`#resultsContainer`).
- **ALLE POSTER (`#page-all`)** — a stats bar (`renderAllTable()`: total posts, unique belt types, unique carrier types) followed by a full data table (13 columns: Maskine, Båndtype, Medbringertype, Længde, Antal, Kontakt, Current, Welding, Cool, Squeeze, Cyl., Pres, Handling) with per-row "Rediger"/"Slet" action buttons calling `editEntry(id)` / `deleteEntry(id)`.
- **TILFØJ / REDIGER (`#page-admin`)** — has its own two-tab sub-navigation via `switchMode()`:
  - **ÉN AD GANGEN (single mode, default)**: a machine-type toggle (STORE HF / LILLE HF, `switchMachine()`), a form grid of fields (see Data model below), GEM POST / ANNULLER buttons (`saveEntry()` / `cancelEdit()`), a "LOKAL BACKUP" box with KOPIÉR JSON / IMPORTÉR JSON buttons (`exportDB()` / `importDB()`), and a collapsible "GITHUB SYNC" panel (`toggleGithubPanel()`) with a password field, PUSH/PULL/TEST buttons, a sync log, and a nested `<details>` "OPSÆT ELLER SKIFT DELT TOKEN" section.
  - **HURTIG-TAST MANGE (bulk mode)**: a spreadsheet-like table (`#bulkTable`) for typing in many **Store HF-only** entries at once, with Tab/Enter/Arrow-key navigation between cells (`bulkKeyDown`), auto-added rows, "+5/+10 RÆKKER", "RENS TABEL", and "GEM ALLE UDFYLDTE RÆKKER" (`saveBulk()`).
- **Edit modal markup** (`#editModal`, `.modal-box`, `#modalFormContainer`) exists in the HTML with ANNULLER/GEM ÆNDRINGER buttons wired to `closeModal()`/`saveModal()` — **but neither function is defined anywhere in the script**. This is dead markup: `editEntry(id)` does NOT open this modal; it instead navigates to the admin page and populates the main single-entry form in place. Any future maintainer clicking a stray reference to this modal should know it's non-functional as-is.

## Store HF vs Lille HF machine modes

The tool supports two physically different welding machines with different parameter sets, unified in one form via `data-machine="store"` / `data-machine="lille"` attributes on `.form-group` divs.

- `switchMachine(type)` (called with `'Store HF'` or `'Lille HF'`) is the central function:
  - Sets `currentMachine` (module-level variable used when saving).
  - Toggles `.active` class on the `machine-tab-store` / `machine-tab-lille` buttons.
  - Shows/hides all elements with `data-machine="store"` (Current, Squeeze, Cylinder, Pres) vs `data-machine="lille"` (Båndbredde, Prewelding) by setting `el.style.display`.
  - Relabels two shared fields dynamically: the "Antal" label becomes "Antal forme" for Lille HF vs "Antal værktøj" for Store HF; the "Cool" label becomes "Cooling time (s)" for Lille HF vs "Cool (s)" for Store HF.
  - **Clears the fields that don't apply to the newly selected machine**: switching to Lille HF clears `f_current, f_squeeze, f_cylinder, f_pres`; switching to Store HF clears `f_baandbredde, f_prewelding`. This prevents stale Store-HF-only values from being silently saved onto a Lille HF entry (or vice versa) after a mode switch.
- `machineBadge(e)` renders the colored badge used in cards/table rows: reads `e.maskine` (defaulting to `'Store HF'` if absent), and applies CSS class `store` (orange, `.machine-badge.store`) or `lille` (blue, `.machine-badge.lille`).
- `editEntry(id)` calls `switchMachine(e.maskine || 'Store HF')` **before** populating field values, so opening an entry for edit automatically flips the form into the correct machine mode (showing/hiding the right fields) before the stored values are written into the inputs — this ordering matters, since populating fields into a not-yet-switched form could leave machine-specific fields display:none while holding stale values, or trigger the clear-on-switch logic and wipe values just set.
- `saveEntry()` always stamps `maskine: currentMachine` via `getFormValues()`, so the currently active machine tab — not the field contents — determines which machine an entry is tagged as.
- Bulk mode (`saveBulk()`) hardcodes `maskine: 'Store HF'` for every row — there is no way to bulk-enter Lille HF entries; the UI explicitly says so ("Denne tabel er kun til Store HF-poster. Brug 'Én ad gangen' for Lille HF.").
- After `saveEntry()` completes, the form resets to `switchMachine('Store HF')` regardless of what was just saved (also true in `cancelEdit()`), so the default/idle state of the admin form is always Store HF.

## Search / match logic

`doSearch()` scores every entry against the query via `scoreEntry(entry, query, type)`, keeps up to the 8 lowest-scoring (best) matches, and sorts ascending by score (lower = better).

- **Text fields (Båndtype / Medbringertype)**: normalized (lowercased, trimmed) via `normalize()`.
  - Exact string equality → `score: 0`, badge `exact` ("EKSAKT", green).
  - Substring match either direction (`val.includes(q) || q.includes(val)`) → `score: 1`, badge `close` ("DELVIS", orange).
  - Otherwise → `score = levenshtein(val, q)` (classic DP edit-distance), badge `near` ("NÆRMEST", blue) — i.e., fuzzy/typo-tolerant fallback with no cutoff (a distance of any size still shows up in the top-8 if nothing better exists).
- **Length field (Længde)**: query parsed as float (comma converted to dot for Danish decimal input). `diff = |entry.laengde - query|`.
  - `diff === 0` → `score:0`, badge `exact`.
  - `diff <= 5` (mm) → badge `close`, label `±Xmm`.
  - `diff > 5` → badge `near`, label `±Xmm` (score is still just `diff`, so more distant lengths simply rank lower, no hard cutoff either).
- Results with `null` score (e.g. non-numeric length query) are filtered out entirely.
- The very first (lowest-score) result additionally gets a `best-match` CSS class (orange left border) regardless of badge, i.e. even a "near" match is visually the "best" if it's top of a bad list.
- Note: there is no maximum-distance threshold anywhere — a query can always return up to 8 "near" matches even if none of them are meaningfully close, since `levenshtein`/`diff` have no ceiling filter, only a top-8-by-score cap.

## Data model

Every entry is a flat JS object in the `db` array. Common fields (both machines):
- `id` — integer, **locally assigned**, not from GitHub/remote in any authoritative sense; see `nextId` below.
- `maskine` — `'Store HF'` or `'Lille HF'` (falls back to `'Store HF'` if missing/undefined in older data).
- `baandtype` — string, required (only hard-required field; enforced in both `saveEntry()` and `saveBulk()`).
- `medbringertype` — string.
- `laengde` — number (mm).
- `antal` — integer (defaults to 1 if unparseable), labeled "Antal værktøj" (Store) or "Antal forme" (Lille).
- `kontakt` — string.
- `welding` — string (kept free-text, e.g. `"45,0s"`, so it round-trips Danish decimal-comma formatting untouched).
- `cool` — string, labeled "Cool (s)" (Store) or "Cooling time (s)" (Lille).
- `bemaerkning` — free-text notes, optional, shown with a 📝 prefix on result cards when present.

Store HF-only fields: `current`, `squeeze`, `cylinder`, `pres`.
Lille HF-only fields: `baandbredde` (belt width, mm, numeric), `prewelding`.

`nextId` is computed at load as `db.length ? Math.max(...db.map(e=>e.id)) + 1 : 1`, and recomputed the same way any time a full remote/imported dataset replaces `db` (`autoLoadFromGithub`, `githubPull`, `importDB`). It is a purely local, in-memory monotonic counter with no coordination between users — two people adding entries locally before pushing/pulling can produce **id collisions**, which is a real risk given the shared-token multi-user model (see Known quirks below).

## Persistence and GitHub sync architecture

- **`localStorage['baanddb_v1']`** (`DB_KEY`) holds the JSON-serialized working `db` array — read via `loadDB()` (falls back to a 1-entry `SEED` array if missing/corrupt) and written via `saveDB(db)` after every local mutation (save/delete/import/bulk-save/pull).
- **GitHub sync uses one shared, encrypted token — not individual PATs per user.** The design intent (per in-code comments and the on-page "Sådan virker det" note) is that operators don't need to generate their own GitHub Personal Access Token on every PC; instead one real token is generated once by an admin and stored, encrypted, inside the repo itself.
  - **Setup (`setupSharedToken()`)**: an admin pastes a real GitHub PAT (`gh_setup_token`, Contents: Read & Write scope) plus a new shared password (`gh_setup_password`/`gh_setup_password2`, must match). The function calls `encryptToken(token, password)`, then PUTs the resulting encrypted blob to the repo file `Baanddb/gh-auth.json` (`AUTH_PATH`) via the GitHub Contents API, authenticated with that same raw token (used once, then discarded from memory/inputs — the plaintext token is never itself persisted anywhere, only its ciphertext lives in the repo). After success it also saves the new password locally for the admin's own convenience via `saveGhPassword()`.
  - **Encryption primitives** (Web Crypto API, all in the `---- Password-based shared-token encryption ----` section):
    - `deriveAesKey(password, saltB64, iterations)` — PBKDF2-SHA256 with `KDF_ITERATIONS = 300000`, deriving a 256-bit AES-GCM key from the password + a salt (random 16 bytes on encrypt, or the stored salt on decrypt).
    - `encryptToken(token, password)` — derives a fresh key+salt, generates a random 12-byte IV, AES-GCM-encrypts the token, and returns `{ salt, iv, iterations, ciphertext }` all base64-encoded (`bufToB64`/`b64ToBuf` helpers) — this is exactly the JSON shape written to `gh-auth.json`.
    - `decryptToken(blob, password)` — re-derives the key using the blob's stored salt/iterations, decrypts with the blob's IV; throws (caught and rethrown as "Forkert adgangskode.") on any AES-GCM auth-tag mismatch, which is how a wrong password is detected (AES-GCM decryption fails cleanly rather than silently producing garbage).
    - `resolveToken(password)` — the "unlock" entry point: fetches the current `gh-auth.json` via the **public raw URL** (`rawGithubUrl` against `AUTH_PATH`, no auth needed since the repo is public), then calls `decryptToken`. Throws a Danish error if no shared token has been set up yet, or if the password is wrong.
  - **The shared password itself is never transmitted or stored remotely** — it only ever exists in the browser: typed into `#gh_password`, optionally cached in `localStorage['baanddb_gh_password']` (`GH_PASSWORD_KEY`, via `saveGhPassword()`/`loadGhPassword()`/`applyGhPassword()` on page load) purely as a local convenience so the user doesn't retype it every visit, and used only to locally derive the AES key that decrypts the token already sitting in the repo. The page's own explicit warning (`.gh-note`) states the repo is public so the encrypted blob is visible to anyone — security rests entirely on password strength/secrecy, not on the blob being hidden.
- **Pull priority**: every pull path (`autoLoadFromGithub`, `githubPull`) tries the **public raw GitHub URL first** (`rawGithubUrl()` → `https://raw.githubusercontent.com/{user}/{repo}/main/{path}`, cache-busted with `?t=timestamp`), which needs no password since the repo is public. Only if that fails (non-OK response) does it fall back to the authenticated Contents API (`GET .../contents/{path}` with `Authorization: Bearer {token}`), which requires resolving the shared token via `resolveToken(password)` — so pull only ever needs a password when the raw URL is unreachable (e.g., transient CDN/cache issue) and a password is available.
- **Push always requires the shared token** — `githubPush()` unconditionally calls `resolveToken(password)` first; there is no unauthenticated push path (correct, since GitHub's Contents API write endpoint requires auth). It then fetches the current file SHA (`getFileSha`, needed for GitHub's optimistic-concurrency PUT), base64-encodes the pretty-printed `db` JSON (`unescape(encodeURIComponent(...))` trick to safely btoa non-Latin1 chars, e.g. Danish æøå in `bemaerkning`), and PUTs it to the Contents API with a commit message stamped with entry count and a Danish-locale timestamp.
- **`autoLoadFromGithub()`** runs once automatically at the bottom of the script on every page load (unconditionally, not gated on any explicit user action), immediately after `renderPreview()` and `applyGhPassword()`, before `switchMachine('Store HF')`. It shows a spinner status in the header (`setSyncStatus`), tries the public raw URL, falls back to the authenticated API only if a password happens to already be cached in localStorage, and if both fail, silently falls back to whatever is already in `localStorage`/`db` ("Bruger lokal cache") — network/parse errors are swallowed (caught, not surfaced as page errors) so a fully offline user still gets a usable page with stale local data.

## `localDirty` and `deletedIds` (tombstones) — the two-bug fix

This mechanism exists specifically to stop background/auto pulls from silently discarding a user's own unpushed local edits, and to stop a stale/cached remote pull from resurrecting something the user just deleted. The two mechanisms are independent but interact at the same gate.

- **`localDirty`** (in-memory var `localDirty`, backed by `localStorage['baanddb_local_dirty']` = `LOCAL_DIRTY_KEY`):
  - `loadLocalDirty()` reads it as boolean (`=== '1'`) at page load into the module-level `localDirty` var.
  - `setLocalDirty(val)` is the only way it's ever changed: sets the in-memory flag AND persists it (`localStorage.setItem` on true / `removeItem` on false) in the same call — this dual persistence was itself the bugfix noted in-code: an in-memory-only flag didn't survive a page reload, so a user could save an edit, reload before pushing, and a fresh auto-load would see no dirty flag and silently clobber the unpushed edit with the old remote copy.
  - **Set to `true`** by every local-mutation path: `saveEntry()` (add/edit), `deleteEntry()`, `importDB()`, `saveBulk()`.
  - **Set to `false`** only after: a successful `githubPush()` (local now matches what's on GitHub), or a successful `githubPull()` — either the raw-URL branch or the authenticated-API fallback branch (both explicitly call `setLocalDirty(false)`), since a pull is itself confirmed by a "Erstat lokal database med data fra GitHub?" `confirm()` dialog, i.e. an intentional, user-acknowledged overwrite.
  - **Checked in `autoLoadFromGithub()` only** (not in manual `githubPull()`, which is already gated by explicit confirm): both the raw-URL success branch and the authenticated-API fallback branch check `if (localDirty)` immediately after parsing the fetched array and **before** applying it — if dirty, the fetch result is discarded entirely (not even tombstone-pruned or merged), a "⚠ Lokale ændringer bevaret (ikke overskrevet)" status is shown, and the function returns without touching `db`/`nextId`/localStorage. This means **while `localDirty` is true, auto-load is a complete no-op on the actual data** — it still makes the network request and could theoretically warn about it, but does no write of any kind, including no tombstone pruning (see below).
- **`deletedIds`** (in-memory `Set`, backed by `localStorage['baanddb_deleted_ids']` = `DELETED_IDS_KEY`, JSON array of ids):
  - `loadDeletedIds()`/`saveDeletedIds()` handle load/persist as a Set ↔ JSON array.
  - `deleteEntry(id)` adds the id to `deletedIds`, persists it, and also calls `setLocalDirty(true)` — both a tombstone and the dirty flag are recorded for a single delete.
  - `applyTombstones(parsed)` is run on every freshly-pulled remote array (in all three pull-adjacent code paths: `autoLoadFromGithub` raw branch, `autoLoadFromGithub` API-fallback branch, and `githubPull`'s equivalent branches) **after** the `localDirty` early-return, i.e. tombstone application only ever happens on data that's actually about to be written into `db`. It does two things in one pass: (1) prunes `deletedIds` down to only ids that still exist in the freshly-fetched `parsed` array (i.e., once the remote itself no longer has an id, there's nothing left to guard against, so the tombstone for it is dropped — this is what keeps the tombstone list from growing unboundedly), persisting the pruned set immediately; (2) returns `parsed` filtered to exclude any entry whose id is still tombstoned, so a stale/CDN-cached raw-URL response (or an out-of-date collaborator's push) that still contains a since-deleted entry cannot resurrect it locally.
- **How they interact**: a pull (auto or manual) is a two-gate process — first `localDirty` decides whether the pull is allowed to write anything at all (if dirty, the whole thing is skipped, tombstone pruning included); only once that gate passes does `applyTombstones()` run on the incoming data to reconcile deletions. This means a tombstone can persist and keep growing for longer than the "remote already caught up" ideal case whenever the user has unpushed local changes sitting around, because pruning is deferred until the next pull that's actually allowed to proceed (i.e. until `localDirty` clears via push, or the user does a manual confirmed pull). This is an accepted tradeoff, not a further bug: correctness (never resurrecting a local delete, never clobbering an unpushed edit) is prioritized over eagerly shrinking the tombstone list.

## Print behavior

None — there is no `@media print` block, no `window.print()` call, and no printer-specific styling anywhere in the file.

## Known quirks / gotchas

- **Dead modal markup**: `#editModal` / `#modalFormContainer` / `closeModal()` / `saveModal()` exist in the HTML but `closeModal`/`saveModal` are never defined in `<script>` — clicking those buttons would throw a `ReferenceError`. `editEntry(id)` bypasses this modal entirely and edits in the main admin-page form instead. Do not assume the modal is functional; either wire it up or remove the dead markup if touching this area.
- **No cross-client id coordination**: `nextId` is a purely local, per-browser monotonic counter. Two people entering new local entries independently (before either pushes) will likely generate colliding `id` values; the next push simply overwrites whichever `db` array is pushed last, and there is no merge — pushing is a full-file overwrite of `Baanddb/database.json`, not a diff/merge. This is consistent with the tombstone design (which assumes a full-replace pull/push model) but means concurrent multi-user editing without frequent push/pull cycles is unsafe.
- **Search has no distance ceiling**: fuzzy ("near") matches via Levenshtein distance or mm-diff have no cutoff — searching for something with zero good matches will still return up to 8 "near" results ranked by whatever distance exists, which could be misleadingly far off and should not be assumed to imply relevance just because it's labeled and colored as a match.
- **Bulk mode is Store HF only**: there's no bulk path for Lille HF; `saveBulk()` hardcodes `maskine: 'Store HF'`.
- **`switchMachine` clears fields as a side effect**: calling `switchMachine()` while a form has values in the "wrong" machine's exclusive fields silently wipes them (by design, to prevent stale cross-machine data), so any future code path that calls `switchMachine()` after populating fields (rather than before, as `editEntry` correctly does) would lose data.
- **`gh_user`/`gh_repo`/`gh_path` hidden inputs are vestigial**: `ghSettings()` returns hardcoded literals (`westfrost`/`Induminati`/`Baanddb/database.json`) rather than reading the hidden `#gh_user`/`#gh_repo`/`#gh_path` inputs present in the DOM — those inputs are labeled "Hidden inputs to satisfy ghSettings reads" in a comment but are not actually read by the current `ghSettings()`; changing them in the DOM would have no effect.
- **Public repo security caveat is explicit and load-bearing**: the encrypted `gh-auth.json` blob is visible to anyone (public repo), so the entire push-access security model rests on the shared password's strength/secrecy — this is called out on-page, not hidden.
- **Auto-load runs unconditionally on every page load** with no toggle to disable it; the only thing that suppresses it from overwriting local data is `localDirty`.

## Current version

Footer at the bottom of the file: **v1.9, dated 14-09-2026** — `<div ...>Bånd &amp; Medbringer DB &middot; v1.9 &middot; 14-09-2026</div>`.

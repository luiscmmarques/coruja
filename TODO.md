# TODO

What is ahead, in order of when. Rejections live at the bottom with their reasons, so they stay rejected for the same reason or get reopened on purpose — not re-argued from scratch.

## Before going live

- [x] **Storage persistence.** `navigator.storage.persist()`, requested only once the shelf holds data — never on an empty first visit, because Firefox prompts and a refusal is remembered. Graftful's `persistence.ts` is the model. Without it the browser may evict the family's shelf under storage pressure, silently.
- [ ] ~~iOS icons~~ **(superseded, see above)** `apple-touch-icon.png` (iOS ignores manifest icons; without an opaque PNG the home-screen icon renders on black) and `favicon.ico` (requested unconditionally; every visit logs a 404 without it). Needs a raster step — Playwright like Graftful's `npm run icons`.
- [ ] **Real-device camera test.** `BarcodeDetector` on an actual Android/iPhone, and the zxing-wasm fallback on Safari — the wasm path has never run outside a desktop browser.
- [ ] Register `coruja.app` at Cloudflare Registrar; set up `hi@coruja.app` and the `hi+openlibrary@` alias promised in `lookup.ts`.
- [ ] GitHub repository; point `README` support text at real issue links once they exist.
- [ ] EUIPO eSearch and Swissreg trademark checks for "coruja" (started, not concluded).

## v1.x

- [ ] **Install-prompt screenshots.** Chrome shows a richer install dialogue with one `wide` and one narrow screenshot in the manifest, and warns without them. Waiting on purpose: a screenshot of an empty first-run shelf sells nothing, so this lands together with a small demo-data seed and a Playwright script (Graftful's `npm run screenshots` is the model). Install works fine without them.

- [ ] **Offline e2e suite.** Playwright, killing the origin rather than `context.setOffline` — emulated offline cannot see what the service worker actually serves. Graftful's suite is the model.
- [ ] **Cloudflare Worker lookup proxy** (`/isbn/:isbn`). Hides the reader's address from Open Library, caches popular books at the edge, and owns its headers — which is where the `User-Agent: CorujaApp (hi+openlibrary@coruja.app)` etiquette goes, since Open Library's CORS rejects that header from a browser (verified live). Costs the purely-static property; needs rate-limiting before it is public.
- [ ] **Refresh a book from Open Library.** The stored `olKey` names the exact edition record, so a refresh cannot land on a different edition. A quiet button in the edit dialog; `editedByHand` still wins.
- [ ] **Portuguese.** The app is named in it. English defines the type, so it is one catalogue file and the manifest `lang` question again.

## v2 candidates

Where the concept extends without deviating — each of these is still a child and a book:

- [ ] **Comics, manga, bande dessinée.** Already work today (they have ISBNs, they are books); worth making explicit rather than accidental. For a bilingual child in a French-speaking context, BD is arguably the best gateway to independent reading. Maybe a `format` field on `Book`; nothing more.
- [ ] **Audiobooks.** Still books, still ISBNs, still "she finished a story". Fits the mission exactly.
- [ ] **Borrowed books.** Library books are a big share of a child's reading and currently pollute the "household inventory" claim. A `borrowed` flag, small and honest — and it opens "return by" as a fact, never a nag.
- [x] **Google Books as a second source** — shipped in v1.1, but not as the bring-your-own-API-key Setup field once imagined here (superseded: a parent was never going to procure a Google API key). The app's own referrer-restricted key is baked in at build time (DEPLOY.md), Google is asked only when Open Library falls short, and it is opt-in in Setup because the privacy story changes. See PLAN.md.
- [ ] **Share a book with a friend — adult profiles only.** The `Reader.adult` flag (checkbox in the profile, defined as 16-or-older in its label) gates every outward-facing affordance: Share and the future “Get this book” link are simply not rendered for a child's profile, so the kid-safe version is the absence of the feature, not a warning on it. Web Share API on the book card: a short message naming the book and coruja.app, plus an Open Library link, composed without any reader's name. No request leaves the app (the OS share sheet does the sending), so the privacy page is untouched; guardrail #10 forbids feeds and automatic publishing, not a child deliberately telling a friend about a book. Word-of-mouth for reading itself, and for the app.
- [ ] **"Get this book" affiliate link, in-app.** A modest way to sustain a free app, and legitimate: coruja is not Graftful — no medical data, and the privacy posture is disclosed trade-offs, not zero. The placement is forced by Amazon's own rules, not by ethics: Associates ToS requires Special Links to be accessed directly from the approved Site — email and private messages are prohibited placements — so the link lives on the book card at coruja.app and NEVER in the share message (that placement closes Associates accounts). Needs: the required disclosure line, one honest sentence on the Privacy page, marketplace routing (families here buy on amazon.fr/.de, not .com — OneLink), and a check of Amazon employee policy on Associates enrollment before signing up.
- [ ] **Household view, opt-in.** PLAN.md guardrail #4: comparison between readers defaults off. If it ever exists it is a parent-enabled screen, never the default.

## Coruja Plus (plus.coruja.app): feasibility evaluation, 2026-09-07

A paid sibling with cloud profile storage and extra features, in its own repo, taking free-app features by backport. Evaluated against the code as it ships in v1.

**Verdict: well-positioned, with three cheap preparations worth doing before the fork.**

### What the current architecture already gets right

- **The domain layer is dependency-free** (verified: zero impure imports). Ladder, badges, stats, ISBN, transfer, pin: all of it is shared logic both apps import unchanged. This is the backport currency.
- **Every UI data access goes through `$lib/db`'s exported functions** (verified: zero components import Dexie or touch IndexedDB; the one raw-handle leak in scan was closed during this evaluation with `getBook`). The db module's export list IS the storage interface: ~25 functions. Plus wraps or decorates exactly this seam with a sync engine; nothing above it needs to know.
- **Readings and badges are insert-only by design** (guardrail #3). Append-only logs are the easy case in sync: no conflicts, just union. The hard 20% is confined to the mutable tables (books, readers, collections) and to the few hard deletes.
- **The backup file is a versioned, validated, upgrade-contract-tested wire format.** A first Plus release can sync by shipping this exact envelope to the cloud: crude (whole-profile, last-writer-wins) but correct, private, and already tested.
- **CSP divergence is one config list**: Plus adds `https://api.coruja.app` to `connect-src` in vite.config and nothing else changes.

### Prepare before forking (cheap now, expensive after divergence)

- [ ] **Tombstones instead of hard deletes** for books and collections (`deletedAt` field, filtered everywhere, purged after N days). Without this, a deletion on one device resurrects on the next sync. This is the single biggest sync enabler and is also harmless in the free app. `undoLatestReading` needs the same treatment or an explicit "retraction" event.
- [ ] **Split Settings into device-local vs profile** (locale and activeReaderId are device-local; adultPinHash and lookupEnabled are profile). One interface with two halves; free app stores both locally, Plus syncs only the profile half.
- [ ] **Add `updatedAt` to mutable records** (books, readers, collections), stamped in editBook/editReader/editCollection. Free app ignores it; last-write-wins sync depends on it. Backup format carries it as another optional field: the upgrade contract already proves old files stay importable.

### What Plus builds that free never carries

Account + auth, the sync engine behind the `$lib/db` interface, api.coruja.app, payment. Strongly consider end-to-end encryption of the synced blob: the free app's privacy promise is "no server, nothing leaves"; the Plus promise should be "a server it cannot read", or the brand's privacy story splits in two.

### Repo strategy

Two repos, free as upstream: Plus is a fork carrying `coruja` as a git remote, and backporting is `git merge upstream/main` (single-commit history and the discipline below keep merges clean), not cherry-pick archaeology. Discipline that makes it work: Plus-only code lives in new modules (`src/lib/plus/`), and Plus touches existing files only at the named seams (db interface, vite.config CSP, one account card in Setup, one header affordance). Every shared-file edit belongs upstream in the free app first.

### Licensing note (decide before accepting outside contributions)

The free app is AGPL. As sole copyright holder you can dual-license your own code into a proprietary Plus freely. That freedom ends the day an external contribution is merged without a CLA: from then on, that contributor's AGPL terms bind Plus too. Either take a lightweight CLA from day one, or keep Plus's use of the free codebase at arm's length (only code you authored).

### Guardrails check

Cloud storage does not violate "nothing is shared outward" if it stays a private family profile: sync is the same family on more devices, not an audience. The guardrails travel with the domain layer into Plus unchanged. plus.coruja.app needs its own privacy page; the free app's stays exactly as strict as it is.

## Rejected

- **Movies and other media inside coruja.** Rejected 2026-09. Not for the code — `Book`→`Item` is two days — but for three compounding reasons: the mark _is_ a book (asymmetric V = open book, rings = pages; the identity becomes decoration); movie lookup breaks the keyless zero-config model (TMDB/OMDb need keys, and a DVD's EAN maps to a retail SKU, not a canonical film); and decisively, **the mission inverts** — coruja's gamification exists to make a child want to read more, and the same ladder applied to films rewards screen time, the thing parents of an eight-year-old are trying to limit. A badge for twenty movies is an anti-feature wearing the same clothes. If a household media inventory is ever wanted, it is a **sibling app** with its own name and mark and _no gamification_ — the Graftful→coruja pattern, not a stretched brand.
- **Client-side analytics.** The CSP blocks third-party scripts by design and the privacy page says "no analytics script" plainly. Usage is read from Cloudflare's edge-side request counts, which exist anyway. Do not enable Cloudflare _Web Analytics_ specifically — it injects a beacon.
- **Streaks, XP decay, time-limited events, reading reminders.** PLAN.md guardrails; listed here so a search for a rejected feature lands somewhere.
- **Open Library `subjects` as genre data.** Noisy, unbounded, English-only regardless of the book's own language.

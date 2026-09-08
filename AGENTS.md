# AGENTS.md

Coruja is a local-first PWA that helps a family read more: a reading tracker for children and a book inventory for the household. Scan a book, it fills itself in; finishing books climbs a twenty-rung ladder. No account, no server, works offline.

Read `PLAN.md` before proposing a feature. It records the v1 scope, what was deliberately left out, and the guardrails — so the answer stays consistent. `TODO.md` holds what is ahead and, at the bottom, what was rejected with its reasons — check both before suggesting something.

## Commands

```sh
npm install
npm run dev        # localhost:5173. Service worker is OFF in dev, on purpose.
npm test           # Vitest. node:assert/strict, not expect().
npm run check      # svelte-check. Must be 0 errors AND 0 warnings.
npm run lint       # Prettier check
npm run format     # Prettier write
npm run build      # static output in build/
npm run preview    # serves the real build — the only way to test offline
npm run marks      # regenerate static/{mark,icon,icon-maskable}.svg from scripts/mark.mjs
npm run lockup     # regenerate static/lockup{,-inverse}.svg
```

Before claiming anything works: `npm run check && npm test && npm run build`. All three, every time. `check` catches things tests do not (it is also the only type-check — vitest strips types without checking them), and the build catches prerendering failures neither of the others sees. Run `npm run format` before finishing.

## Definition of done

A change is not finished when the code works. Two rules are enforced by the pre-commit hook in `.githooks/` (installed by `npm install`); the rest is judgement this section exists to standardise.

**No personal data reaches the repository — ever.** The users of this app are a family, including a child, and the repository is public. The hook blocks exported shelves (`coruja-backup*.json` and anything carrying the `"app": "coruja"` envelope), `.env` files, HAR captures, and any term listed in the gitignored `.private-words` (copy `.private-words.example` once per clone and put the family's names in it). Test fixtures use invented people — `transfer.test.ts` is the model. Screenshots for the README or the store must be taken on the example data, never on a real shelf. If the hook fires falsely, `--no-verify` and say why in the commit message.

**A new feature revisits the documentation.** The hook refuses new files under `src/` when no `.md` changed, because a stale PLAN.md is how the guardrails stop being enforced. The checklist:

- `PLAN.md` — scope changed? A mechanism added or a decision reversed? Record it, including what was rejected.
- `AGENTS.md` (this file) — a new invariant, or a trap that cost time? Add it while it is fresh.
- **Privacy page** — did any request change? It must be updated in the same change, not later.
- `STACK.md` — new dependency or tool? Its reason goes in the table.
- `README.md` — would a person browsing the repo care?

If nothing truly needs updating, `CORUJA_SKIP_DOCS=1 git commit` says so explicitly — the override is the record that you considered it.

Prose is not hard-wrapped — not in markdown (`proseWrap: 'never'`) and not in code comments. One line per paragraph; the editor soft-wraps. Lists, tables and aligned columns keep their line breaks.

## The rule this app inverts, and its limits

Coruja's sibling project Graftful forbids gamification outright — right for people managing a lifelong condition, wrong for a seven-year-old learning to love books. Coruja celebrates. But the inversion has hard limits, and they are the most important thing in this repository.

**The ten guardrails live in `PLAN.md` (“The guardrails that replace Graftful's ‘no gamification’”) — that list is canonical; this file deliberately does not copy it, because two copies drift.** The shortest summary that still protects a child: nothing can be lost (no breakable streaks, no decay, no revoked badge — there is no code path that removes an `EarnedBadge`), nobody is compared (no sibling rankings by default), and not reading is never an error (no nagging, no red, no missed target).

Push back if asked to break one of these. The failure mode is an app that makes a child feel bad about reading.

## Architecture

```
src/lib/domain/   pure logic. NO framework, NO browser APIs, NO npm dependencies.
src/lib/db/       Dexie schema, reactive stores, the enrichment queue
src/lib/          scanner, lookup, i18n, components
src/routes/       Shelf (/), Scan, Badges, Setup + prerendered About/Privacy/Support
```

`src/lib/domain` imports nothing but itself. It is the regression baseline and must survive a UI rewrite. If a domain function needs the current time, it takes it as an argument (see `shouldRetryLookup`).

There is no Today screen: the shelf is the home, with the reader's ladder and open books at its top. Do not add screens without a reason a child would understand.

## The network boundary

The ISBN lookup (`src/lib/lookup.ts`) is the app's **only** network egress, and the CSP in `vite.config.ts` enforces it: `connect-src` pins exactly the two providers' origins. Adding any request means editing both files and updating the Privacy page — and the CSP is the half that is easy to forget, because everything works in `vite dev` and fails in the built app.

Open Library is primary and is used per its API guidelines: JSON requests are paced to 1/s by a module-level gate in `lookup.ts` (tests must inject a no-op `pace` or the suite sleeps), and covers are requested by OLID where the record supplies one, because ISBN-keyed cover requests are rate-limited (100/IP per 5 min). Google Books fills gaps only: it needs the build-time key (`VITE_GOOGLE_BOOKS_KEY`, one per environment, see DEPLOY.md — absent means the provider does not exist, which is what CI gets) **and** the per-source switch `settings.googleBooksEnabled` (absent means on, the `lookupEnabled` convention). Its referrer-restricted key rides on `_headers` sending `Referrer-Policy: strict-origin-when-cross-origin`; tighten that to `no-referrer` and every Google request answers 403. `editedByHand` wins over any provider, always — a human correction may never be overwritten by a lookup, except the cover, which nobody typed.

## Changing the data model

If you touch any type in `src/lib/domain/types.ts`, the transfer round-trip discipline fires: the fixtures in `transfer.test.ts` are typed `Required<T>`, so the file stops compiling until the new field is in the fixture — proving it survives a backup round trip — and validated in `parseImport`. Do not "fix" the compile error by loosening types. Covers are the standing example of a deliberate omission (re-fetchable, documented in `transfer.ts`).

Dexie schema changes need a new `version()` block in `src/lib/db/index.ts`, never an edit to an existing one.

## Invariants

- **A Book is the physical object; a Reading is one reader's journey through it.** Status is derived from readings, never stored. A re-read is a new row.
- **Badges are insert-only.** `settleBadges` and everything around it may only ever add.
- **Earned badges snapshot their label and emoji at earn time**, so rewording a badge cannot rewrite a child's history.
- **Lookup never blocks.** The book row is created immediately; enrichment is async, queued offline in `pendingLookups`, drained with backoff (`domain/retry.ts` — max 8 attempts, 30 min doubling to 24 h). The backoff exists because its absence got the app rate-limited on day one.
- **The book V in the mark stays asymmetric.** A symmetric V under two round eyes reads as a frown; this was the concrete reason an earlier mark felt scary. See `DESIGN.md`.
- **The mark's geometry lives once, in `scripts/mark.mjs`.** Every SVG is generated; never edit one by hand.

## Traps that have already cost time

- **`$state` values cannot cross into IndexedDB.** A `$state` array or object is a Proxy, and structured clone throws `DataCloneError` on it, at runtime only, with types green. Call `$state.snapshot(...)` (or spread) at the persistence boundary, in the component, before anything reaches a Dexie call.

- **macOS's filesystem is case-insensitive.** `nunito-coruja.json` and `nunito-Coruja.json` are the same file; the second write clobbers the first, silently. Name generated files by role, not by content.
- **`currentColor` only works inlined.** `static/mark.svg` uses it and may only be inlined (`?raw` + `{@html}`); anything loaded as an image (`icon.svg`, favicons) must bake its colour or it renders black.
- **The service worker must guard `self.__WB_MANIFEST`.** Only substituted in a real build; unguarded it throws at module scope and no handler installs.
- **Do not add `unload`/`beforeunload` listeners or serve HTML `Cache-Control: no-store`** — both silently disable bfcache. `src/lib/headers.test.ts` guards the headers side.
- **Aliased imports cannot carry a `.ts` extension.** `$lib/domain/isbn.ts` fails; `./isbn.ts` works.
- **Tests use `node:assert/strict`, not `expect()`**, keeping `src/lib/domain` free of framework imports. And vitest does not type-check — `npm run check` is where the `Required<T>` discipline actually fires.
- **A bare element selector in a layout style block hits more than you meant.** The bottom nav's `nav {}` styles once leaked onto the header's dropdown `<nav>`; scope with classes.

## Style

Prose comments explain _why_, not _what_ — a decision or a trap, not a restatement of the code.

UI copy is warm and playful. The reader is a child of about eight, sometimes with a parent beside her; exclamation marks are welcome where she is being congratulated — finishing a book deserves one. But never guilt, never "you're behind", never a number she failed to reach.

UI copy lives in `src/lib/i18n`, one typed catalogue per language, English defining the type. Five languages ship: English, French, German, Italian and Portuguese (Portugal), with no runtime fallback. A new key must be written in all five or `npm run check` fails. Ladder rungs and badge labels are concrete nouns that survive translation.

Tap targets never below `--tap` (2.75rem) — the primary user is a child. Sizes in `rem` so OS text scaling works. Status is never colour alone.

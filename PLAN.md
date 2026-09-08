# Plan

What v1 is, what it deliberately is not, and the mechanisms that make it work. Nothing here is built yet.

## What it is

A local-first PWA that helps a family read more by making the books they own into a collection worth building. Scan a book, it fills itself in, and reading it moves a reader up a ladder. No account, no server, works offline, and it doubles as the household's book inventory.

The point is **curiosity, not volume**. Every mechanism below is judged against that: does it make a child want to open a book, or does it make them want to make a number go up?

## The core loop

```
find a book  →  scan it  →  it fills itself in  →  say who's reading it
     →  log progress  →  finish  →  ladder moves, maybe a badge
     →  it stays on the family shelf
```

Everything in v1 exists to make one lap of that loop fast, and to make the lap work when the lookup fails, when there is no barcode, and when there is no internet.

## v1 scope

Nine things. If any one of them is missing the app is not useful, and nothing else is in.

1. **Readers.** Family profiles, local only. Name, avatar, colour, and a 16-or-older checkbox (the line is in the label; absent means child, the safe default). Sixteen rather than eighteen deliberately: the family PIN is a child lock a motivated teenager defeats anyway, so the gate protects young children, and sixteen is the upper bound of EU digital-consent ages. The flag gates outward-facing features: anything that leaves the household is simply not rendered on a child's profile. No birthdate is stored — the parent attests, the app never computes an age. Pick who is reading. Archived rather than deleted.
2. **Scan.** Camera to ISBN, fast and forgiving, with three fallbacks so it is never a dead end. **Scanning a book already on the shelf says so** instead of adding a duplicate.
3. **Lookup.** Title, author, page count, cover — fetched when possible, queued when offline, entered by hand when unavailable. Never blocks adding a book.
4. **Shelf.** The inventory. Every book, searchable, filterable by reader and status. This is the half of the app the adults will actually value.
5. **Reading status.** A book is on the shelf, being read, or finished — per reader. Marking a book finished is the progress action.
6. **Ladder.** Books finished, one rung each, twenty rungs. Derived, always visible, never able to go down.
7. **Badges.** A small catalogue, earned permanently, celebrated once. The mark plus an emoji.
8. **Offline.** Works completely after first load. Tested by killing the origin, not asserted.
9. **Backup.** JSON export and import. The only copy of a family's shelf that exists outside one browser profile.

### Deliberately not in v1

Recorded so they can be added on purpose later rather than drifting in.

- Sync between devices, and therefore any account or server-held data.
- Push reminders. If reminders are wanted, a generated `.ics` is the offline-capable, no-server option — the approach Graftful already proved.
- Reading goals and weekly targets. Goals invite failure states, and failure states are what this app must not have. Revisit only with a mechanism that cannot be missed.
- Household leaderboard. See the guardrails: comparing siblings is a product decision, not a default.
- Series and volume tracking, lending, wishlists, stats and charts.
- Cover photography when a book has no barcode. Wanted, but it needs image storage and cropping — a whole feature, not a corner of one.
- Anything that shares outward: no feed, no export to social, no public profile.

## Mechanisms

### The inventory half

Books carry an optional purchase price (the household's own currency, never displayed with a symbol) and a free-text shelf location ("salon, top shelf"), both searchable where it makes sense. Collections are family-defined groupings whose entire visual identity is one emoji from a curated palette of twenty feelings a book can leave you with (the readers' picker owns the animals; collections own the feelings). Created, renamed and deleted in Setup; assigned through one reusable dropdown-with-a-chevron component (`CollectionPicker.svelte`), compact emoji face on every book card, full name face in the edit dialog. Choosing a ✓-marked entry removes the book from that collection: the same control assigns and unassigns. Deleting a collection unthreads it from every book in one transaction; the books stay. A book already read before the app existed can be marked so with its real finish date, which lands in the right year's statistics and settles badges honestly.

The parts with real design in them.

### Scanning degrades in four steps

Never a dead end, and the cheapest path is the default:

1. **Native `BarcodeDetector`** where the browser has it — Chrome and Edge on Android, ChromeOS and macOS. Zero bytes shipped, best battery, best accuracy. Check `getSupportedFormats()` includes `ean_13` rather than trusting the API's presence.
2. **A lazily loaded WASM decoder** for Safari and Firefox, fetched on the _first scan on those browsers only_, then precached so it works offline afterwards. Roughly a megabyte that most Android users never download.
3. **Manual ISBN entry** on a numeric keypad, for a barcode that will not read — creased, shiny, or a library sticker over it.
4. **Full manual entry with no ISBN at all.** Old books, homemade books, gifts. A hand-entered book is a first-class book, equal in every way.

The current app uses `html5-qrcode`, around 360 KB and built primarily for QR. Dropping it for the native detector is the single biggest quality win available on the device most likely to be in a child's hands.

### Lookup never blocks, and never overwrites a correction

- The book row is created **immediately** from the ISBN alone. Enrichment is asynchronous and optional.
- **Open Library first; Google Books fills gaps, opt-in.** Google was the fallback, was removed rather than fixed in v1 — its keyless quota answered `Queries per day: 0` on first real use, so every fallback call was a guaranteed 429 — and returned in v1.1 with what the removal actually lacked: a key. Not bring-your-own (the v2 idea this supersedes — a parent was never going to procure a Google API key): the app's own referrer-restricted key, baked in at build time, one per environment, documented in DEPLOY.md and absent from CI and forks, which then simply run Open-Library-only. Google is asked **only** when Open Library draws a blank or leaves fields empty, so a shelf Open Library covers costs zero Google requests — the quota protection is the call order, not a throttle. On any field both providers answer, Open Library wins, and `editedByHand` beats both. It is opt-in (`settings.googleBooksEnabled`, off by default) because the privacy page's strongest card leans on the provider being a non-profit, and Google is not one. A book neither provider knows is a hand-entered book, which even earns a badge.
- **Open Library is used the way its API guidelines ask** (openlibrary.org/developers/api). Requests are paced to 1 per second by a client-side gate in lookup.ts — the identified tier's 3/s needs a `User-Agent` header Open Library's own CORS preflight rejects from browsers, so the unidentified budget is the budget. Covers are requested by OLID wherever the record supplies one, because ISBN-keyed cover requests are capped at 100 per IP per 5 minutes and a family cataloguing its shelf in one evening genuinely hits that. Every response is cached forever after one fetch (their "cache whenever possible", exceeded), and the Google gap-filler even lowers OL's load: a book it does not know used to burn all eight backoff retries against it and now settles on the first attempt.
- **Language costs a second request, paid deliberately.** Open Library's one-shot data endpoint never reports a language, so the edition record (named by the stored `olKey`) is fetched to fill it — originally rejected as a bad trade, reversed because the household this is for is bilingual, which is what `Book.language` exists for. The `olKey` also enables a future "refresh this book" feature that cannot land on the wrong edition.
- Failures queue in `pendingLookups` and drain when connectivity returns. A book added on a train fills itself in later without anyone revisiting it.
- **`editedByHand` blocks re-enrichment.** Once a human has corrected a title or a page count, no API may overwrite it. A parent who fixes a wrong page count should not find it wrong again next week.
- Covers are fetched once and stored as blobs, so the shelf renders offline.

**The privacy position, stated plainly.** The ISBN lookup is the only thing that ever leaves the device, and it tells that provider "someone at this address looked up this book". Unlike Graftful, that cannot be reduced to zero without giving up auto-fill entirely — so it is disclosed, it can be switched off (`lookupProvider: 'off'`), and the manual path remains fully functional. Nothing else leaves: no analytics, no beacon, no third-party script, no fonts from a CDN.

A Cloudflare Worker proxying `/isbn/:isbn` would hide the reader's address from the provider and edge-cache repeat lookups. It costs the "purely static" property and adds a second deployable, so it is a v1.1 candidate rather than a v1 decision.

### Progress is a status, not a ledger

Simpler than first drafted, on a decision: no minutes, no page-by-page logging. A book, for a given reader, is in exactly one of three states:

| Status     | Meaning                                               |
| ---------- | ----------------------------------------------------- |
| _(none)_   | On the shelf. Inventory only — nobody has started it. |
| `reading`  | This reader has it open.                              |
| `finished` | This reader completed it, with a date.                |

Marking a book finished is the single progress action in the app. The book's page count still matters — it feeds badges — but nobody types page numbers. A re-read is a new `Reading` row with its own dates, so reading it again never overwrites the first time.

Each state change is recorded with a timestamp, so "what did she read in March" stays answerable.

### The ladder: twenty books, one owl getting happier

Level = books finished, capped at 20. No XP, no formula, no curve to tune. A child can hold the whole system in her head: _finish a book, go up one_.

Each rung shows the coruja mark plus an emoji that escalates in delight — the owl starts sleepy and ends among the stars. The mark is the constant; the emoji is the joke. Level names are concrete nouns that survive translation into French.

The count is derived from `finished` rows, never stored — so correcting a mistake (unfinishing a book added by accident) recomputes honestly, and the display simply shows the lower rung again without ceremony or shame. Past 20 books the ladder stays full and the count keeps counting.

### Stats are facts, and two counting rules coexist on purpose

A small "In numbers" section on the Badges page, plus a pages figure on the shelf's ladder card. **Books count distinct titles** — the ladder cannot be climbed by finishing the same thin favourite twenty times, an exploit an eight-year-old will find if it exists. **Pages count every finished reading, re-reads included** — reading a book twice genuinely turned its pages twice, and pages are a fact about reading done, not a reward to game. With more than one reader, a family block adds books on the shelf, distinct books finished by anyone, and household pages. Numbers are never targets and never compared between readers.

### Adult books and the family PIN

A book can be marked as an adult's (checkbox in the edit dialog, visible only to adult profiles). For a child's profile such a book is **absent, not labelled** — gone from the list, the search, the counts and the language chips alike, because a label would be an invitation. The lock that makes this mean something is the family PIN: with one set, switching to a 16+ profile asks for it, and so does granting 16+ to any profile, at creation or by edit. Otherwise a child ticks the box on her own profile and walks around the whole gate. Removing 16+ asks nothing; de-escalation needs no lock. Profiles marked 16-or-older carry a small moon in the switcher and in Setup: owls and grown-ups are the ones still up after bedtime, it needs no translation, and no moon exists among the animal avatars so it cannot be mistaken for one. The full label rides on the tooltip; a child's row stays the plain one. Honestly named a child lock — the threat model is a curious eight-year-old with the family phone, not an attacker — but the PIN is stored as a salted hash anyway, because backups are files people email themselves and family PINs are often door codes reused from real life.

### Badges are the mark plus an emoji

Same visual system as the ladder: the coruja mark wearing an emoji, nothing custom-drawn per badge. Earned permanently, snapshotted at earn time.

Kept deliberately small for v1 — volume, breadth, and the one that matters most: **Cataloguer**, earned by hand-adding a book the lookup did not know.

### Awards are permanent and snapshotted

The single most important rule in the app. **Once earned, never revoked** — not if the rule changes, not if the catalogue is rewritten, not if the underlying data is later corrected or deleted. A child who earned a badge keeps it.

Each earned award also stores the **label and tier as they were at the moment it was earned**, so renaming a badge later cannot rewrite a child's history.

| Group       | Awards                                                               |
| ----------- | -------------------------------------------------------------------- |
| First steps | First Book · **Cataloguer**                                          |
| Volume      | 5 · 10 · 25 · 50 · 100 books finished                                |
| Pages       | 1 000 · 10 000 · 50 000 pages                                        |
| Breadth     | Five Authors · Two Tongues, Polyglot (three languages) · Five Genres |
| Habit       | Full Week · Steady Month · Twelve Moons                              |
| Long haul   | Doorstop (400+ pages) · Second Chance (finish one you had stopped)   |
| Household   | Passed It On · Family Shelf (100 books)                              |

**Cataloguer** is the interesting one: it is earned by adding a book the lookup did not know, by hand. It takes the app's worst moment — the scan failed, now do data entry — and makes it the thing that earns a badge. Children who like completeness will start hunting for books the internet has never heard of, which is exactly the behaviour worth having.

### The guardrails that replace Graftful's "no gamification"

Graftful's `AGENTS.md` forbids gamification outright: _"No exclamation marks, no gamification, no streaks, no cheerfulness."_ That is right for someone managing a lifelong condition and wrong here. Coruja inverts it — so the inversion needs limits, or it becomes the thing that makes a child feel bad about reading.

1. **No streak that can break.** No habit mechanic exists at all in v1 (decision #4 below); if one ever does, it may fill up but may never be lost. Never a broken flame, never "you lost your streak".
2. **No progress loss. No decay. No expiry.** The ladder is a count of finished books, derived, never docked.
3. **No badge is ever revoked**, for any reason. There is deliberately no code path that removes an `EarnedBadge`.
4. **No comparison between readers** unless explicitly switched on, and it defaults off. Facts about the household's books ("she is reading this one") are fine; counts and rankings between siblings are not.
5. **No time-limited events.** Nothing that punishes a family for being on holiday.
6. **No nagging.** No notification says "you haven't read today".
7. **No red states on reading activity.** `--alert` is for validation errors and destructive actions only. Not reading is not an error.
8. **Short books must be worth finishing.** The ladder counts books, not pages, on purpose: a 30-page picture book and a 300-page novel are each one rung.
9. **Correcting data must never cost a level or a badge.** Un-finishing recounts the ladder quietly; badges stay.
10. **Nothing is shared outward.** No feed, no profile, no export to social.

## Screens

Four, plus prerendered content pages. There is no separate "Today" screen: for a books app the shelf _is_ the home — the reader's ladder and open books sit at the top of it, and the inventory below. One screen fewer to build, translate and explain, which suits a deliberately lightweight app.

| Route | What it is for |
| --- | --- |
| `/` **Shelf** | Home. The active reader and her ladder, the books open now, then the whole inventory: search, filters, every book the household owns. |
| `/scan` | Full-bleed camera. Its own route so it can be a home-screen shortcut and the child can go straight to it. |
| `/badges` | Badges earned, the ones waiting, the ladder in full. |
| `/setup` | Readers, backup and restore, lookup switch, language. |

Prerendered: `/about`, `/privacy`, `/support`.

Bottom navigation stays visible: **Shelf · Scan · Badges · Setup**, with Scan given extra prominence, because it is the action a child comes to the app to perform. The header carries the lockup, the reader switcher and the burger menu for the content pages — nothing else.

## Decisions

Settled with the person this is for (she is almost eight, reads alone and is read to — the app belongs to whoever is doing the reading):

1. **No minutes, no page logging.** Reading is tracked by status — shelf, reading, finished. Simple enough for a seven-year-old to own.
2. **The ladder is twenty books.** One rung per finished book, the owl plus an emoji per rung, no XP formula. Past twenty the ladder stays full and the count keeps counting.
3. **Badges reuse the same visual system** — mark plus emoji — rather than custom art per badge.
4. **No streaks of any kind.** Not even the soft weekly shape from the first draft.
5. **Household view: not in v1.** The shelf is shared; comparison is not.
6. **Languages: five, all complete at launch.** English defines the type; French, German, Italian and Portuguese (Portugal) each satisfy it or the build fails. Portuguese matters doubly: the app is named in it.
7. **Worker proxy: v1.1.** v1 stays purely static.
8. **Duplicate detection is in:** scanning an ISBN already on the shelf shows the existing book instead of adding it twice.

## What comes next

In order, once the questions above are settled:

1. `STACK.md` — the tech decisions and their reasons.
2. `SCHEMA.md` — the typed data model, the Dexie schema, and the invariants that must not be broken.
3. Scaffold, then the domain layer with its tests, before any UI.

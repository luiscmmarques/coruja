# coruja

A family reading tracker and book inventory that lives in your browser. Scan a book, it fills itself in, and finishing it climbs a ladder: twenty books from Nest to Night Sky. Free, no account, works offline.

**Coruja** is Portuguese for owl. _Pai coruja_, _mãe coruja_: the parent who cannot stop showing off what their child did.

## What it does

- **Scan** a book's barcode and the title, author, cover, publisher and language arrive from [Open Library](https://openlibrary.org), with Google Books filling the gaps if you opt in. No camera, no barcode, no connection? Type it in. A hand-entered book is a first-class book, and one the internet has never heard of earns a badge.
- **The shelf** is the household's book inventory: searchable, filterable by status and language, sortable by recently added, recently read, or title.
- **Readers** are family profiles on one device. Each has their own ladder and badges; the shelf shows who has which book open.
- **Everything stays on the device.** The ISBN lookup is the only network request the app makes, it is disclosed in [Privacy](src/routes/privacy/+page.svelte), and it can be switched off. Backup is a JSON file you keep yourself.

## Development

```sh
npm install
npm run dev        # develop
npm run check      # svelte-check, the lint gate
npm test           # vitest
npm run build      # production build into build/
npm run preview    # serve the real build (test offline against this, not dev)
```

The mark and lockup are generated; geometry lives once in `scripts/mark.mjs`:

```sh
npm run marks      # static/mark.svg, icon.svg, icon-maskable.svg
npm run lockup     # static/lockup.svg, lockup-inverse.svg
```

Design reasoning is in [DESIGN.md](DESIGN.md); product plan and the anti-dark-pattern guardrails are in [PLAN.md](PLAN.md).

## Support it 📚

Coruja is free and will stay free. No paid tier, nothing locked. If it helps your child read more, and reading becomes something she is proud of, that is what it was built for. If you feel like contributing, it goes toward keeping the app alive: the domain, the evenings and weekends it is built in, and a book or two for the little reader it was made for: **[paypal.me/LuisMarquesCH](https://paypal.me/LuisMarquesCH)**. Telling one other family is worth even more, and [adding a missing book to Open Library](https://openlibrary.org) fixes the scan for every family after you.

## Licence

[AGPL-3.0-only](LICENSE).

Copyright (C) 2026 Luis Marques.

AGPL rather than MIT deliberately: the promise that a family's reading history never leaves the device is only worth anything if it can be checked, and a hosted fork that quietly started uploading shelves could not stay closed while doing it. Interface languages: English and French. Typeface in the wordmark: Quicksand ([SIL OFL 1.1](https://openfontlicense.org/)), shipped as outlines only.

Cloudflare is a trademark of Cloudflare, Inc. Open Library and Internet Archive are trademarks of the Internet Archive. PayPal is a trademark of PayPal, Inc. None of them is affiliated with this project; see [STACK.md](STACK.md) for the full attribution note.

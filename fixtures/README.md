# Fixtures

## demo-shelf.json

A complete, importable coruja backup: 100 books across the five languages, three
invented readers (Luna, Mama, Papa), five collections, eighteen months of readings
and the badges those readings genuinely earn (computed by the real badge engine).
Twenty-one books carry real ISBNs verified against Open Library, so covers fill in
after import; the rest are hand-typed manual entries.

Uses: demoing the app, testing import, and load-testing the shelf at 100 books.
Import replaces the current shelf, so export a backup of real data first.

Every name in it is invented. This directory is the one place the pre-commit hook
allows a backup envelope, precisely because nothing in here was ever exported from
a real family's shelf. Keep it that way.

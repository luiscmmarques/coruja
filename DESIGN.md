# Design

What the mark means, why the pieces are the way they are, and the rules that keep them consistent. To regenerate anything: `node scripts/build-marks.mjs` then `node scripts/build-lockup.mjs`. `design/index.html` shows the real generated files.

## The name

**Coruja** is owl in Portuguese — the standard word in Brazil and in Portugal alike, unlike _mocho_, which is narrower and reads as a backless stool to a Brazilian.

The owl earned the job three times over: it has kept company with wisdom since Athena's little owl and still perches on library crests; it is a creature of the night, which is when the best reading happens and why the accent is indigo; and, decisively, **pai coruja** and **mãe coruja** is what Portuguese says for the parent who cannot stop showing off what their child did. The name already contains the reason the app exists, and it means something to the child using it in her own language.

Accepted costs, recorded so nobody relitigates them:

- **Non-lusophones cannot guess the pronunciation.** _ko-ROO-zha._ It is an icon on a home screen, not a word said aloud, so this was judged cheap.
- **`coruja.com`, `.ch`, `.pt`, `.io`, `.dev` were all taken.** `coruja.app` is the canonical home and there is no fallback domain to fight over.
- **Search discoverability is mediocre.** "Coruja" returns an IT consultancy, a design agency and a Portuguese grammar app. The domain is the handle; the name is not an SEO asset.
- **Spanish speakers get nothing from it,** but nothing bad either — which is why _Mocho_ lost, since it means blunt, and a mop in Spain.

## The mark

An owl with its head cocked, looking at an open book. Three elements: two ring eyes, and beneath them a V that is at once the bird's chin and a book seen from the front.

**The tilt is the whole idea.** A level pair of eyes stares. A cocked head asks a question — it is the face a person makes when they are curious, and curiosity rather than volume of pages is what this app is for. Nine degrees: enough to read as deliberate, little enough not to read as a misaligned export.

**The book is asymmetric, and that is load-bearing.** The left page falls further and steeper than the right. A symmetric V centred under two round eyes is read as a mouth, and a downturned mouth is a frown — the symmetric version was described as "a bit scary" in review, and that was the reason. Breaking the symmetry turns the shape from a face part into an object. **Do not tidy it back into a symmetric V.**

**The rings do triple duty:** an owl's facial disc, a page curling, and the two o's the name is full of.

### What it deliberately is not

- **No brow.** Only an upward-arcing brow reads as friendly — angled down toward the centre it is the universal anger signal. Even the friendly version has to be paid for by shrinking the eyes, and it bought less than it cost.
- **No pupils.** They genuinely soften the stare, and they close up below about 48 px. The asymmetric book solved the same problem for free.
- **No ear tufts, spectacles, mortarboard or "wise old owl".** The point was to avoid the stock education owl entirely.
- **Not a whole bird.** No body, no feet, no branch. Three elements is the budget.

### The candidates, and why they lost

Four directions were drawn, then narrowed. Judged at 192, 96, 48 and 32 px and circle-cropped, because small sizes decide it — an icon lives on a home screen, not on a slide. The files are deleted; the reasoning is the part worth keeping.

| Candidate | Why it lost |
| --- | --- |
| Open book as an owl's face, eyes knocked out | Elegant large, but the dome crushed the eye tops at 32 px. |
| Two solid eyes and a beak | Most legible of all, and said nothing whatsoever about books. |
| Bookmark ribbon with a brow and eyes | Three ideas in one silhouette; the circular crop ate the notch, and losing the notch cost both the bookmark and the prize-ribbon readings at once. |
| Ring eyes, level, sharp beak | The survivor's ancestor. Its hole was 30 units — under 2 px at 32 px — so the ring filled in and became a disc. |
| Ring eyes with a brow | Brow fused to the ring tops, and paying for it shrank the eyes from r54 to r42. |
| Ring eyes with pupils | Best at hero sizes, gone by favicon size. |
| Broken rings, forming two C's | An interrupted circle read as punctuation rather than an eye. |
| Symmetric book V | Read as a frown. The direct cause of the mark feeling unfriendly. |
| Wide shallow book V | Read as a smile, which is a different product from a curious one. |

### Constraints any future revision must keep

- Three elements, thick round strokes, no text, no fine interior detail.
- The eye hole stays above 2 px at a 32 px render. `build-marks.mjs` fails the build otherwise.
- Everything stays inside the maskable safe circle. Currently 84% of that budget.
- Legible as one flat colour. No fill-only detail that vanishes when the mark is monochrome.
- The book stays asymmetric.

### Why the tilt is free

Rotation happens about `(256, 256)`, the canvas centre, so no point of the mark moves further from that centre than it already was. The mark is therefore mask-safe at any angle, and re-angling it never requires re-checking. `build-marks.mjs` asserts this rather than trusting the comment.

## The lockup

`static/lockup.svg` holds the mark and the name **as one asset**, with the spacing fixed inside the file.

That is not convenience. Composed live from an SVG beside a text node, the gap depends on the reader's font metrics and the name renders in whatever face they happen to have — so the app header, a link preview and a printed flyer would each look slightly different. One file removes the question.

**The name is outlined into paths, not set as `<text>`.** No font is downloaded, none is shipped, and the file renders identically anywhere an SVG opens: a browser, a print shop's layout tool, a t-shirt printer. Set as text it would silently fall back to a substitute, which is exactly the incoherence a lockup exists to prevent.

### Proportions are referenced to x-height

Not cap height, and not the wordmark's bounding box.

The name is set lowercase, so "coruja" has neither capitals nor ascenders — every letter is an x-height body, with only the j's tittle above and its tail below. The word's own ink therefore cannot say how tall a capital would have been. x-height comes from the font's `OS/2` table instead, which means the mark keeps its size regardless of casing.

Referencing the bounding box would be worse still: the j's descender would decide how large the owl is, making the proportions an accident of which letters the name happens to contain.

| Ratio       | Value | Meaning                        |
| ----------- | ----- | ------------------------------ |
| `MARK_TO_X` | 1.6   | Mark height against x-height   |
| `GAP_TO_X`  | 0.40  | Space between mark and name    |
| `PAD_TO_X`  | 0.14  | Breathing room inside the file |

The gap was originally 0.16 of cap height and was widened by roughly 1.7×. Wide enough to breathe, still tight enough to read as one lockup rather than an icon standing next to a word.

### Rules

- **Minimum size.** Lockup 22 px tall. Mark alone 32 px. Below that the rings stop reading.
- **Clear space** on all sides of at least half the mark's height. The padding inside the file is optical, not clear space.
- **Do not rebuild it.** Never place the mark beside live text, and never retype the name in another font next to the mark.
- **Do not distort, rotate, recolour per element, or add effects.** The mark's own tilt is not a rotation you may adjust.
- **Two colourways only.** `lockup.svg` is `--accent` on light; `lockup-inverse.svg` is white on `--accent`.

### Typeface

**Quicksand Bold**, lowercase, outlined and living only inside the lockup files.

Chosen because it is geometric: the letters are built from near-perfect circles at a single stroke weight, which is how the mark itself is constructed. Set lowercase, the word becomes a row of circles and the ring eyes are the same idea repeated — mark and name read as one object rather than two things placed together.

Rejected: **Nunito Bold**, warmer and humanist and the only face that kerns anything in this word, but its varying stroke weight sat less well against the mark's uniform strokes. **Fredoka SemiBold**, unmistakably for children, and much heavier than the mark's 38-unit strokes — the owl looked thin and unrelated beside it, and the fix would have been thickening the mark, which shrinks the eye holes we had to fight for.

Quicksand is licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/). Only its outlines are used; no font file is distributed with this project. The binaries live in a gitignored `.fonts/`.

**Only six letters are in the repository.** Re-outlining requires re-fetching the font — see `scripts/outline-wordmark.py`.

### On the missing kerning

"coruja" has no kern pairs in Quicksand. This was verified rather than assumed: the GPOS extractor was checked against `AV`, `To` and `LT`, which all kern correctly. The pairs here — `co`, `or`, `ru`, `uj`, `ja` — are straight-sided lowercase combinations the face simply does not kern. If a gap ever looks wrong it is a real gap, and the fix is a hand nudge in `outline-wordmark.py`, not a bug hunt.

### The interface does not get Quicksand

The UI uses the system font stack. Nothing to download, no invisible or shifting text on a slow connection, and type that already matches the phone it is on. The wordmark is a logo; interface copy is text. They are different things.

## Colour

One accent, a warm off-white ground, and three states. Nothing decorative.

| Token           | Value     | Use                                    | Contrast on `--bg` |
| --------------- | --------- | -------------------------------------- | ------------------ |
| `--accent`      | `#4b3f9e` | Mark, wordmark, primary actions, links | 7.79:1             |
| `--accent-soft` | `#eceafa` | Selected and active grounds            | ground only        |
| `--ink`         | `#1a1a1a` | Body text                              | 16.80:1            |
| `--ink-soft`    | `#56545e` | Secondary text                         | 7.17:1             |
| `--bg`          | `#fbfbf9` | Page ground                            | —                  |
| `--surface`     | `#ffffff` | Cards                                  | —                  |
| `--line`        | `#e3e2e8` | Borders and separators                 | —                  |
| `--gold`        | `#8a5a00` | Award and level _text_                 | 5.72:1             |
| `--gold-fill`   | `#f5c451` | Badge and medal _grounds_              | ground only        |
| `--grow`        | `#1f6f4a` | Finished, complete                     | 5.91:1             |
| `--alert`       | `#a32020` | Validation errors                      | 6.60:1             |

**Indigo because an owl is nocturnal** and night is where wonder lives. It is also not the green Graftful uses — these are sibling projects by the same person, not the same product.

**Two golds, deliberately.** `--gold-fill` is a badge or a medal and never carries text; `--gold` is the text-safe version for an award label. Using the bright one for words would fail contrast at precisely the moment a child is being told they achieved something.

**Achievement is gold; identity is indigo.** The badge token — the mark wearing an emoji — is drawn in `--gold` on `--gold-fill`, never in the brand colours: the owl in the header says "this app", the owl on a badge says "you did this", and giving them the same colour made badges read as more logos. Dark gold on the gold ground measures 3.64:1 — above the 3:1 graphics floor, though without much margin: darken `--gold` before ever lightening `--gold-fill`.

**Status is never colour alone.** Every state carries words as well. Colour-blindness is common, and so is a phone in bright sunlight.

Contrast figures are a floor, not a target. The audience is children reading in bad light and adults logging a book at the end of a long day.

## Typography and layout

The interface uses `system-ui, -apple-system, 'Segoe UI', sans-serif`. No webfont.

| Token      | Value            | Meaning                                    |
| ---------- | ---------------- | ------------------------------------------ |
| `--radius` | `0.625rem`       | Corner radius for cards, inputs, buttons   |
| `--tap`    | `2.75rem` / 44px | Minimum tap target on anything interactive |

44 px is the floor for anything tappable, and it matters more here than in most apps: the primary user is a child, and children have worse fine motor control than the adults who design for them. Sizes in `rem` so OS text scaling works.

## Changing any of it

The mark's geometry lives in exactly one place: `scripts/mark.mjs`. Every SVG — the mark, both icons, both lockups — is generated from it.

This is a deliberate divergence from Graftful, whose `DESIGN.md` warns that its mark's coordinates are duplicated across three icon sources plus the lockup builder and that all four must be changed together. That is a drift bug with a documentation workaround. Here, editing `mark.mjs` and running the two build scripts is the whole procedure, and the build fails if the result breaks its own constraints.

Two generated files exist twice, and both copies come from the generators: `mark.svg` and `lockup.svg` land in `static/` (the served brand artifacts) and again in `src/lib/assets/` (the copies the app inlines with `?raw`, because Vite rightly refuses raw imports from the public directory, which sits outside the module graph). Never edit either copy by hand; regenerating writes both.

The rasters (favicon.ico, apple-touch-icon.png, the PNG manifest icons in `static/icons/`) are rendered from the source SVGs with WebKit via `qlmanage`, then sized with ImageMagick. Not with ImageMagick's own SVG renderer, which silently drops the mark and produces a flat indigo square; pixel-sample the output before trusting any regeneration.

Judge the result at 32 px and circle-cropped before deciding it works.

/**
 * Generate every SVG form of the Coruja mark from the one definition in `mark.mjs`.
 *
 *   node scripts/build-marks.mjs
 *
 * Output is committed, so this only needs running when the geometry changes. It also asserts the properties the mark is claimed to have, rather than leaving them as comments that can quietly stop being true:
 *
 *   - the mark stays inside the Android maskable safe circle
 *   - each eye's hole stays wide enough to still read as a ring at 32 px
 *
 * A failing assertion exits non-zero, so this is safe to put in CI later.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	CANVAS,
	EYES,
	EYE_STROKE,
	TILT,
	bounds,
	iconSvg,
	markSvg,
	maskableSvg,
	maxRadius,
	safeRadius
} from './mark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'static');
mkdirSync(outDir, { recursive: true });

const problems = [];

// Mask safety. Rotating about the canvas centre cannot increase any point's distance from it, so this holds at any tilt — but assert it anyway, because the eye positions might not always be where they are today.
const reach = maxRadius();
const safe = safeRadius();
if (reach > safe) {
	problems.push(
		`mark reaches radius ${reach.toFixed(1)}, outside the maskable safe radius ${safe.toFixed(1)}`
	);
}

// Ring legibility. The hole must survive the smallest size we intend to ship the mark at. 32 px against a 512 canvas is a 1:16 reduction; below roughly 2 px of hole the ring fills in and the eye becomes a solid disc — which is a different mark.
const SMALLEST_PX = 32;
const MIN_HOLE_PX = 2;
for (const [i, e] of EYES.entries()) {
	const holePx = ((e.r - EYE_STROKE / 2) * 2 * SMALLEST_PX) / CANVAS;
	if (holePx < MIN_HOLE_PX) {
		problems.push(
			`eye ${i} hole is ${holePx.toFixed(2)}px at ${SMALLEST_PX}px, under the ${MIN_HOLE_PX}px floor`
		);
	}
}

if (problems.length) {
	console.error('Mark geometry failed its own constraints:');
	for (const p of problems) console.error('  - ' + p);
	process.exit(1);
}

const files = {
	'mark.svg': markSvg(),
	'icon.svg': iconSvg(),
	'icon-maskable.svg': maskableSvg()
};

for (const [name, svg] of Object.entries(files)) {
	writeFileSync(join(outDir, name), svg);
}

// The mark is also emitted into src, because the app inlines it (Mark.svelte imports it
// with ?raw) and Vite rightly refuses raw imports from the public directory: static/ is
// served verbatim, outside the module graph. Same bytes, second home, one source.
const assetsDir = join(outDir, '..', 'src', 'lib', 'assets');
mkdirSync(assetsDir, { recursive: true });
writeFileSync(join(assetsDir, 'mark.svg'), files['mark.svg']);

const b = bounds();
const holePx = ((EYES[0].r - EYE_STROKE / 2) * 2 * SMALLEST_PX) / CANVAS;

console.log(`Wrote ${Object.keys(files).length} files to static/`);
console.log(`  tilt          ${TILT}°`);
console.log(`  ink bounds    ${(b.x2 - b.x1).toFixed(1)} × ${(b.y2 - b.y1).toFixed(1)}`);
console.log(
	`  reach / safe  ${reach.toFixed(1)} / ${safe.toFixed(1)}  (${((reach / safe) * 100).toFixed(0)}% of budget)`
);
console.log(`  eye hole      ${holePx.toFixed(2)}px at ${SMALLEST_PX}px render`);

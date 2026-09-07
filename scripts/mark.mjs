/**
 * The Coruja mark — the single source of truth for its geometry.
 *
 * Graftful keeps its mark's coordinates in four places and its DESIGN.md warns you to change all four together. That is a drift bug with a documentation workaround. Here the numbers exist once, in this file, and every SVG is generated from them by `build-marks.mjs`. Nothing downstream is hand-edited.
 *
 * WHAT THE MARK IS
 *
 * An owl with its head cocked, looking at an open book. Three elements and nothing else: two ring eyes, and beneath them a V that is at once the bird's chin and a book seen from the front.
 *
 * The tilt is the idea. A level pair of eyes stares; a cocked head asks a question, which is the face a person makes when they are curious — and curiosity, not volume of pages, is what this app is for.
 *
 * The book is deliberately ASYMMETRIC: the left page falls further and steeper than the right. That is not a stylistic flourish, it is load-bearing. A symmetric V centred under two round eyes is read as a mouth, and a downturned mouth is a frown — the earlier symmetric version read as faintly menacing for exactly this reason. Breaking the symmetry turns the shape from a face part into an object. Do not "tidy" it back into a symmetric V.
 *
 * Also deliberately absent, each having been drawn and rejected:
 *   - A brow. Only an upward-arcing one reads as friendly, and it has to be paid for by
 *     shrinking the eyes, which costs more than it buys.
 *   - Pupils. They soften the stare, and they close up below about 48 px.
 *   - Ear tufts, spectacles, a graduation cap. The whole point was to avoid the stock
 *     education owl.
 */

/**
 * The one colour the mark ships in, and the ground it sits on when inverted.
 *
 * Indigo because an owl is nocturnal and night is where wonder lives, and because it is not the green Graftful already uses — these are sibling projects, not the same product. It clears 7.8:1 against the off-white page ground, comfortably past WCAG AA.
 *
 * Provisional until the palette is settled properly alongside the rest of the design tokens.
 */
export const ACCENT = '#4b3f9e';

/** Degrees. Negative is counter-clockwise: the head tilts to the viewer's left. */
export const TILT = -9;

/** Rotation happens about the icon's own centre, which is why the tilt is free — see below. */
export const PIVOT = { x: 256, y: 256 };

/** The design canvas. Every number in this file is in this coordinate space. */
export const CANVAS = 512;

/**
 * Stroke widths are part of the geometry, not styling: the hole in each eye is `r - w / 2`, and if that lands under about 2 px at the smallest render the ring stops being a ring and becomes a disc. At r54/w38 the hole is 74 units across, which is 4.6 px at a 32 px render. That is the number the first draft got wrong.
 */
export const EYES = [
	{ cx: 170, cy: 206, r: 54 },
	{ cx: 342, cy: 206, r: 54 }
];
export const EYE_STROKE = 38;

/** The open book. Three points, round caps and joins, stroked — never filled. */
export const BOOK = [
	{ x: 150, y: 320 },
	{ x: 248, y: 372 },
	{ x: 364, y: 338 }
];
export const BOOK_STROKE = 42;

/**
 * Android maskable icons guarantee only the central 80% of the canvas: a circle of radius 0.4 × size. Anything outside it may be shaved off by a launcher's mask.
 *
 * `safeRadius()` and `maxRadius()` exist so the build can assert this rather than a comment claiming it. They are also why the tilt costs nothing: rotating about PIVOT — which is the canvas centre — cannot move any point further from that centre, so the mark is mask-safe at any angle and re-angling it never needs re-checking.
 */
export const safeRadius = (canvas = CANVAS) => canvas * 0.4;

const rad = (deg) => (deg * Math.PI) / 180;

/** Rotate a point about PIVOT by TILT. */
export function tiltPoint({ x, y }, deg = TILT, pivot = PIVOT) {
	const c = Math.cos(rad(deg));
	const s = Math.sin(rad(deg));
	const dx = x - pivot.x;
	const dy = y - pivot.y;
	return { x: pivot.x + dx * c - dy * s, y: pivot.y + dx * s + dy * c };
}

/** Distance of the mark's furthest painted point from PIVOT, stroke included. */
export function maxRadius() {
	const reach = [
		...EYES.map((e) => Math.hypot(e.cx - PIVOT.x, e.cy - PIVOT.y) + e.r + EYE_STROKE / 2),
		...BOOK.map((p) => Math.hypot(p.x - PIVOT.x, p.y - PIVOT.y) + BOOK_STROKE / 2)
	];
	return Math.max(...reach);
}

/**
 * Tight bounding box of the tilted mark, stroke included.
 *
 * Rotated circles are still circles, so an eye contributes its rotated centre ± its outer radius. Round caps mean each book vertex contributes ± half the stroke in both axes; the segments between vertices never bulge outside the union of those discs, so vertices alone are exact here.
 */
export function bounds() {
	const boxes = [
		...EYES.map((e) => {
			const c = tiltPoint({ x: e.cx, y: e.cy });
			const R = e.r + EYE_STROKE / 2;
			return { x1: c.x - R, y1: c.y - R, x2: c.x + R, y2: c.y + R };
		}),
		...BOOK.map((p) => {
			const c = tiltPoint(p);
			const R = BOOK_STROKE / 2;
			return { x1: c.x - R, y1: c.y - R, x2: c.x + R, y2: c.y + R };
		})
	];
	return {
		x1: Math.min(...boxes.map((b) => b.x1)),
		y1: Math.min(...boxes.map((b) => b.y1)),
		x2: Math.max(...boxes.map((b) => b.x2)),
		y2: Math.max(...boxes.map((b) => b.y2))
	};
}

const n = (v) => Number(v.toFixed(2));

/**
 * The mark's painted elements, untilted, as SVG source. The caller supplies the tilt transform so the same body can be reused at other angles without regenerating anything.
 */
export function body(colour = 'currentColor') {
	const eyes = EYES.map((e) => `\t\t\t<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" />`).join('\n');
	const book = BOOK.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
	return [
		`\t<g fill="none" stroke="${colour}" stroke-linecap="round" stroke-linejoin="round">`,
		`\t\t<g stroke-width="${EYE_STROKE}">`,
		eyes,
		`\t\t</g>`,
		`\t\t<path d="${book}" stroke-width="${BOOK_STROKE}" />`,
		`\t</g>`
	].join('\n');
}

/** Wrap the body in the tilt, optionally scaled about the canvas centre. */
function tilted(colour, scale = 1) {
	const about = `${PIVOT.x} ${PIVOT.y}`;
	const t =
		scale === 1
			? `rotate(${TILT} ${about})`
			: `rotate(${TILT} ${about}) translate(${n(PIVOT.x * (1 - scale))} ${n(PIVOT.y * (1 - scale))}) scale(${n(scale)})`;
	return `<g transform="${t}">\n${body(colour)}\n</g>`;
}

/**
 * Intrinsic width and height are derived from the viewBox rather than hardcoded square. A non-square viewBox declared as 512×512 does not distort — preserveAspectRatio letterboxes it — but it does give the file phantom empty margins, which is precisely the ambiguity a tightly cropped mark exists to remove.
 */
const doc = (vb, inner, label, comment) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${Math.round(vb.w)}" height="${Math.round(vb.h)}" role="img" aria-label="${label}">\n` +
	`\t<!--\n\t\tGENERATED by scripts/build-marks.mjs from scripts/mark.mjs. Do not edit by hand.\n\n${comment}\n\t-->\n` +
	`${inner}\n</svg>\n`;

const square = { x: 0, y: 0, w: CANVAS, h: CANVAS };

const LABEL = 'Coruja: an owl with its head cocked, looking at an open book';

/** The mark alone, cropped to its own ink. For the header and the lockup. */
export function markSvg() {
	const b = bounds();
	const vb = { x: n(b.x1), y: n(b.y1), w: n(b.x2 - b.x1), h: n(b.y2 - b.y1) };
	return doc(
		vb,
		tilted('currentColor'),
		LABEL,
		`\t\tCropped to the mark's own ink — no padding — so whatever places it decides the spacing.\n` +
			`\t\tThat is what the lockup needs: clear space belongs to the composition, not baked in here.`
	);
}

/**
 * Favicon and the `any` PWA icons. Scaled up, because with no background and no mask there is no reason to hold back margin — the mark should fill the square it is given.
 *
 * The colour is BAKED IN, unlike `mark.svg`. This file is consumed as an image — via `<link rel="icon">` and the web manifest — where there is no inheriting CSS context, so `currentColor` would resolve to its initial value and the icon would silently render black. `currentColor` is only correct for the mark that gets inlined into a component.
 */
export function iconSvg(ink = ACCENT) {
	const b = bounds();
	const pad = 40;
	const scale = Math.min((CANVAS - pad * 2) / (b.x2 - b.x1), (CANVAS - pad * 2) / (b.y2 - b.y1));
	return doc(
		square,
		tilted(ink, scale),
		LABEL,
		`\t\tScaled ${n(scale)}× to leave ${pad} units of padding. Transparent ground.\n\n` +
			`\t\tColour is baked in on purpose: this file is loaded as an image, where currentColor\n` +
			`\t\thas no context to inherit from and would resolve to black.`
	);
}

/**
 * The `maskable` PWA icon. Full-bleed ground, mark left at 1× so it sits well inside the safe circle — some launchers crop harder than the spec promises, and the margin is cheap.
 */
export function maskableSvg(ground = ACCENT, ink = '#ffffff') {
	return doc(
		square,
		`\t<rect width="${CANVAS}" height="${CANVAS}" fill="${ground}" />\n` + tilted(ink),
		LABEL,
		`\t\tFull-bleed ground is required: a maskable icon with transparency gets a launcher's\n` +
			`\t\town backdrop behind it. Mark kept at 1×, reaching radius ${n(maxRadius())} against a safe\n` +
			`\t\tradius of ${n(safeRadius())} — deliberate headroom, not an accident.`
	);
}

/**
 * Camera in, raw EAN-13 strings out. Rungs 1 and 2 of the scanning ladder in PLAN.md; rungs 3 and 4 (manual ISBN, full manual entry) are UI, not this file.
 *
 * ## Framework-free on purpose
 *
 * No Svelte, no stores, no `$lib` imports: a component owns the `<video>` element and the lifecycle, this owns the media stream and the decoder. That keeps the awkward part — permissions, frame pumping, teardown — in one testable place, and means the file can be read without knowing anything about the UI.
 *
 * ## Nothing at module scope touches the DOM
 *
 * Every `navigator`, `document` and `window` access lives inside a function. The module is imported by a prerendered route, so evaluating it under node during `vite build` must be inert. The one top-level statement is an asset URL import, which is a string.
 *
 * ## The ladder, and why the feature check is not `'BarcodeDetector' in window`
 *
 * 1. **Native `BarcodeDetector`** — zero bytes shipped, best battery, best accuracy.
 *    Presence is not support: implementations exist that expose the constructor while supporting only 2D formats, so `getSupportedFormats()` is awaited and `ean_13` looked for by name. A book barcode is EAN-13; anything else here is useless.
 * 2. **zxing-wasm**, imported dynamically on the first scan so Chrome/Android users
 *    never download the ~1 MB decoder. Once fetched the service worker has it cached (`globPatterns` includes `**\/*.wasm`), so the fallback works offline afterwards.
 * 3. Neither available → `onError('no-detector')`, and the UI drops to manual entry.
 *    Never a dead end.
 *
 * ## Two things about the wasm that are easy to get wrong
 *
 * - zxing-wasm defaults to loading its binary from jsDelivr. `connect-src` in
 *   vite.config.ts lists only the two lookup providers, so that fetch is blocked — and a CDN fetch could not be precached anyway, breaking offline. `locateFile` is therefore overridden to the copy Vite emits from our own origin.
 * - Instantiating wasm under a restrictive `script-src` needs `'wasm-unsafe-eval'`.
 *   If the fallback fails on Safari with a CSP error in the console, that directive is the reason, and vite.config.ts is where it belongs.
 */

// from src/app.d.ts. Adding `/// <reference types="vite/client" />` there deletes this line; until then the suppression is cheaper than a global type change from this file.
import zxingWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';

/** A running scanner. Handed back so the component can end it in `onDestroy`. */
export interface ScannerHandle {
	/**
	 * Stops the frame pump and every track on the stream. Idempotent.
	 *
	 * Both halves matter: a live track keeps the camera indicator lit even after the element is gone, which reads to a parent as an app spying on the room.
	 */
	stop(): void;
}

/** Why scanning could not start. Both are recoverable by the UI, neither is a crash. */
export type ScannerErrorKind =
	/** Permission refused, no camera, or the device handed the stream to another app. */
	| 'no-camera'
	/** No usable decoder: no native EAN-13 support and the wasm would not load. */
	| 'no-detector';

/**
 * How often frames are decoded. Four a second is comfortably faster than a human can line a book up, and an order of magnitude cheaper than decoding every frame: the wasm path costs tens of milliseconds per attempt on a mid-range phone.
 */
const FRAME_INTERVAL_MS = 250;

/**
 * Longest edge of the bitmap handed to the wasm decoder. A rear camera happily produces 1920×1080, and decoding that four times a second heats the phone for no gain. Raise it if small barcodes on large pages start missing; lower it if the phone gets warm.
 */
const MAX_DECODE_EDGE = 1024;

/** The one barcode format a book carries, spelled the way each decoder spells it. */
const NATIVE_FORMAT = 'ean_13';
const ZXING_FORMAT = 'EAN-13';

/** The minimum this module needs from the native API, so no global types are declared. */
interface NativeDetector {
	detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}

interface NativeDetectorConstructor {
	new (options?: { formats?: string[] }): NativeDetector;
	getSupportedFormats(): Promise<string[]>;
}

/** A decoder, whichever rung of the ladder it came from. */
interface Decoder {
	/** Every code visible in the current frame. Empty array is the normal answer. */
	read(video: HTMLVideoElement): Promise<string[]>;
	/** Drops anything held between frames. */
	dispose(): void;
}

/**
 * The native detector, or `null` if this browser cannot read a book barcode with it.
 *
 * Construction is inside the `try` deliberately: a browser can advertise the format and still throw on `new`, and either way the answer is the same — use the wasm.
 */
async function nativeDecoder(): Promise<Decoder | null> {
	const ctor = (globalThis as { BarcodeDetector?: NativeDetectorConstructor }).BarcodeDetector;
	if (!ctor) return null;
	try {
		const formats = await ctor.getSupportedFormats();
		if (!formats.includes(NATIVE_FORMAT)) return null;
		const detector = new ctor({ formats: [NATIVE_FORMAT] });
		return {
			async read(video) {
				const found = await detector.detect(video);
				return found.map((code) => code.rawValue);
			},
			dispose() {
				// Nothing held: the native detector reads the element directly, so there is no canvas and no wasm heap to release.
			}
		};
	} catch {
		return null;
	}
}

/**
 * The zxing-wasm decoder, or `null` if the module or its binary would not load — an offline first scan on Safari, or a CSP that has not been updated.
 *
 * The import is dynamic so the decoder is fetched on the browsers that need it and on the scan that needs it, never at page load.
 */
async function wasmDecoder(): Promise<Decoder | null> {
	try {
		const zxing = await import('zxing-wasm/reader');
		// Self-hosted binary, not the library's jsDelivr default — see the header.
		zxing.prepareZXingModule({ overrides: { locateFile: () => zxingWasmUrl } });

		let canvas: HTMLCanvasElement | null = null;
		let context: CanvasRenderingContext2D | null = null;

		return {
			async read(video) {
				const sourceWidth = video.videoWidth;
				const sourceHeight = video.videoHeight;
				if (!sourceWidth || !sourceHeight) return [];

				const scale = Math.min(1, MAX_DECODE_EDGE / Math.max(sourceWidth, sourceHeight));
				const width = Math.round(sourceWidth * scale);
				const height = Math.round(sourceHeight * scale);

				if (!canvas) {
					canvas = document.createElement('canvas');
					// `willReadFrequently` keeps the surface on the CPU; without it every getImageData is a GPU readback, which is the slow path here.
					context = canvas.getContext('2d', { willReadFrequently: true });
				}
				if (!context) return [];
				if (canvas.width !== width || canvas.height !== height) {
					canvas.width = width;
					canvas.height = height;
				}

				context.drawImage(video, 0, 0, width, height);
				const frame = context.getImageData(0, 0, width, height);
				const results = await zxing.readBarcodes(frame, { formats: [ZXING_FORMAT] });
				return results.filter((result) => result.isValid).map((result) => result.text);
			},
			dispose() {
				// Collapsing the canvas releases the backing bitmap immediately rather than whenever the collector notices; a 1024² surface is ~4 MB.
				if (canvas) {
					canvas.width = 0;
					canvas.height = 0;
				}
				canvas = null;
				context = null;
			}
		};
	} catch {
		return null;
	}
}

/**
 * Opens the rear camera, shows it in `video`, and reports every EAN-13 it sees.
 *
 * `onCode` fires on each raw string from each decoded frame, which means the same book arrives several times a second while it sits in front of the lens. That is deliberate: debouncing needs to know whether the code was accepted, whether it duplicates a book already on the shelf, and whether the checksum passes — all of which live in the caller. This file does not validate and does not deduplicate.
 *
 * Never rejects on an expected failure. A refused permission or a browser with no decoder is a state the UI renders, not an exception it catches, so both arrive through `onError` and a handle still comes back so teardown is unconditional.
 */
export async function startScanner(
	video: HTMLVideoElement,
	onCode: (raw: string) => void,
	onError: (kind: ScannerErrorKind) => void
): Promise<ScannerHandle> {
	let stopped = false;
	let stream: MediaStream | null = null;
	let decoder: Decoder | null = null;
	let timer: ReturnType<typeof setInterval> | null = null;
	let frameHandle: number | null = null;

	function stop(): void {
		if (stopped) return;
		stopped = true;
		if (timer !== null) {
			clearInterval(timer);
			timer = null;
		}
		if (frameHandle !== null) {
			// Typed as always present by the DOM lib, absent in Firefox — hence the guard.
			video.cancelVideoFrameCallback?.(frameHandle);
			frameHandle = null;
		}
		decoder?.dispose();
		decoder = null;
		for (const track of stream?.getTracks() ?? []) track.stop();
		stream = null;
		// Detaching after stopping the tracks: the element otherwise holds a reference to a dead stream, and Safari has been known to keep the indicator on for it.
		video.srcObject = null;
	}

	const handle: ScannerHandle = { stop };

	try {
		stream = await navigator.mediaDevices.getUserMedia({
			// `facingMode` rather than `exact`, so a laptop with only a front camera still scans instead of failing: a wrong-facing camera beats no camera.
			video: { facingMode: 'environment' }
		});
	} catch {
		onError('no-camera');
		return handle;
	}

	// The component may have unmounted while the permission prompt was up.
	if (stopped) {
		for (const track of stream.getTracks()) track.stop();
		return handle;
	}

	video.srcObject = stream;
	// Set here as well as in the markup: without both, iOS opens the stream fullscreen and Chrome refuses to autoplay, and either way no frames reach the decoder.
	video.muted = true;
	video.playsInline = true;
	// A rejection is not fatal — some browsers reject the promise yet still render the attached stream — so it is swallowed rather than reported as a camera failure.
	await video.play().catch(() => undefined);

	decoder = (await nativeDecoder()) ?? (await wasmDecoder());
	if (!decoder) {
		// Release the camera before handing the user to the keypad: the light staying on behind a manual-entry form is worse than the failure it replaced.
		stop();
		onError('no-detector');
		return handle;
	}
	if (stopped) return handle;

	let busy = false;
	let lastRun = 0;

	async function tick(): Promise<void> {
		// `busy` drops frames that arrive mid-decode rather than queueing them; a queue under a slow wasm decode grows without bound and the preview stutters.
		if (stopped || busy || !decoder) return;
		busy = true;
		try {
			for (const raw of await decoder.read(video)) {
				if (stopped) return;
				onCode(raw);
			}
		} catch {
			// A single unreadable frame is the common case, not an error worth surfacing: most frames contain no barcode and some contain half of one.
		} finally {
			busy = false;
		}
	}

	// Typed as always present by the DOM lib; Firefox has neither, so it is checked.
	if (typeof video.requestVideoFrameCallback === 'function') {
		// Frame-accurate and paused automatically when the tab is hidden — but it fires at the camera's rate, so the clock gate is what holds decoding to ~4/s.
		const onFrame = (now: number): void => {
			if (stopped) return;
			if (now - lastRun >= FRAME_INTERVAL_MS) {
				lastRun = now;
				void tick();
			}
			frameHandle = video.requestVideoFrameCallback(onFrame);
		};
		frameHandle = video.requestVideoFrameCallback(onFrame);
	} else {
		timer = setInterval(() => void tick(), FRAME_INTERVAL_MS);
	}

	return handle;
}

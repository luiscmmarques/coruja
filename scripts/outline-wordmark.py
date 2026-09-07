#!/usr/bin/env python3
"""Outline a word into SVG path data, once, so no font is ever shipped or downloaded.

    python3 scripts/outline-wordmark.py .fonts/nunito.ttf --weight 700

Writes design/wordmarks/<font>.json holding ready-made path coordinates. The lockup builder
consumes that and nothing else, which is what makes the lockup render identically in a
browser, in a print shop's layout tool, or on a t-shirt printer. Set as SVG <text> it would
fall back to whatever font the viewer happened to have — exactly the incoherence a lockup
exists to prevent.

Only the outlines of seven letters end up in the repository. The font binaries live in
.fonts/, which is gitignored, and are not redistributed. All three candidates are licensed
under the SIL Open Font License 1.1, which permits this.

Kerning comes out of GPOS. These fonts carry no legacy `kern` table and no shaping engine is
installed, so the pair-adjustment lookups are read directly. Without that, `ja` and `ru` sit
visibly loose — advance widths alone are not enough for a wordmark that gets set once and
looked at forever.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer


def resolve_lookups(gpos):
    """Yield every PairPos subtable, following Extension lookups to their targets."""
    for lookup in gpos.table.LookupList.Lookup:
        subtables = list(lookup.SubTable)
        if lookup.LookupType == 9:  # Extension positioning
            subtables = [st.ExtSubTable for st in subtables]
        for st in subtables:
            if getattr(st, "LookupType", None) == 2 or st.__class__.__name__.startswith("PairPos"):
                yield st


def kern_pairs(font, wanted: list[tuple[str, str]]) -> dict[tuple[str, str], int]:
    """Resolve horizontal pair kerning for just the pairs we need.

    Only five pairs occur in "Coruja", so the class matrices are queried per pair rather than
    expanded. Expanding them means building the cross product of two class definitions that
    together cover the whole font, to answer five questions.

    Lookup order is significant: the first lookup that has an opinion about a pair wins, so
    later ones must not overwrite it.
    """
    if "GPOS" not in font or not wanted:
        return {}

    found: dict[tuple[str, str], int] = {}
    for st in resolve_lookups(font["GPOS"]):
        fmt = getattr(st, "Format", None)
        coverage = {g: i for i, g in enumerate(st.Coverage.glyphs)} if st.Coverage else {}

        for pair in wanted:
            if pair in found:
                continue
            left, right = pair
            if left not in coverage:
                continue

            if fmt == 1:
                for record in st.PairSet[coverage[left]].PairValueRecord:
                    if record.SecondGlyph == right:
                        adj = getattr(record.Value1, "XAdvance", 0) or 0
                        if adj:
                            found[pair] = adj
                        break
            elif fmt == 2:
                c1 = st.ClassDef1.classDefs if st.ClassDef1 else {}
                c2 = st.ClassDef2.classDefs if st.ClassDef2 else {}
                i, j = c1.get(left, 0), c2.get(right, 0)
                if i < st.Class1Count and j < st.Class2Count:
                    rec = st.Class1Record[i].Class2Record[j]
                    adj = getattr(rec.Value1, "XAdvance", 0) or 0
                    if adj:
                        found[pair] = adj
    return found


def outline(font_path: Path, text: str, location: dict[str, float]) -> dict:
    font = TTFont(str(font_path))

    if "fvar" in font and location:
        # Pin the variable axes before reading outlines: the default instance of Nunito is
        # ExtraLight, which is not a wordmark weight.
        font = instancer.instantiateVariableFont(font, location, inplace=False, updateFontNames=False)

    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]
    names = []
    for ch in text:
        if ord(ch) not in cmap:
            raise SystemExit(f"{font_path.name} has no glyph for {ch!r}")
        names.append(cmap[ord(ch)])

    kerning = kern_pairs(font, [(names[i - 1], names[i]) for i in range(1, len(names))])

    # Compose left to right. The transform flips Y, because font space is Y-up and SVG is
    # Y-down; baking the flip in here means the emitted path drops straight into an SVG with
    # no wrapper transform to remember.
    parts: list[str] = []
    bounds = BoundsPen(glyphs)
    x = 0
    applied = []
    for i, name in enumerate(names):
        if i:
            adj = kerning.get((names[i - 1], name), 0)
            if adj:
                applied.append(f"{text[i-1]}{text[i]}{adj:+d}")
            x += adj

        pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))
        d = pen.getCommands()
        if d:
            parts.append(d)
        glyphs[name].draw(TransformPen(bounds, (1, 0, 0, -1, x, 0)))
        x += hmtx[name][0]

    x1, y1, x2, y2 = bounds.bounds

    # x-height is the reference the lockup sizes everything against, so it has to come from
    # the font rather than from this word: "coruja" has no capitals and no ascenders, so its
    # own ink says nothing about where x-height sits. OS/2 sxHeight is authoritative when
    # present; the 'x' glyph's own bounding box is the fallback.
    x_height = getattr(font["OS/2"], "sxHeight", None) if "OS/2" in font else None
    if not x_height:
        xb = BoundsPen(glyphs)
        glyphs[cmap[ord("x")]].draw(xb)
        x_height = xb.bounds[3]
    cap_height = getattr(font["OS/2"], "sCapHeight", None) if "OS/2" in font else None

    return {
        "provenance": f"{font_path.stem} at {location or 'default'} (SIL Open Font License 1.1)",
        "note": "Generated by scripts/outline-wordmark.py. Outlines only; no font file is distributed.",
        "text": text,
        "unitsPerEm": upm,
        "xHeight": x_height,
        "capHeight": cap_height,
        "kerningApplied": applied or "none found in GPOS",
        "advanceWidth": x,
        "wordD": " ".join(parts),
        "box": {"x1": round(x1, 2), "y1": round(y1, 2), "x2": round(x2, 2), "y2": round(y2, 2)},
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("font", type=Path)
    ap.add_argument("--text", default="Coruja")
    ap.add_argument("--weight", type=float, default=None)
    ap.add_argument("--width", type=float, default=None)
    ap.add_argument("--out", type=Path, default=None)
    args = ap.parse_args()

    location = {}
    if args.weight is not None:
        location["wght"] = args.weight
    if args.width is not None:
        location["wdth"] = args.width

    data = outline(args.font, args.text, location)

    # The suffix describes the CASING rather than repeating the text, because "coruja" and
    # "Coruja" differ only in case and macOS has a case-insensitive filesystem — naming files
    # after the text made the two silently overwrite each other, and the survivor was whichever
    # ran last.
    style = "lower" if args.text.islower() else "title" if args.text[:1].isupper() else "mixed"
    out = args.out or Path("design/wordmarks") / f"{args.font.stem}-{style}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent="\t") + "\n")

    b = data["box"]
    print(
        f"{args.font.stem:10} {args.text:8} {b['x2'] - b['x1']:7.1f} x {b['y2'] - b['y1']:6.1f}"
        f"   x-height {data['xHeight']}   kerning {data['kerningApplied']}   -> {out.name}"
    )


if __name__ == "__main__":
    main()

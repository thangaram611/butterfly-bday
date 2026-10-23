#!/usr/bin/env python3
"""Turn Codex PNGs from art/raw/ into the site's WebPs (site/img/).

  tools/art.py layer     <raw.png> <name>   crop to the artwork's rows; prints its --top (% of the frame) for index.html
  tools/art.py sprite    <raw.png> <name> [width]   crop to the artwork's box (1024 px wide unless given)
  tools/art.py segments  <raw.png> <name>   the caterpillar cut into its paper pieces, tail first, so the page can bend it
                                             along the vine: writes site/img/<name>/<n>.webp and prints where each one
                                             sits on the body, for js/story.js
  tools/art.py butterfly <raw.png> <name>   centre the body line at exactly 50%; also writes <name>-sm (192 px, for the
                                             small flying ones)
  tools/art.py frames    <name> <raw.png…>  the change's stop-motion frames: lay each one's twig exactly over the chrysalis
                                             drawing's (the last, the empty shell, over the shell of the one before it),
                                             cut the twig off (the page draws one twig under them all), crop them to one
                                             shared box and write site/img/<name>/<n>.webp; prints the box in widths of
                                             the chrysalis sprite, for js/story.js
  tools/art.py tile      <raw.png> <name> [repaired.png]   a tile that repeats down the page without a seam. Without
                                             repaired.png it writes art/raw/<name>-rolled.png, the tile with its seam
                                             moved to the middle, for Codex to repair (art/prompts/foliage-seam.txt).
                                             With it, it puts the repair back over the original's rows, writes
                                             site/img/<name>.webp (repeats seamlessly) and <name>-top.webp (the first
                                             tile, which starts as the art starts), and fails if a seam remains

Setup: python3 -m venv .venv && .venv/bin/pip install pillow numpy   (and cwebp from Homebrew)
"""
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

CHRYSALIS = "art/raw/chrysalis.png"  # the frame the twig sprite was cut from: its box is (21, 25) + 983 wide
TWIG = (25, 300)   # its rows that hold only the twig and its leaves, to register by
CUT = (322, 338)   # the twig sprite ends at 338; each frame fades in over these rows, below the knot
SHELL = (338, 880) # the open shell's rows, from the knot to its widest, above the butterfly's wings


def opaque(im):
    return np.asarray(im)[..., 3] > 8


# The first screen's layers carry most of its weight (PLAN.md's budget), so they're exported at a lower quality, and
# the cut-outs with coarser transparency, which their clean paper edges hide. Everything else: 82, and 90 for alpha.
QUALITY = {"s1-sky": (72, 90), "s1-hills": (72, 40), "s1-wisteria": (75, 40), "s1-meadow": (75, 40), "s1-blossoms": (75, 40),
           "vine": (75, 40)}


def export(im, name, width=1024):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    q, alpha_q = QUALITY.get(name, (82, 90))
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        im.save(tmp.name)
        subprocess.run(["cwebp", "-quiet", "-m", "6", "-q", str(q), "-alpha_q", str(alpha_q), "-alpha_filter", "best", tmp.name,
                        "-o", f"site/img/{name}.webp"], check=True)
    print(f"site/img/{name}.webp {im.width}x{im.height}")


def layer(im, name):
    rows = np.where(opaque(im).any(axis=1))[0]
    y0, y1 = rows[0], rows[-1] + 1
    print(f"--top:{y0 / im.height * 100:.2f}")
    export(im.crop((0, y0, im.width, y1)), name)


def sprite(im, name, width=1024):
    export(im.crop(Image.fromarray(opaque(im)).getbbox()), name, width)


def segments(im, name):
    """Each round body segment is the circle through its top edge; the head, in front, the circle through its edges
    left and right of the body's line (its left one is the darkest pixel, its shadow). Every pixel goes to the
    front-most circle it's in or just outside of (the next segment covers the one before), or else the circle whose
    edge is nearest (the feet, the antennae). Each segment's part hidden under the next is filled in its own paper colour, so a bend
    never shows a hole."""
    im = im.crop(Image.fromarray(opaque(im)).getbbox())
    im = im.resize((1024, round(im.height * 1024 / im.width)), Image.LANCZOS)
    px = np.asarray(im).copy()
    a = px[..., 3] > 128
    top = np.array([np.argmax(c) if c.any() else len(c) for c in a.T])

    def circle(pts):
        x, y = np.array(pts, float).T
        cx, cy, c = np.linalg.lstsq(np.c_[2 * x, 2 * y, np.ones_like(x)], x * x + y * y, rcond=None)[0]
        return cx, cy, np.sqrt(c + cx * cx + cy * cy)
    tail = np.argmax(top < len(a))
    head = tail + 20 + np.argmax(np.diff(top[tail + 20:]) < -40)              # the antennae rise: the head starts here
    hills = [x for x in range(tail + 12, head - 12) if top[x] == top[x - 12:x + 13].max() > max(top[x - 12], top[x + 12])]
    dips = [x for i, x in enumerate(hills) if not i or x - hills[i - 1] > 5]  # where one segment's top meets the next
    edges = [tail] + dips + [head]
    discs = [circle([(x, top[x]) for x in range(l + 6, r - 6)]) for l, r in zip(edges, edges[1:])]
    axis = np.mean([c[1] for c in discs])
    r = np.mean([c[2] for c in discs])
    cx = discs[-1][0]
    lum = px[..., :3].astype(int).sum(-1)
    rows = range(round(axis - 0.6 * r), round(axis + 0.6 * r))
    head = circle([(cx + np.argmin(lum[y, round(cx):round(cx + r)]) + 3, y) for y in rows] + [(np.where(a[y])[0].max(), y) for y in rows])
    circles = discs + [head]

    yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
    d = np.stack([np.hypot(xx - x, yy - y) - rr for x, y, rr in circles])
    inside = d <= 6  # with the thin shadow round each piece's edge
    owner = np.where(inside.any(0), len(circles) - 1 - np.argmax(inside[::-1], 0), np.argmin(d, 0))
    for k, (x, y, rr) in enumerate(circles, 1):
        piece = px.copy()
        piece[..., 3] = np.where((owner == k - 1) & opaque(im), px[..., 3], 0)
        hidden = (d[k - 1] <= 1) & inside[k:].any(0)
        piece[hidden] = [*np.median(px[(owner == k - 1) & (d[k - 1] < -10)][:, :3], 0), 255]
        p = Image.fromarray(piece, "RGBA")
        box = p.getbbox()
        export(p.crop(box), f"{name}/{k}")
        print(f"  {{ at: {x / 1024:.4f}, left: {(box[0] - x) / 1024:.4f}, top: {(box[1] - axis) / 1024:.4f}, width: {(box[2] - box[0]) / 1024:.4f} }},")


def butterfly(im, name):
    a = opaque(im)
    cols, rows = np.where(a.any(axis=0))[0], np.where(a.any(axis=1))[0]
    mid = (cols[0] + cols[-1] + 1) / 2
    half = max(mid - cols[0], cols[-1] + 1 - mid)
    art = im.crop((round(mid - half), rows[0], round(mid + half), rows[-1] + 1))
    export(art, name)
    export(art, f"{name}-sm", 192)  # flying at 64 px at most, three device pixels each


def scaled(im, s, dx, dy, resample=Image.BICUBIC):
    """im scaled by s about its top centre, then moved by (dx, dy)."""
    cx = im.width / 2
    return im.transform(im.size, Image.AFFINE, (1 / s, 0, cx - (cx + dx) / s, 0, 1 / s, -dy / s), resample)


def register(ref, im, rows=TWIG):
    """The scale and shift that lay im over ref: the best overlap of these rows (the twig's, unless given), searched
    coarsely at quarter size, then finely around that."""
    def iou(m, t, rows):
        band = m[rows[0]:rows[1]]
        return (band & t).sum() / max(1, (band | t).sum())
    q, quarter = 4, (rows[0] // 4, rows[1] // 4)
    small = lambda a: Image.fromarray(a.astype(np.uint8) * 255).resize((a.shape[1] // q, a.shape[0] // q), Image.BILINEAR)
    target, f = np.asarray(small(opaque(ref)))[quarter[0]:quarter[1]] > 127, small(opaque(im))
    best = (0, 1, 0, 0)
    for s in np.arange(0.8, 1.201, 0.01):
        m = np.asarray(scaled(f, s, 0, 0, Image.BILINEAR)) > 127
        best = max([best] + [(iou(np.roll(m, (dy, dx), (0, 1)), target, quarter), s, dx * q, dy * q)
                             for dy in range(-20, 21) for dx in range(-20, 21)])
    _, s0, dx0, dy0 = best
    target = opaque(ref)[rows[0]:rows[1]]
    for s in np.arange(s0 - 0.01, s0 + 0.0101, 0.0025):
        m = opaque(scaled(im, s, 0, 0, Image.BILINEAR))
        best = max([best] + [(iou(np.roll(m, (dy, dx), (0, 1)), target, rows), s, dx, dy)
                             for dy in range(dy0 - 4, dy0 + 5) for dx in range(dx0 - 4, dx0 + 5)])
    return best


def frames(name, srcs):
    ref = Image.open(CHRYSALIS).convert("RGBA")
    out = []
    for i, src in enumerate(srcs, 1):
        im = Image.open(src).convert("RGBA").resize(ref.size, Image.LANCZOS)
        # Codex draws the empty shell a little bigger than the shell it was drawn from, so it's laid over that one
        fit, s, dx, dy = register(out[-1], im, SHELL) if i == len(srcs) else register(ref, im)
        print(f"{src}: twig overlap {fit:.3f}, scale {s:.4f}, shift {dx},{dy}")
        px = np.asarray(scaled(im, s, dx, dy)).copy()
        fade = np.clip((np.arange(ref.height) - CUT[0]) / (CUT[1] - CUT[0]), 0, 1)
        px[..., 3] = (px[..., 3] * fade[:, None]).astype(np.uint8)
        out.append(Image.fromarray(px, "RGBA"))
    boxes = [Image.fromarray(opaque(im)).getbbox() for im in out]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    subprocess.run(["mkdir", "-p", f"site/img/{name}"], check=True)
    for i, im in enumerate(out, 1):
        export(im.crop(box), f"{name}/{i}", 768)
    print(f"box: {{ left: {(box[0] - 21) / 983:.4f}, top: {(box[1] - 25) / 983:.4f}, width: {(box[2] - box[0]) / 983:.4f}, "
          f"ratio: {(box[3] - box[1]) / (box[2] - box[0]):.4f} }}")


def seam(im):
    """How much the tile's last row differs from its first, against the roughest 1% of its neighbouring rows."""
    a = np.asarray(im).astype(float)
    a[..., :3] *= a[..., 3:] / 255  # premultiplied, so colour where it's transparent doesn't count
    return np.abs(a[0] - a[-1]).mean(), np.percentile(np.abs(np.diff(a, axis=0)).mean(axis=(1, 2)), 99)


def tile(src, name, repaired=None):
    raw = np.asarray(Image.open(src).convert("RGBA"))
    half = raw.shape[0] // 2
    if not repaired:
        Image.fromarray(np.roll(raw, half, axis=0)).save(f"art/raw/{name}-rolled.png")
        return print(f"art/raw/{name}-rolled.png: seam at row {half}; repair it with Codex, then run again with the result")
    rolled = np.roll(raw, half, axis=0).astype(float)
    fix = np.asarray(Image.open(repaired).convert("RGBA").resize(raw.shape[1::-1], Image.LANCZOS)).astype(float)
    # Codex redraws the whole picture but only reshapes the rows around the seam: take those (and 30 more each side,
    # blended in), matched to the original's colour
    both = (rolled[..., 3] > 200) & (fix[..., 3] > 200)
    fix[..., :3] = np.clip(fix[..., :3] * rolled[both][:, :3].mean(0) / fix[both][:, :3].mean(0), 0, 255)
    changed = np.abs(fix[..., 3] - rolled[..., 3]).mean(axis=1)
    rows = np.where(changed > 3 * np.median(changed))[0]
    rows = rows[np.abs(rows - half) < half // 2]  # the seam's band, not stray rows elsewhere
    y = np.arange(raw.shape[0])[:, None, None]
    w = np.clip(np.minimum(y - (rows.min() - 60), rows.max() + 60 - y) / 30, 0, 1)
    print(f"repair used for rows {rows.min()}–{rows.max()} of the rolled tile, blended over 30 more each side")
    out = np.roll(rolled * (1 - w) + fix * w, -half, axis=0).round().astype(np.uint8)
    # the first tile starts as the original does; its bottom half is the seamless tile's, so it leads into it
    top = np.concatenate([raw[:half], out[half:]])
    e, q = seam(Image.fromarray(out))
    print(f"seam {e:.1f}, roughest 1% of inner rows {q:.1f}")
    if e > q:
        sys.exit("a seam remains")
    export(Image.fromarray(out), name)
    export(Image.fromarray(top), f"{name}-top")


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "frames":
        frames(sys.argv[2], sys.argv[3:])
    elif mode == "tile":
        tile(*sys.argv[2:])
    else:
        src, name, *size = sys.argv[2:]
        {"layer": layer, "sprite": sprite, "segments": segments, "butterfly": butterfly}[mode](Image.open(src).convert("RGBA"), name, *map(int, size))

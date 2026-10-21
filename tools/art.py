#!/usr/bin/env python3
"""Turn Codex PNGs from art/raw/ into the site's WebPs (site/img/).

  tools/art.py layer     <raw.png> <name>   crop to the artwork's rows; prints its --top (% of the frame) for index.html
  tools/art.py sprite    <raw.png> <name>   crop to the artwork's box
  tools/art.py butterfly <raw.png> <name>   centre the body line at exactly 50%; also writes <name>-sm (256 px, for the
                                             small flying ones) and <name>-back, the plain paper silhouette shown
                                             when a wing panel faces away

Setup: python3 -m venv .venv && .venv/bin/pip install pillow numpy   (and cwebp from Homebrew)
"""
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

LILAC = np.array([200, 162, 200])


def opaque(im):
    return np.asarray(im)[..., 3] > 8


def export(im, name, width=1024):
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".png") as tmp:
        im.save(tmp.name)
        subprocess.run(["cwebp", "-quiet", "-q", "82", "-alpha_q", "90", tmp.name, "-o", f"site/img/{name}.webp"], check=True)
    print(f"site/img/{name}.webp {im.width}x{im.height}")


def layer(im, name):
    rows = np.where(opaque(im).any(axis=1))[0]
    y0, y1 = rows[0], rows[-1] + 1
    print(f"--top:{y0 / im.height * 100:.2f}")
    export(im.crop((0, y0, im.width, y1)), name)


def sprite(im, name):
    export(im.crop(Image.fromarray(opaque(im)).getbbox()), name)


def butterfly(im, name):
    a = opaque(im)
    cols, rows = np.where(a.any(axis=0))[0], np.where(a.any(axis=1))[0]
    mid = (cols[0] + cols[-1] + 1) / 2
    half = max(mid - cols[0], cols[-1] + 1 - mid)
    art = im.crop((round(mid - half), rows[0], round(mid + half), rows[-1] + 1))
    export(art, name)
    export(art, f"{name}-sm", 256)
    px = np.asarray(art).astype(float)
    lum = px[..., :3].mean(axis=2, keepdims=True) / 255
    back = np.dstack([LILAC * (0.9 + 0.1 * lum), px[..., 3:]]).clip(0, 255).astype(np.uint8)
    export(Image.fromarray(back, "RGBA"), f"{name}-back")


if __name__ == "__main__":
    mode, src, name = sys.argv[1:4]
    {"layer": layer, "sprite": sprite, "butterfly": butterfly}[mode](Image.open(src).convert("RGBA"), name)

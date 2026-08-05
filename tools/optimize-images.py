#!/usr/bin/env python3
"""
Optimise photos for the DJ Reese site.

Turns any full-size photo into the responsive derivatives the site expects:

    <name>-500.webp   <name>-500.jpg     grid thumbnail
    <name>-1000.webp  <name>-1000.jpg    grid / retina
    <name>-full.webp  <name>-full.jpg    lightbox (capped at 1600px)

USAGE
    python3 tools/optimize-images.py photo1.jpg photo2.png
    python3 tools/optimize-images.py ~/Desktop/new-shots/*.jpg

    # custom output name (single file only)
    python3 tools/optimize-images.py shot.jpg --name reese-spring-break

Requires Pillow:   python3 -m pip install --user Pillow

After running, add the photo in the dashboard (Photos & Video → the image
path field) using the path WITHOUT a size suffix, e.g.

    assets/img/gallery/reese-spring-break

The site appends -500 / -1000 / -full automatically.
"""
import argparse
import os
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is not installed.  Run:  python3 -m pip install --user Pillow")

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(os.path.dirname(HERE), "assets", "img", "gallery")

WIDTHS = [500, 1000]
FULL_MAX = 1600
Q_WEBP = 72
Q_JPEG = 78


def slugify(text):
    text = re.sub(r"\.[^.]+$", "", os.path.basename(text))
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "photo"


def process(path, name=None):
    if not os.path.exists(path):
        print(f"  ! not found: {path}")
        return None

    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    slug = name or slugify(path)
    os.makedirs(OUT_DIR, exist_ok=True)

    targets = [(w, f"{slug}-{w}") for w in WIDTHS if w < im.width]
    full_w = min(im.width, FULL_MAX)
    targets.append((full_w, f"{slug}-full"))

    written = []
    for w, stem in targets:
        h = round(im.height * w / im.width)
        resized = im.resize((w, h), Image.LANCZOS)
        for ext, kwargs in (
            ("webp", dict(quality=Q_WEBP, method=6)),
            ("jpg", dict(quality=Q_JPEG, optimize=True, progressive=True)),
        ):
            dest = os.path.join(OUT_DIR, f"{stem}.{ext}")
            resized.save(dest, "WEBP" if ext == "webp" else "JPEG", **kwargs)
            written.append(dest)

    total = sum(os.path.getsize(f) for f in written) // 1024
    print(f"  ✓ {os.path.basename(path)}  →  {slug}  ({im.width}x{im.height}, {total}KB across {len(written)} files)")
    return slug


def main():
    ap = argparse.ArgumentParser(description="Optimise photos for the DJ Reese site.")
    ap.add_argument("images", nargs="+", help="source image files")
    ap.add_argument("--name", help="output slug (only valid with a single image)")
    args = ap.parse_args()

    if args.name and len(args.images) > 1:
        sys.exit("--name only works with a single image.")

    print(f"Writing to {OUT_DIR}\n")
    slugs = [s for s in (process(p, args.name) for p in args.images) if s]

    if slugs:
        print("\nAdd these paths in the dashboard (Photos & Video):\n")
        for s in slugs:
            print(f"    assets/img/gallery/{s}")
        print()


if __name__ == "__main__":
    main()

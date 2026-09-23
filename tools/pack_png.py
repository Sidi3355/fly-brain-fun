"""Build a copy of the site whose binary assets are wrapped as lossless PNGs.

Some hosts (for example claude.ai Artifacts) only serve web media types. Each
data/**/*.bin is stored as an 8-bit greyscale PNG whose pixels are
[uint32 byte length][bytes...], zero padded; assets/js/data.js unwraps them when
the page sets window.NEURONAUT_PACKED = true.

    python tools/pack_png.py OUT_DIR

writes OUT_DIR/index.html (tag-stripped body, packed flag set),
OUT_DIR/data/**.bin.png, copies of every other asset, and OUT_DIR/files.json
(publish manifest: published path -> file).
"""
import json
import re
import shutil
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WIDTH = 2048


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def to_png(payload):
    blob = struct.pack("<I", len(payload)) + payload
    rows = -(-len(blob) // WIDTH)
    blob += b"\0" * (rows * WIDTH - len(blob))
    raw = b"".join(b"\0" + blob[r * WIDTH:(r + 1) * WIDTH] for r in range(rows))
    ihdr = struct.pack(">IIBBBBB", WIDTH, rows, 8, 0, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main(out):
    out = Path(out).resolve()
    manifest = {}
    def copy(p, rel):
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, dst)
        manifest[rel] = str(dst)

    for p in sorted((ROOT / "assets").rglob("*")):
        if p.is_file():
            copy(p, str(p.relative_to(ROOT)))
    for p in sorted((ROOT / "data").rglob("*")):
        if not p.is_file():
            continue
        rel = str(p.relative_to(ROOT))
        if p.suffix == ".bin":
            dst = out / (rel + ".png")
            dst.parent.mkdir(parents=True, exist_ok=True)
            dst.write_bytes(to_png(p.read_bytes()))
            manifest[rel + ".png"] = str(dst)
        else:
            copy(p, rel)
    html = (ROOT / "index.html").read_text()
    for pat in [r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*",
                r"<body>\s*", r"</body>\s*", r'<meta charset="utf-8">\s*', r'<meta name="viewport"[^>]*>\s*']:
        html = re.sub(pat, "", html, flags=re.I)
    html = html.replace('<script type="module" src="assets/js/main.js"></script>',
                        '<script>window.NEURONAUT_PACKED = true;</script>\n<script type="module" src="assets/js/main.js"></script>')
    (out / "index.html").write_text(html)
    (out / "files.json").write_text(json.dumps(manifest, indent=0))
    total = sum(Path(v).stat().st_size for v in manifest.values())
    print(f"{len(manifest)} files, {total / 1e6:.1f} MB -> {out}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / "dist-packed")

"""Build data/em/: real FAFB electron-microscopy images + FlyWire segmentation overlays.

Sources (public neuroglancer precomputed volumes, read over HTTPS):
  EM   precomputed://gs://flywire_em/aligned/v1        (uint8, jpeg/raw sharded mips)
  SEG  precomputed://gs://flywire_v141_m783            (uint64 flat v783 ROOT ids,
                                                         compressed_segmentation, sharded)

Outputs
  sweep_{0..6}.jpg   full-brain frontal sections evenly spaced in z (512 nm/px)
  zoom_{0..4}.jpg    1024x1024 crops centred on one spot at 512,128,32,16,8 nm/px
  seg_{0..4}.png     RGBA (PNG8) segmentation overlays matching the zoom crops
  meta.json          placement of every image in site coordinates + top neurons

Raw cutouts are cached in $FLY_RAW/em_cache/*.npz so re-colouring is instant.
Run from the pipeline dir:  python build_em.py  [--center x_nm y_nm [z_section]]
"""
import colorsys
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from scipy import ndimage as ndi

from common import OUT, RAW, nm_to_site, root_index

EM_PATH = "precomputed://gs://flywire_em/aligned/v1"
SEG_PATH = "precomputed://gs://flywire_v141_m783"
CACHE = RAW / "em_cache"
CACHE.mkdir(parents=True, exist_ok=True)
EM_OUT = OUT / "em"
EM_OUT.mkdir(exist_ok=True)
PALETTE = json.load(open(Path(__file__).with_name("palette.json")))["superClasses"]
SECTION_NM = 40
Z_FIRST, Z_LAST = 16, 7062            # FAFB sections present in the segmentation

# EM mip used for each output scale (nm/px -> mip resolution); coarse mips average in z.
EM_MIP = {512: (512, 512, 320), 128: (128, 128, 80), 32: (32, 32, 40), 16: (16, 16, 40), 8: (8, 8, 40)}
# Segmentation mip used for each output scale (finest available is 16 nm; 8 nm is upsampled 2x).
SEG_MIP = {512: (512, 512, 40), 128: (128, 128, 40), 32: (32, 32, 40), 16: (16, 16, 40), 8: (16, 16, 40)}

_vols = {}

def vol(path, res):
    from cloudvolume import CloudVolume
    key = (path, tuple(res))
    if key not in _vols:
        _vols[key] = CloudVolume(path, mip=list(res), use_https=True, fill_missing=True,
                                 bounded=False, progress=False, agglomerate=False)
    return _vols[key]

def cutout(kind, res, x0_nm, y0_nm, w, h, z_section):
    """(w,h) array (x fastest axis first) of the given mip, top-left at (x0_nm, y0_nm).

    z_section is a 40 nm section index; for mips with coarser z the containing voxel is used.
    Cached as npz keyed by every parameter.
    """
    res = tuple(int(r) for r in res)
    vx, vy = int(round(x0_nm / res[0])), int(round(y0_nm / res[1]))
    vz = (z_section * SECTION_NM) // res[2]
    name = f"{kind}_{res[0]}_{res[1]}_{res[2]}_{vx}_{vy}_{vz}_{w}x{h}.npz"
    f = CACHE / name
    if f.exists():
        return np.load(f)["a"]
    v = vol(EM_PATH if kind == "em" else SEG_PATH, res)
    a = np.asarray(v[vx:vx + w, vy:vy + h, vz:vz + 1])[..., 0, 0]
    np.savez_compressed(f, a=a)
    print(f"  fetched {name}  {a.dtype} {a.shape}", flush=True)
    return a


# ----------------------------------------------------------------------------- neuron table

def load_neurons():
    a = pd.read_csv(RAW / "flywire_annotations/supplemental_files/Supplemental_file1_neuron_annotations.tsv",
                    sep="\t", low_memory=False, usecols=["root_id", "super_class", "cell_type", "hemibrain_type"])
    a["ctype"] = a.cell_type.fillna(a.hemibrain_type).fillna("")
    a["super_class"] = a.super_class.fillna("")
    return a.set_index("root_id")


# ----------------------------------------------------------------------------- colouring

CLASSES = list(PALETTE.keys()) + ["_other"]     # "_other" = segment not in the neuron table
NJ = 8                                           # jitter levels per class
FILL_A, EDGE_A, OTHER_A = 153, 217, 128          # alpha: 0.6 inside, 0.85 boundary, 0.5 non-neuron

def _hex(h):
    return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]

def build_palette():
    """Indexed palette: 0 transparent, then (fill, edge) pairs for each class x jitter level."""
    rgba = [(0, 0, 0, 0)]
    levels = np.linspace(-0.15, 0.15, NJ)
    hue_wobble = [0.0, 0.018, -0.018, 0.009, -0.009, 0.018, -0.018, 0.0]
    for c in CLASSES:
        for j in range(NJ):
            if c == "_other":        # muted violet-grey hash colours
                h, l, s = 0.64 + 0.16 * j / (NJ - 1), 0.36 + 0.14 * ((j * 3) % NJ) / (NJ - 1), 0.16
                alpha = OTHER_A
            else:
                h, l, s = colorsys.rgb_to_hls(*_hex(PALETTE[c]))
                l = min(0.93, l * (1 + levels[j]))
                h = (h + hue_wobble[j]) % 1.0
                alpha = FILL_A
            r, g, b = colorsys.hls_to_rgb(h, l, s)
            er, eg, eb = colorsys.hls_to_rgb(h, l * 0.5, s)
            rgba.append(tuple(int(round(v * 255)) for v in (r, g, b)) + (alpha,))
            rgba.append(tuple(int(round(v * 255)) for v in (er, eg, eb)) + (EDGE_A,))
    return np.array(rgba, dtype=np.uint8)

PAL = build_palette()

def mix64(x):
    """splitmix64 finaliser -> deterministic per-id hash (uint64 numpy array)."""
    x = np.asarray(x, dtype=np.uint64).copy()
    with np.errstate(over="ignore"):
        x ^= x >> np.uint64(30); x *= np.uint64(0xBF58476D1CE4E5B9)
        x ^= x >> np.uint64(27); x *= np.uint64(0x94D049BB133111EB)
        x ^= x >> np.uint64(31)
    return x

def color_segments(lab, neurons, edges=True):
    """lab (h,w) uint64 root ids -> (h,w) uint8 palette indices, plus per-id pixel counts."""
    ids, inv, counts = np.unique(lab, return_inverse=True, return_counts=True)
    inv = inv.reshape(lab.shape)
    sup = neurons.super_class.reindex(ids.astype(np.int64)).to_numpy()
    cls = np.array([CLASSES.index(s) if isinstance(s, str) else CLASSES.index("_other") for s in sup])
    jit = (mix64(ids) % np.uint64(NJ)).astype(np.int64)
    fill = (1 + (cls * NJ + jit) * 2).astype(np.uint8)
    fill[ids == 0] = 0
    out = fill[inv]
    if edges:
        b = np.zeros(lab.shape, bool)
        b[:, :-1] |= lab[:, :-1] != lab[:, 1:]
        b[:-1, :] |= lab[:-1, :] != lab[1:, :]
        b &= lab != 0
        out[b] += 1
    return out, ids, counts

def save_png8(idx, path):
    im = Image.fromarray(idx, mode="P")
    im.putpalette(PAL[:, :3].flatten().tolist())
    im.info["transparency"] = bytes(PAL[:, 3].tolist())
    im.save(path, optimize=True, transparency=bytes(PAL[:, 3].tolist()))


# ----------------------------------------------------------------------------- EM tone mapping

def tissue_mask(seg, close_px, dilate_px, min_px, feather):
    """Soft 0..1 mask of tissue from a segmentation cutout (segmented = tissue)."""
    m = seg > 0
    st = ndi.generate_binary_structure(2, 1)
    m = ndi.binary_closing(np.pad(m, close_px), st, iterations=close_px)[close_px:-close_px, close_px:-close_px]
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, 1 + np.flatnonzero(sizes >= min_px))
    m = ndi.binary_dilation(m, st, iterations=dilate_px)
    return np.clip(ndi.gaussian_filter(m.astype(np.float32), feather), 0, 1)

def tone(em, mask=None, lo_hi=(0.5, 99.7), out_lo=0, sharpen=None, gamma=1.0):
    """Percentile stretch (over tissue pixels) -> uint8, optional unsharp mask, soft mask to black."""
    valid = em > 0
    if mask is not None:
        valid &= mask > 0.5
    lo, hi = np.percentile(em[valid], lo_hi)
    x = np.clip((em.astype(np.float32) - lo) / (hi - lo), 0, 1) ** gamma
    x = out_lo + (255 - out_lo) * x
    img = Image.fromarray(x.astype(np.uint8))
    if sharpen:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.UnsharpMask(radius=sharpen[0], percent=sharpen[1], threshold=2))
    x = np.asarray(img).astype(np.float32)
    x[em == 0] = 0
    if mask is not None:
        x *= mask
    return x.round().clip(0, 255).astype(np.uint8)

def destripe(em, mask, sigma=12, win=151):
    """Remove the vertical banding of the coarse EM mips: subtract the running column mean
    (over `win` rows) of the high-passed image, inside tissue only. Returns float32."""
    x = em.astype(np.float32)
    valid = (em > 0) & (mask > 0.5)
    w = valid.astype(np.float32)
    blur = ndi.gaussian_filter(x * w, sigma) / np.maximum(ndi.gaussian_filter(w, sigma), 1e-3)
    hp = (x - blur) * w
    stripe = ndi.uniform_filter1d(hp, win, axis=0) / np.maximum(ndi.uniform_filter1d(w, win, axis=0), 0.05)
    return np.where(valid, np.clip(x - stripe, 1, 255), x)

def mode3(lab):
    """3x3 majority filter on a label image (ties keep the centre label); removes the 1-px
    'comb' spikes of the 16 nm segmentation and rounds upsampled staircase edges."""
    h, w = lab.shape
    p = np.pad(lab, 1, mode="edge")
    stack = np.stack([p[dy:dy + h, dx:dx + w] for dy in range(3) for dx in range(3)])
    votes = np.stack([(stack == stack[k]).sum(0, dtype=np.int16) * 2 for k in range(9)])
    votes[4] += 1
    return np.take_along_axis(stack, votes.argmax(0)[None], 0)[0]

def crop_pad(img, r0, c0, h, w):
    """img[r0:r0+h, c0:c0+w] with zero padding outside."""
    out = np.zeros((h, w), img.dtype)
    rs, cs = max(r0, 0), max(c0, 0)
    re, ce = min(r0 + h, img.shape[0]), min(c0 + w, img.shape[1])
    if re > rs and ce > cs:
        out[rs - r0:re - r0, cs - c0:ce - c0] = img[rs:re, cs:ce]
    return out

def save_jpg(arr, path, q=78):
    Image.fromarray(arr).save(path, quality=q, optimize=True, progressive=True)


# ----------------------------------------------------------------------------- products

# Zoom target: the lamina of the right optic lobe (FlyWire "right" side = large x) in section 3540,
# the same section as sweep_3. Its cartridges run in-plane here, so every scale shows stripes:
# the optic lobe (512), lamina/medulla/chiasm (128), cartridges of R1-6 + L1-L5 axons (32-16),
# synapses, mitochondria and vesicles (8). Chosen after inspecting medulla, calyx, AL, FB crops.
LOCATION = {
    "name": "lamina",
    "description": "Lamina of the right optic lobe, the first visual relay: photoreceptor R1-6 axons "
                   "and lamina monopolar cells L1-L5 run side by side in cartridges (one per facet "
                   "of the eye), here cut lengthwise",
    "center_nm": [862208, 280064],        # multiples of 512 nm so every scale is pixel-aligned
    "z": 3540,
}
ZOOM_SCALES = [512, 128, 32, 16, 8]
ZOOM_PX = 1024
SEG_EDGES_MAX_NM = 32                     # draw segment boundaries only at <= 32 nm/px
SEG_MODE_MAX_NM = 16                      # 3x3 majority-filter the segmentation at <= 16 nm/px
SWEEP_N, SWEEP_TRIM = 7, 0.08
SWEEP_NM = 512
SWEEP_FETCH = (30_720, 0, 1800, 1000)     # x0, y0 (nm, multiples of 512) and size (px) at 512 nm/px
TONE_512 = dict(lo_hi=(0.7, 99.8), out_lo=18, sharpen=(1.6, 70))

def section_span(res_z, z):
    k = res_z // SECTION_NM
    first = (z * SECTION_NM // res_z) * k
    return [int(first), int(first + k - 1)]

def plane(x0, y0, x1, y1, z):
    x0, y0, x1, y1, z = (int(v) for v in (x0, y0, x1, y1, z))
    zn = z * SECTION_NM
    c = nm_to_site(np.array([[x0, y0, zn], [x1, y0, zn], [x1, y1, zn], [x0, y1, zn]], float))
    return {"bounds_nm": {"x": [x0, x1], "y": [y0, y1], "z": zn},
            "corners_site": np.round(c.astype(np.float64), 3).tolist()}

def sweep_sections():
    span = Z_LAST - Z_FIRST
    zs = np.linspace(Z_FIRST + SWEEP_TRIM * span, Z_LAST - SWEEP_TRIM * span, SWEEP_N)
    k = EM_MIP[SWEEP_NM][2] // SECTION_NM  # 512 nm mip averages 8 sections: centre on one bin
    return [int(round((z - k / 2) / k)) * k + k // 2 for z in zs]

_sections = {}

def section512(z):
    """Whole-brain 512 nm/px section over SWEEP_FETCH: (tone-mapped uint8 image, soft tissue mask)."""
    if z not in _sections:
        x0, y0, W, H = SWEEP_FETCH
        em = cutout("em", EM_MIP[SWEEP_NM], x0, y0, W, H, z).T           # (H, W)
        sg = cutout("seg", SEG_MIP[SWEEP_NM], x0, y0, W, H, z).T
        mask = tissue_mask(sg, close_px=6, dilate_px=3, min_px=400, feather=1.2)
        _sections[z] = (tone(destripe(em, mask), mask, **TONE_512), mask)
    return _sections[z]

def build_sweep(meta):
    x0, y0, W, H = SWEEP_FETCH
    s = SWEEP_NM
    zs = sweep_sections()
    # one common crop (union of tissue over all frames) so the frames stack cleanly
    union = np.any([section512(z)[1] > 0.05 for z in zs], axis=0)
    ys, xs = np.nonzero(union)
    pad = 8
    c0, c1 = int(xs.min()) - pad, int(xs.max()) + pad + 1
    r0, r1 = int(ys.min()) - pad, int(ys.max()) + pad + 1
    assert c0 > 0 and r0 > 0 and c1 < W and r1 < H, "sweep fetch window clips the brain"
    for i, z in enumerate(zs):
        img = section512(z)[0][r0:r1, c0:c1]
        f = f"sweep_{i}.jpg"
        save_jpg(img, EM_OUT / f)
        bx0, by0 = x0 + c0 * s, y0 + r0 * s
        meta["images"].append({"file": f, "kind": "sweep", "index": i, "nm_per_px": s, "width": c1 - c0,
                               "height": r1 - r0, "z": z, "z_sections_averaged": section_span(EM_MIP[s][2], z),
                               "em_mip": list(EM_MIP[s]),
                               **plane(bx0, by0, bx0 + (c1 - c0) * s, by0 + (r1 - r0) * s, z)})
        print(f"{f}: z={z} {c1 - c0}x{r1 - r0}px", flush=True)

def top_neurons(ids, counts, neurons, ridx, n=40):
    known = np.array([int(r) in ridx for r in ids], bool)
    top = []
    for k in np.argsort(-(counts * known), kind="stable")[:n]:
        if not known[k]:
            break
        r = int(ids[k])
        row = neurons.loc[r]
        top.append({"index": ridx[r], "root_id": str(r), "super_class": row.super_class,
                    "cell_type": row.ctype, "px": int(counts[k])})
    return known, top

def build_zoom(meta, neurons, ridx):
    cx, cy = LOCATION["center_nm"]
    z = LOCATION["z"]
    for i, s in enumerate(ZOOM_SCALES):
        x0, y0 = cx - ZOOM_PX // 2 * s, cy - ZOOM_PX // 2 * s
        up = SEG_MIP[s][0] // s           # 2 for the 8 nm level (seg only exists down to 16 nm)
        sg = cutout("seg", SEG_MIP[s], x0, y0, ZOOM_PX // up, ZOOM_PX // up, z).T
        if s <= SEG_MODE_MAX_NM:
            sg = mode3(sg)
        if up > 1:
            sg = mode3(np.repeat(np.repeat(sg, up, 0), up, 1))
        if s == SWEEP_NM and (x0 - SWEEP_FETCH[0]) % s == 0 and (y0 - SWEEP_FETCH[1]) % s == 0:
            # identical pixels to the matching sweep frame (same mip, mask, destripe and tone curve)
            img = crop_pad(section512(z)[0], (y0 - SWEEP_FETCH[1]) // s, (x0 - SWEEP_FETCH[0]) // s,
                           ZOOM_PX, ZOOM_PX)
        else:
            em = cutout("em", EM_MIP[s], x0, y0, ZOOM_PX, ZOOM_PX, z).T
            mask = tissue_mask(sg, close_px=6, dilate_px=3, min_px=400, feather=1.2) if s >= 128 else None
            img = tone(em, mask, lo_hi=(0.5, 99.7), sharpen=(1.4, 60) if s >= 128 else None)
        f = f"zoom_{i}.jpg"
        save_jpg(img, EM_OUT / f)
        box = plane(x0, y0, x0 + ZOOM_PX * s, y0 + ZOOM_PX * s, z)
        meta["images"].append({"file": f, "kind": "zoom", "level": i, "nm_per_px": s, "width": ZOOM_PX,
                               "height": ZOOM_PX, "z": z, "z_sections_averaged": section_span(EM_MIP[s][2], z),
                               "em_mip": list(EM_MIP[s]), **box})
        # segmentation overlay
        edges = s <= SEG_EDGES_MAX_NM
        idx, ids, counts = color_segments(sg, neurons, edges=edges)
        f = f"seg_{i}.png"
        save_png8(idx, EM_OUT / f)
        known, top = top_neurons(ids, counts, neurons, ridx)
        seg_px = int(counts[ids != 0].sum())
        meta["images"].append({"file": f, "kind": "seg", "level": i, "nm_per_px": s, "width": ZOOM_PX,
                               "height": ZOOM_PX, "z": z, "seg_mip": list(SEG_MIP[s]), "upsampled": up,
                               "edges": bool(edges), "mode_filtered": bool(s <= SEG_MODE_MAX_NM),
                               "segments": int((ids != 0).sum()), "neurons": int(known.sum()),
                               "neuron_px_fraction": round(float(counts[known].sum()) / max(seg_px, 1), 3),
                               **box, "top_neurons": top})
        print(f"zoom_{i}/seg_{i}: {s} nm/px, {int((ids != 0).sum())} segments, {int(known.sum())} neurons",
              flush=True)

def main():
    neurons = load_neurons()
    ridx = root_index()
    cx, cy = LOCATION["center_nm"]
    zn = LOCATION["z"] * SECTION_NM
    meta = {
        "sources": {"em": EM_PATH, "segmentation": SEG_PATH,
                    "segmentation_ids": "proofread FlyWire v783 root ids (flat, materialized); "
                                        "ids not in the neuron table are glia/fragments/unproofread",
                    "section_nm": SECTION_NM},
        "location": {**LOCATION, "z_nm": zn,
                     "center_site": np.round(nm_to_site(np.array([[cx, cy, zn]], float))[0].astype(np.float64), 3).tolist(),
                     "sweep_frame": sweep_sections().index(LOCATION["z"]) if LOCATION["z"] in sweep_sections() else None},
        "corner_order": "corners_site = tl,tr,br,bl = image pixel (0,0),(w,0),(w,h),(0,h); "
                        "image x right = +x nm, image y down = +y nm; site = nm_to_site (um)",
        "seg_style": {"fill_alpha": round(FILL_A / 255, 3), "edge_alpha": round(EDGE_A / 255, 3),
                      "other_alpha": round(OTHER_A / 255, 3),
                      "jitter": "per-segment lightness x(1 +/-0.15) (+ small hue wobble), level = splitmix64(root id) % 8",
                      "colors": "palette.json superClasses; segments not in the neuron table: muted violet-grey"},
        "images": [],
    }
    build_sweep(meta)
    build_zoom(meta, neurons, ridx)
    for im in meta["images"]:
        im["bytes"] = (EM_OUT / im["file"]).stat().st_size
    with open(EM_OUT / "meta.json", "w") as f:
        json.dump(meta, f, separators=(",", ":"))
    total = sum(p.stat().st_size for p in EM_OUT.iterdir())
    print(f"data/em total {total / 1e6:.2f} MB")

if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "--center":   # quick override: --center x_nm y_nm [z]
        LOCATION["center_nm"] = [int(sys.argv[2]), int(sys.argv[3])]
        if len(sys.argv) > 4:
            LOCATION["z"] = int(sys.argv[4])
    main()

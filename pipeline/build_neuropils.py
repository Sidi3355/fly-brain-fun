"""Build data/neuropils.bin + data/neuropils.json from FlyWire's public neuropil meshes.

Meshes: gs://flywire_neuropil_meshes (neuroglancer legacy mesh format, nm units).
Each of the 78 neuropils (+ the whole-brain outline) is decimated and stored
as int16 site coordinates with a shared uint32 index buffer.
"""
import json
import struct
import urllib.request

import fast_simplification
import numpy as np

from common import OUT, RAW, nm_to_site, quantize, write_columns, write_json

BUCKET = "https://storage.googleapis.com/flywire_neuropil_meshes"
NP_LAYER = "neuropils/neuropil_mesh_v141_v6"
BRAIN_LAYER = "whole_neuropil/brain_mesh_v3"
CACHE = RAW / "neuropil_cache"
CACHE.mkdir(exist_ok=True)

NAMES = {
    "AL": "Antennal lobe", "AME": "Accessory medulla", "AMMC": "Antennal mechanosensory & motor center",
    "AOTU": "Anterior optic tubercle", "ATL": "Antler", "AVLP": "Anterior ventrolateral protocerebrum",
    "BU": "Bulb", "CAN": "Cantle", "CRE": "Crepine", "EB": "Ellipsoid body", "EPA": "Epaulette",
    "FB": "Fan-shaped body", "FLA": "Flange", "GA": "Gall", "GNG": "Gnathal ganglia", "GOR": "Gorget",
    "IB": "Inferior bridge", "ICL": "Inferior clamp", "IPS": "Inferior posterior slope", "LA": "Lamina",
    "LAL": "Lateral accessory lobe", "LH": "Lateral horn", "LO": "Lobula", "LOP": "Lobula plate",
    "ME": "Medulla", "MB_CA": "Mushroom body calyx", "MB_PED": "Mushroom body pedunculus",
    "MB_VL": "Mushroom body vertical lobe", "MB_ML": "Mushroom body medial lobe", "NO": "Noduli",
    "OCG": "Ocellar ganglion", "PB": "Protocerebral bridge", "PLP": "Posterior lateral protocerebrum",
    "PRW": "Prow", "PVLP": "Posterior ventrolateral protocerebrum", "SAD": "Saddle",
    "SCL": "Superior clamp", "SIP": "Superior intermediate protocerebrum",
    "SLP": "Superior lateral protocerebrum", "SMP": "Superior medial protocerebrum",
    "SPS": "Superior posterior slope", "VES": "Vest", "WED": "Wedge",
}
# Neuropil supercategories after Ito et al. 2014 (Neuron 81:755).
SYSTEMS = [
    ("optic", "Optic lobe", ["LA", "ME", "AME", "LO", "LOP"]),
    ("mb", "Mushroom body", ["MB_CA", "MB_PED", "MB_VL", "MB_ML"]),
    ("cx", "Central complex", ["PB", "FB", "EB", "NO"]),
    ("al", "Antennal lobe", ["AL"]),
    ("lh", "Lateral horn", ["LH"]),
    ("snp", "Superior neuropils", ["SLP", "SIP", "SMP"]),
    ("vlnp", "Ventrolateral neuropils", ["AOTU", "AVLP", "PVLP", "PLP", "WED"]),
    ("lx", "Lateral complex", ["LAL", "BU", "GA"]),
    ("inp", "Inferior neuropils", ["CRE", "SCL", "ICL", "IB", "ATL"]),
    ("vmnp", "Ventromedial neuropils", ["VES", "EPA", "GOR", "SPS", "IPS"]),
    ("penp", "Periesophageal neuropils", ["SAD", "AMMC", "FLA", "CAN", "PRW"]),
    ("gng", "Gnathal ganglia", ["GNG"]),
    ("ocg", "Ocellar ganglion", ["OCG"]),
]
SYSTEM_OF = {abbr: sid for sid, _, abbrs in SYSTEMS for abbr in abbrs}

def fetch(path):
    local = CACHE / path.replace("/", "__")
    if not local.exists():
        with urllib.request.urlopen(f"{BUCKET}/{path}", timeout=60) as r:
            local.write_bytes(r.read())
    return local.read_bytes()

def load_mesh(layer, seg):
    manifest = json.loads(fetch(f"{layer}/mesh/{seg}:0"))
    verts, faces, off = [], [], 0
    for frag in manifest["fragments"]:
        buf = fetch(f"{layer}/mesh/{frag}")
        nv = struct.unpack_from("<I", buf, 0)[0]
        v = np.frombuffer(buf, "<f4", nv * 3, 4).reshape(-1, 3)
        f = np.frombuffer(buf, "<u4", offset=4 + nv * 12).reshape(-1, 3)
        verts.append(v)
        faces.append(f + off)
        off += nv
    return np.vstack(verts).astype(np.float64), np.vstack(faces).astype(np.int64)

def decimate(v, f, target_faces):
    if len(f) <= target_faces:
        return v, f
    ratio = 1 - target_faces / len(f)
    v2, f2 = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int32), target_reduction=ratio)
    return v2.astype(np.float64), f2.astype(np.int64)

def main():
    # v6 mesh ids -> names (matched 1:1 against the named JFRC2NP.surf.fw meshes shipped with fafbseg)
    ids = json.load(open(__file__.replace("build_neuropils.py", "neuropil_ids_v6.json")))
    meshes, meta = [], []
    for seg in range(len(ids)):
        name = ids[str(seg)]
        if name == "UNASGD":
            continue
        v, f = load_mesh(NP_LAYER, seg)
        site = nm_to_site(v)
        vol_um3 = abs(np.einsum("ij,ij->i", site[f[:, 0]], np.cross(site[f[:, 1]], site[f[:, 2]])).sum()) / 6
        target = int(np.clip(900 + vol_um3 ** 0.5 * 9, 900, 7000))
        v2, f2 = decimate(v, f, target)
        s2 = nm_to_site(v2)
        abbr, _, side = name.rpartition("_") if name.endswith(("_L", "_R")) else (name, "", "")
        meshes.append((s2, f2))
        meta.append({
            "id": seg, "name": name, "abbr": abbr, "side": {"L": "left", "R": "right"}.get(side, "center"),
            "full": NAMES.get(abbr, abbr), "system": SYSTEM_OF.get(abbr, "other"),
            "centroid": site.mean(0).round(1).tolist(), "volume_um3": round(float(vol_um3)),
            "faces": int(len(f2)),
        })
        print(f"{name:10s} {len(f):7d} -> {len(f2):5d} faces, {vol_um3/1e6:6.2f}e6 um3")

    bv, bf = load_mesh(BRAIN_LAYER, 1)
    bv, bf = decimate(bv, bf, 14000)
    meshes.append((nm_to_site(bv), bf))
    meta.append({"id": -1, "name": "BRAIN", "abbr": "BRAIN", "full": "Whole-brain neuropil outline",
                 "system": "brain", "side": "center", "centroid": nm_to_site(bv).mean(0).round(1).tolist(),
                 "faces": int(len(bf))})

    pos, idx, vs, vc, is_, ic = [], [], [], [], [], []
    voff = ioff = 0
    for s, f in meshes:
        pos.append(quantize(s)); idx.append(f.astype("<u4").ravel())
        vs.append(voff); vc.append(len(s)); is_.append(ioff); ic.append(f.size)
        voff += len(s); ioff += f.size
    write_columns("neuropils.bin", {
        "pos": np.vstack(pos), "index": np.concatenate(idx),
        "vStart": np.array(vs, "<u4"), "vCount": np.array(vc, "<u4"),
        "iStart": np.array(is_, "<u4"), "iCount": np.array(ic, "<u4"),
    })
    write_json("neuropils.json", {
        "meshes": meta,
        "systems": [{"id": sid, "name": nm, "members": ab} for sid, nm, ab in SYSTEMS],
    })
    print("total verts", voff, "indices", ioff)

if __name__ == "__main__":
    main()

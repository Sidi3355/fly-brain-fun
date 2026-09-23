"""Shared constants and helpers for the Neuronaut data pipeline.

Every script in this folder reads raw FlyWire files from RAW and writes
browser-ready assets into ../data. All 3D positions shipped to the browser
use the same "site" frame:

  * units are micrometres, centred on the middle of the FAFB volume
  * X = +x, Y = -y (dorsal up), Z = -z  (a 180 deg rotation about x, so the
    brain is not mirrored)
  * int16 positions are stored as round(um * QUANT)
"""
import json
import os
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(os.environ.get("FLY_RAW", "/home/user/data"))
OUT = ROOT / "data"
OUT.mkdir(exist_ok=True)

ANNOT_VOXEL_NM = np.array([4.0, 4.0, 40.0])   # annotation table voxel size
CENTER_NM = np.array([495_000.0, 247_000.0, 140_000.0])
QUANT = 20                                     # int16 units per micrometre

def nm_to_site(xyz_nm):
    """(N,3) nanometres in FAFB/FlyWire space -> (N,3) float32 site micrometres."""
    p = (np.asarray(xyz_nm, dtype=np.float64) - CENTER_NM) / 1000.0
    p[:, 1] *= -1
    p[:, 2] *= -1
    return p.astype(np.float32)

def quantize(site_um):
    """Float site micrometres -> int16 array ready to write."""
    q = np.round(np.asarray(site_um) * QUANT)
    return np.clip(q, -32767, 32767).astype("<i2")

def load_root_ids():
    """uint64 root ids in site neuron-index order (written by build_neurons.py)."""
    return np.fromfile(OUT / "root_ids.bin", dtype="<u8")

def root_index():
    """dict root_id -> neuron index."""
    ids = load_root_ids()
    return {int(r): i for i, r in enumerate(ids)}

def write_json(name, obj):
    with open(OUT / name, "w") as f:
        json.dump(obj, f, separators=(",", ":"))

def write_columns(name, columns):
    """Pack named numpy arrays into one binary file plus a JSON directory.

    The file starts with a uint32 header length, then a UTF-8 JSON header
    {name: {dtype, shape, offset}}, padded to 8 bytes, then the raw arrays
    (each 8-byte aligned) so the browser can view them with typed arrays.
    """
    entries, blobs, offset = {}, [], 0
    for key, arr in columns.items():
        arr = np.ascontiguousarray(arr)
        pad = (-offset) % 8
        blobs.append(b"\0" * pad)
        offset += pad
        entries[key] = {"dtype": arr.dtype.str, "shape": list(arr.shape), "offset": offset}
        blobs.append(arr.tobytes())
        offset += arr.nbytes
    header = json.dumps(entries, separators=(",", ":")).encode()
    header += b" " * ((-(len(header) + 4)) % 8)
    with open(OUT / name, "wb") as f:
        f.write(np.uint32(len(header)).tobytes())
        f.write(header)
        for b in blobs:
            f.write(b)

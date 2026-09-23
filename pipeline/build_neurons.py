"""Build data/neurons.bin + data/neurons.json + data/root_ids.bin.

One row per annotated FlyWire v783 neuron (Schlegel et al. 2024 annotations),
sorted by root id. That order is the "neuron index" every other asset uses.
"""
import json

import numpy as np
import pandas as pd

from common import ANNOT_VOXEL_NM, OUT, RAW, nm_to_site, quantize, write_columns, write_json

NEUROPILS = [v for _, v in sorted(json.load(open(__file__.replace("build_neurons.py", "neuropil_ids.json"))).items(), key=lambda kv: int(kv[0]))]
NP_INDEX = {n: i for i, n in enumerate(NEUROPILS)}

def categorical(series, order=None, dtype="u1"):
    s = series.fillna("").astype(str)
    if order is None:
        counts = s[s != ""].value_counts()
        order = [""] + list(counts.index)
    lut = {v: i for i, v in enumerate(order)}
    codes = s.map(lambda v: lut.get(v, 0)).to_numpy().astype(dtype)
    return codes, order

def top_neuropil(df, id_col, index):
    df = df[df[id_col].isin(index.index)]
    tot = df.groupby(id_col)["count"].sum()
    best = df.sort_values("count", ascending=False).drop_duplicates(id_col).set_index(id_col)["neuropil"]
    npi = best.map(lambda n: NP_INDEX.get(n, NP_INDEX["UNASGD"]))
    out_np = np.full(len(index), 255, dtype="u1")
    out_tot = np.zeros(len(index), dtype="<u4")
    out_np[index[npi.index].to_numpy()] = npi.to_numpy()
    out_tot[index[tot.index].to_numpy()] = tot.to_numpy()
    return out_np, out_tot

def main():
    a = pd.read_csv(RAW / "flywire_annotations/supplemental_files/Supplemental_file1_neuron_annotations.tsv",
                    sep="\t", low_memory=False).sort_values("root_id").reset_index(drop=True)
    n = len(a)
    index = pd.Series(np.arange(n), index=a.root_id.to_numpy())

    has_soma = a.soma_x.notna().to_numpy()
    vox = np.where(has_soma[:, None], a[["soma_x", "soma_y", "soma_z"]].to_numpy(float),
                   a[["pos_x", "pos_y", "pos_z"]].to_numpy(float))
    site = nm_to_site(vox * ANNOT_VOXEL_NM)

    super_order = ["", "optic", "central", "sensory", "visual_projection", "ascending", "descending",
                   "sensory_ascending", "visual_centrifugal", "motor", "endocrine"]
    nt_order = ["", "acetylcholine", "glutamate", "gaba", "dopamine", "serotonin", "octopamine"]
    sup, _ = categorical(a.super_class, super_order)
    nt, _ = categorical(a.top_nt, nt_order)
    side, side_order = categorical(a.side, ["", "left", "right", "center", "na"])
    flow, flow_order = categorical(a.flow, ["", "intrinsic", "afferent", "efferent"])
    ccls, ccls_order = categorical(a.cell_class)
    csub, csub_order = categorical(a.cell_sub_class, dtype="<u2")
    ctype_src = a.cell_type.fillna(a.hemibrain_type)
    ctype, ctype_order = categorical(ctype_src, dtype="<u2")
    lin, lin_order = categorical(a.ito_lee_hemilineage, dtype="<u2")
    nerve, nerve_order = categorical(a.nerve)

    pre = pd.read_feather(RAW / "per_neuron_neuropil_count_pre_783.feather")
    post = pd.read_feather(RAW / "per_neuron_neuropil_count_post_783.feather")
    out_np, out_syn = top_neuropil(pre, "pre_pt_root_id", index)
    in_np, in_syn = top_neuropil(post, "post_pt_root_id", index)

    ids = a.root_id.to_numpy().astype("<u8")
    ids.tofile(OUT / "root_ids.bin")

    write_columns("neurons.bin", {
        "pos": quantize(site),
        "super": sup, "nt": nt, "side": side, "flow": flow,
        "cls": ccls, "sub": csub, "type": ctype, "lineage": lin, "nerve": nerve,
        "soma": has_soma.astype("u1"),
        "inNp": in_np, "outNp": out_np,
        "inSyn": in_syn, "outSyn": out_syn,
    })
    meta = {
        "count": n,
        "superClasses": super_order, "nts": nt_order, "sides": side_order, "flows": flow_order,
        "cellClasses": ccls_order, "subClasses": csub_order, "cellTypes": ctype_order,
        "lineages": lin_order, "nerves": nerve_order, "neuropils": NEUROPILS,
        "quant": 20,
        "bounds": {"min": site.min(0).round(1).tolist(), "max": site.max(0).round(1).tolist()},
    }
    write_json("neurons.json", meta)
    print(n, "neurons", {k: len(v) for k, v in meta.items() if isinstance(v, list)})
    print("site bounds", meta["bounds"])
    print("synapses in/out", int(in_syn.sum()), int(out_syn.sum()))

if __name__ == "__main__":
    main()

"""Connectivity assets from FlyWire v783 proofread connections (Zenodo 10676866).

Writes
  data/connectome.json   headline numbers, class x class matrix, region flow,
                         transmitter mix, distributions, hub neurons
  data/arcs.bin          a weighted sample of strong connections for 3D arcs
  data/partners/p###.bin top input/output partners per neuron, sharded
"""
import json

import numpy as np
import pandas as pd

from common import OUT, RAW, root_index, write_columns, write_json

SHARD = 2048          # neurons per partner shard
TOP = 8               # partners kept per direction
NT_COLS = ["ach_avg", "glut_avg", "gaba_avg", "da_avg", "ser_avg", "oct_avg"]
NT_NAMES = ["acetylcholine", "glutamate", "gaba", "dopamine", "serotonin", "octopamine"]

def main():
    meta = json.load(open(OUT / "neurons.json"))
    np_names = meta["neuropils"]
    np_lut = {n: i for i, n in enumerate(np_names)}
    ridx = root_index()
    n = meta["count"]

    hdr_len = int(np.fromfile(OUT / "neurons.bin", "<u4", 1)[0])
    raw = (OUT / "neurons.bin").read_bytes()
    hdr = json.loads(raw[4:4 + hdr_len])
    def col(k):
        e = hdr[k]
        return np.frombuffer(raw, np.dtype(e["dtype"]), int(np.prod(e["shape"])), 4 + hdr_len + e["offset"]).reshape(e["shape"])
    sup = col("super").astype(int)
    ctype = col("type").astype(int)

    c = pd.read_feather(RAW / "proofread_connections_783.feather")
    c["pre"] = c.pre_pt_root_id.map(ridx)
    c["post"] = c.post_pt_root_id.map(ridx)
    dropped = int(c.pre.isna().sum() + c.post.isna().sum())
    c = c.dropna(subset=["pre", "post"])
    c["pre"] = c.pre.astype(np.int64)
    c["post"] = c.post.astype(np.int64)
    c["nt"] = np.argmax(c[NT_COLS].to_numpy(), axis=1)
    c["np"] = c.neuropil.map(lambda s: np_lut.get(s, np_lut["UNASGD"]))

    # pairs: total synapses and dominant neuropil
    c = c.sort_values("syn_count", ascending=False)
    pairs = c.groupby(["pre", "post"], sort=False).agg(syn=("syn_count", "sum"), np=("np", "first"), nt=("nt", "first")).reset_index()
    print("pairs", len(pairs), "dropped rows", dropped)

    # --- headline numbers & distributions
    syn_by_nt = c.groupby("nt").syn_count.sum().reindex(range(6), fill_value=0)
    strong = pairs[pairs.syn >= 5]
    outdeg_all = np.bincount(pairs.pre, minlength=n)
    indeg_all = np.bincount(pairs.post, minlength=n)
    outdeg5 = np.bincount(strong.pre, minlength=n)
    indeg5 = np.bincount(strong.post, minlength=n)

    syn_hist_edges = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 3000]
    syn_hist = np.histogram(pairs.syn, bins=syn_hist_edges)[0]
    deg = outdeg5 + indeg5
    deg_edges = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 20000]
    deg_hist = np.histogram(deg, bins=deg_edges)[0]

    # class x class synapse matrix
    S = len(meta["superClasses"])
    cls_mat = np.zeros((S, S), dtype=np.int64)
    np.add.at(cls_mat, (sup[pairs.pre.to_numpy()], sup[pairs.post.to_numpy()]), pairs.syn.to_numpy())

    # region flow: each neuron carries input from region A to output region B
    npj = json.load(open(OUT / "neuropils.json"))
    systems = [s["id"] for s in npj["systems"]]
    sys_of = {m["name"]: systems.index(m["system"]) for m in npj["meshes"] if m["system"] in systems}
    pre_np = pd.read_feather(RAW / "per_neuron_neuropil_count_pre_783.feather")
    post_np = pd.read_feather(RAW / "per_neuron_neuropil_count_post_783.feather")
    pre_np = pre_np[pre_np.pre_pt_root_id.isin(ridx.keys())]
    post_np = post_np[post_np.post_pt_root_id.isin(ridx.keys())]
    pre_np["sys"] = pre_np.neuropil.map(sys_of)
    post_np["sys"] = post_np.neuropil.map(sys_of)
    pre_np = pre_np.dropna(subset=["sys"]); post_np = post_np.dropna(subset=["sys"])
    out_by = pre_np.groupby(["pre_pt_root_id", "sys"])["count"].sum().unstack(fill_value=0)
    in_by = post_np.groupby(["post_pt_root_id", "sys"])["count"].sum().unstack(fill_value=0)
    common_ids = out_by.index.intersection(in_by.index)
    I = in_by.loc[common_ids].reindex(columns=range(len(systems)), fill_value=0).to_numpy(float)
    O = out_by.loc[common_ids].reindex(columns=range(len(systems)), fill_value=0).to_numpy(float)
    I = I / np.maximum(I.sum(1, keepdims=True), 1)
    flow = I.T @ O   # [from system, to system] output synapses routed from input region

    # hubs
    hub_order = np.argsort(-(indeg5 + outdeg5))[:24]
    hubs = [{"index": int(i), "type": meta["cellTypes"][ctype[i]], "super": meta["superClasses"][sup[i]],
             "in": int(indeg5[i]), "out": int(outdeg5[i])} for i in hub_order]

    write_json("connectome.json", {
        "neurons": n, "neuronsInDataset": 139255,
        "synapses": int(c.syn_count.sum()), "pairs": int(len(pairs)), "pairs5": int(len(strong)),
        "synapsesInPairs5": int(strong.syn.sum()), "maxPairSynapses": int(pairs.syn.max()),
        "medianPartners5": {"in": float(np.median(indeg5)), "out": float(np.median(outdeg5))},
        "synByNt": {NT_NAMES[i]: int(v) for i, v in syn_by_nt.items()},
        "synHist": {"edges": syn_hist_edges, "counts": syn_hist.tolist()},
        "degreeHist": {"edges": deg_edges, "counts": deg_hist.tolist()},
        "classMatrix": {"classes": meta["superClasses"], "synapses": cls_mat.tolist()},
        "systemFlow": {"systems": systems, "flow": np.round(flow).astype(np.int64).tolist()},
        "hubs": hubs,
    })

    # --- arcs: weighted sample of strong connections
    rng = np.random.default_rng(3)
    cand = pairs[pairs.syn >= 8]
    k = min(36000, len(cand))
    p = cand.syn.to_numpy(float) ** 0.7
    pick = rng.choice(len(cand), size=k, replace=False, p=p / p.sum())
    arcs = cand.iloc[np.sort(pick)].sort_values("syn")
    write_columns("arcs.bin", {
        "pre": arcs.pre.to_numpy().astype("<u4"), "post": arcs.post.to_numpy().astype("<u4"),
        "np": arcs.np.to_numpy().astype("u1"), "nt": arcs.nt.to_numpy().astype("u1"),
        "syn": np.minimum(arcs.syn.to_numpy(), 65535).astype("<u2"),
    })
    print("arcs", k)

    # --- partner shards
    (OUT / "partners").mkdir(exist_ok=True)
    top_out = pairs.sort_values(["pre", "syn"], ascending=[True, False]).groupby("pre").head(TOP)
    top_in = pairs.sort_values(["post", "syn"], ascending=[True, False]).groupby("post").head(TOP)
    total = 0
    for s in range((n + SHARD - 1) // SHARD):
        lo, hi = s * SHARD, min(n, (s + 1) * SHARD)
        cols = {}
        for key, df, own, other in (("out", top_out, "pre", "post"), ("in", top_in, "post", "pre")):
            part = df[(df[own] >= lo) & (df[own] < hi)]
            counts = np.bincount(part[own] - lo, minlength=hi - lo)
            cols[key + "Off"] = np.concatenate([[0], np.cumsum(counts)]).astype("<u4")
            cols[key + "Idx"] = part[other].to_numpy().astype("<u4")
            cols[key + "Syn"] = np.minimum(part.syn.to_numpy(), 65535).astype("<u2")
        cols["deg"] = np.minimum(np.stack([indeg_all[lo:hi], outdeg_all[lo:hi], indeg5[lo:hi], outdeg5[lo:hi]], 1), 65535).astype("<u2")
        write_columns(f"partners/p{s:03d}.bin", cols)
        total += (OUT / f"partners/p{s:03d}.bin").stat().st_size
    print("partner shards", s + 1, "total MB", round(total / 1e6, 2))

if __name__ == "__main__":
    main()

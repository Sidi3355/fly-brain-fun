"""Build data/featured.{bin,json} and data/forest.{bin,json}: simplified neuron skeletons.

Source: FlyWire v783 precomputed skeletons (gs://flywire_v141_m783, dir
skeletons_mip_1; vertices in nanometres, FlyWire/FAFB space). Raw skeletons
(vertices + edges, radius attributes dropped) are cached as
FLY_RAW/skel_cache/<root_id>.npz, so re-runs skip the download.

Per neuron:
  1. graph from vertices/edges; extra connected components are bridged to
     the largest one through their nearest vertex pair (fragments shorter
     than MIN_FRAG_UM of cable are dropped),
  2. root = vertex nearest the soma (annotation soma, else pos),
  3. spanning tree by BFS from the root (breaks small cycles),
  4. prune terminal twigs shorter than PRUNE x spacing (a branch never
     loses all of its children), keep root / branch points / leaves and
     one vertex per `spacing` um of path length along unbranched runs.
     `spacing` is chosen per neuron from a ladder (1.5 um.. for featured,
     4 um.. for forest) by a water-filling vertex cap (allocate()) so the
     file fits its byte budget: small neurons keep the finest spacing, big
     ones get coarser (their cap grows as size^ALPHA),
  5. vertices sorted by path distance from the root (so every parent comes
     before its children) and written as pos int16 (site frame, QUANT/um),
     parent int32 (local index, root = -1), dist uint8 (0..255 of the
     neuron's max path distance).

Output columns (write_columns): pos (V,3) <i2, parent (V,) <i4, dist (V,) u1,
nIndex (M,) <u4 neuron index, vStart (M,) <u4, vCount (M,) <u4.

Usage: python build_skeletons.py [--only featured|forest] [--workers 12]
"""
import argparse
import json
import os
import threading
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import breadth_first_order, connected_components
from scipy.spatial import cKDTree

from common import ANNOT_VOXEL_NM, OUT, RAW, nm_to_site, quantize, root_index, write_columns, write_json

try:
    from numba import njit
except ImportError:  # pure-Python fallback (slow but correct)
    def njit(*args, **kwargs):
        if args and callable(args[0]):
            return args[0]
        return lambda f: f

SRC = "precomputed://gs://flywire_v141_m783"
CACHE = Path(os.environ.get("FLY_SKEL_CACHE", RAW / "skel_cache"))
ANNOT = RAW / "flywire_annotations/supplemental_files/Supplemental_file1_neuron_annotations.tsv"
CONNECTIONS = RAW / "proofread_connections_783.feather"

MIN_FRAG_UM = 3.0      # drop disconnected skeleton fragments with less cable than this
FINE_UM = 0.5          # intermediate resolution kept in memory between passes
PRUNE = 2.0            # featured: prune terminal twigs shorter than PRUNE * spacing
BYTES_PER_VERTEX = 6 + 4 + 1
BYTES_PER_NEURON = 12

FEATURED_BUDGET = 3.5e6
FEATURED_SPACINGS = [1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0]  # per-neuron ladder
FOREST_BUDGET = (4.5e6, 6.0e6)
FOREST_SPACINGS = [4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 16.0, 20.0]  # per-neuron ladder
FOREST_PRUNE = 2.0         # forest twig pruning, x spacing
ALPHA = 0.7                # vertex-cap growth with neuron size, see allocate()
FOREST_SCALE = 1.0         # multiplier on the big-class forest targets

# --------------------------------------------------------------------------
# fetching + cache


_local = threading.local()


def _cv():
    if not hasattr(_local, "cv"):
        from cloudvolume import CloudVolume
        _local.cv = CloudVolume(SRC, use_https=True, progress=False)
    return _local.cv


def cache_path(rid):
    return CACHE / f"{int(rid)}.npz"


def _save(rid, v, e):
    tmp = CACHE / f".{int(rid)}.{threading.get_ident()}.tmp.npz"
    np.savez_compressed(tmp, v=np.asarray(v, np.float32), e=np.asarray(e, np.uint32))
    os.replace(tmp, cache_path(rid))


def _fetch_batch(ids):
    """Fetch a batch of skeletons into the cache. Returns list of failed ids."""
    failed = []
    try:
        sks = _cv().skeleton.get(ids)
        got = {int(s.id): s for s in sks}
    except Exception:
        got = {}
    for rid in ids:
        s = got.get(int(rid))
        if s is None:
            for attempt in range(3):
                try:
                    s = _cv().skeleton.get(int(rid))
                    break
                except Exception as exc:  # noqa: PERF203
                    err = exc
                    time.sleep(1 + attempt)
        if s is None or len(s.vertices) == 0:
            failed.append(int(rid))
            _save(rid, np.zeros((0, 3)), np.zeros((0, 2)))   # negative cache
            continue
        _save(rid, s.vertices, s.edges)
    return failed


def ensure_cached(ids, workers=12, batch=8):
    CACHE.mkdir(parents=True, exist_ok=True)
    todo = [int(r) for r in dict.fromkeys(ids) if not cache_path(r).exists()]
    if not todo:
        return
    print(f"fetching {len(todo)} skeletons ({len(ids) - len(todo)} cached)", flush=True)
    t0, done, failed = time.time(), 0, []
    batches = [todo[i:i + batch] for i in range(0, len(todo), batch)]
    with ThreadPoolExecutor(workers) as pool:
        futs = [pool.submit(_fetch_batch, b) for b in batches]
        for f in as_completed(futs):
            failed += f.result()
            done += 1
            if done % 50 == 0 or done == len(batches):
                n = min(done * batch, len(todo))
                print(f"  {n}/{len(todo)}  {n / (time.time() - t0):.1f}/s", flush=True)
    if failed:
        print(f"  {len(failed)} skeletons failed to fetch: {failed[:10]}...", flush=True)


def load_raw(rid):
    z = np.load(cache_path(rid))
    return z["v"], z["e"]


# --------------------------------------------------------------------------
# tree building + simplification


@njit(cache=True)
def _path_dist(parent, seg):
    d = np.zeros(parent.shape[0], np.float32)
    for i in range(1, parent.shape[0]):
        d[i] = d[parent[i]] + seg[i]
    return d


def build_tree(v_nm, e, root_nm):
    """Raw skeleton -> (pos site-um float32, parent int32, dist um float32) in BFS order."""
    n = len(v_nm)
    if n == 0:
        return None
    e = e.astype(np.int64)
    g = coo_matrix((np.ones(len(e), np.int8), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
    ncomp, lab = connected_components(g, directed=False)
    if ncomp > 1:
        # cable per component; bridge every non-trivial fragment to the largest component
        elen = np.linalg.norm(v_nm[e[:, 0]] - v_nm[e[:, 1]], axis=1) / 1000.0
        cable = np.bincount(lab[e[:, 0]], weights=elen, minlength=ncomp)
        main = int(np.argmax(cable))
        keep = cable >= MIN_FRAG_UM
        keep[main] = True
        in_main = lab == main
        others = np.flatnonzero(keep[lab] & ~in_main)
        extra = []
        if len(others):
            d, j = cKDTree(v_nm[in_main]).query(v_nm[others])
            main_idx = np.flatnonzero(in_main)
            df = pd.DataFrame({"c": lab[others], "d": d, "a": others, "b": main_idx[j]})
            best = df.loc[df.groupby("c")["d"].idxmin()]
            extra = best[["a", "b"]].to_numpy()
        if len(extra):
            e = np.vstack([e, extra])
            g = coo_matrix((np.ones(len(e), np.int8), (e[:, 0], e[:, 1])), shape=(n, n)).tocsr()
        alive = keep[lab]
    else:
        alive = np.ones(n, bool)
    cand = np.flatnonzero(alive)
    root = int(cand[np.argmin(((v_nm[cand] - root_nm) ** 2).sum(1))])
    order, pred = breadth_first_order(g, root, directed=False, return_predecessors=True)
    new = np.full(n, -1, np.int64)
    new[order] = np.arange(len(order))
    pred = pred[order]
    pred[0] = root
    parent = new[pred].astype(np.int32)
    parent[0] = -1
    pos = nm_to_site(v_nm[order])
    seg = np.zeros(len(order), np.float32)
    seg[1:] = np.linalg.norm(pos[1:] - pos[parent[1:]], axis=1)
    return pos, parent, _path_dist(parent, seg)


@njit(cache=True)
def _simplify(parent, dist, spacing, prune_len, prune_iters):
    """Return kept-mask and new parent (old index of nearest kept ancestor).

    Input must be in parent-before-child order with root at 0.
    """
    n = parent.shape[0]
    alive = np.ones(n, np.bool_)
    nchild = np.zeros(n, np.int32)
    top = np.zeros(n, np.int64)     # nearest keypoint ancestor (exclusive)
    for _ in range(prune_iters):
        nchild[:] = 0
        for i in range(1, n):
            if alive[i]:
                nchild[parent[i]] += 1
        # nearest branch-point/root ancestor of each vertex
        for i in range(1, n):
            if not alive[i]:
                continue
            p = parent[i]
            if p == 0 or nchild[p] != 1:
                top[i] = p
            else:
                top[i] = top[p]
        # candidate twigs: leaf whose run up to its top is short
        ncand = np.zeros(n, np.int32)
        best_len = np.full(n, -1.0)
        best_leaf = np.full(n, -1, np.int64)
        for i in range(1, n):
            if alive[i] and nchild[i] == 0:
                t = top[i]
                if nchild[t] >= 2 or t == 0:
                    ln = dist[i] - dist[t]
                    if ln < prune_len:
                        ncand[t] += 1
                        if ln > best_len[t]:
                            best_len[t] = ln
                            best_leaf[t] = i
        changed = False
        for i in range(1, n):
            if alive[i] and nchild[i] == 0:
                t = top[i]
                if (nchild[t] >= 2 or t == 0) and dist[i] - dist[t] < prune_len:
                    if ncand[t] >= nchild[t] and best_leaf[t] == i:
                        continue            # never strip a branch point bare
                    # remove the run leaf -> (exclusive) top
                    j = i
                    while j != t:
                        alive[j] = False
                        j = parent[j]
                    changed = True
        if not changed:
            break
    # final topology
    nchild[:] = 0
    for i in range(1, n):
        if alive[i]:
            nchild[parent[i]] += 1
    key = np.zeros(n, np.bool_)
    key[0] = True
    for i in range(1, n):
        if alive[i] and nchild[i] != 1:
            key[i] = True
    topd = np.zeros(n, np.float32)
    for i in range(1, n):
        if alive[i]:
            p = parent[i]
            topd[i] = dist[p] if key[p] else topd[p]
    # distance of the next keypoint downstream (single-child runs), reverse order
    child = np.full(n, -1, np.int64)
    for i in range(1, n):
        if alive[i]:
            child[parent[i]] = i
    downd = np.zeros(n, np.float32)
    for i in range(n - 1, -1, -1):
        if alive[i]:
            if key[i]:
                downd[i] = dist[i]
            else:
                downd[i] = downd[child[i]]
    keep = np.zeros(n, np.bool_)
    for i in range(n):
        if not alive[i]:
            continue
        if key[i]:
            keep[i] = True
            continue
        p = parent[i]
        if np.floor((dist[i] - topd[i]) / spacing) > np.floor((dist[p] - topd[i]) / spacing):
            if downd[i] - dist[i] >= 0.4 * spacing:
                keep[i] = True
    kanc = np.zeros(n, np.int64)   # nearest kept ancestor-or-self
    newpar = np.full(n, -1, np.int64)
    for i in range(n):
        if not alive[i]:
            continue
        if i > 0:
            newpar[i] = kanc[parent[i]]
        kanc[i] = i if keep[i] else kanc[parent[i]]
    return keep, newpar


def simplify(tree, spacing, prune_len, prune_iters=2):
    """tree (pos, parent, dist) -> reduced tree, re-sorted by path distance."""
    pos, parent, dist = tree
    keep, newpar = _simplify(parent, dist, np.float32(spacing), np.float32(prune_len), prune_iters)
    idx = np.flatnonzero(keep)
    idx = idx[np.argsort(dist[idx], kind="stable")]     # parents precede children
    remap = np.full(len(parent), -1, np.int64)
    remap[idx] = np.arange(len(idx))
    par = remap[newpar[idx]].astype(np.int32)
    par[0] = -1
    return pos[idx], par, dist[idx]


def encode(tree):
    pos, par, dist = tree
    dmax = float(dist.max()) if len(dist) else 0.0
    d8 = np.round(dist / dmax * 255).astype(np.uint8) if dmax > 0 else np.zeros(len(dist), np.uint8)
    return quantize(pos), par.astype("<i4"), d8


def fine_tree(args):
    """Worker: cached raw skeleton -> tree at FINE_UM resolution (or None)."""
    rid, root_nm = args
    try:
        v, e = load_raw(rid)
        t = build_tree(v, e, np.asarray(root_nm))
        if t is None:
            return rid, None, 0
        return rid, simplify(t, FINE_UM, 1.0, 1), len(v)
    except Exception as exc:
        print("  failed", rid, repr(exc), flush=True)
        return rid, None, 0


def fine_trees(rids, root_nm, procs):
    """Process neurons in parallel -> {rid: fine tree} (missing if failed)."""
    out = {}
    jobs = [(int(r), root_nm[int(r)]) for r in rids]
    t0 = time.time()
    with ProcessPoolExecutor(procs) as pool:
        for k, (rid, t, _) in enumerate(pool.map(fine_tree, jobs, chunksize=8)):
            if t is not None and len(t[0]) > 0:
                out[rid] = t
            if (k + 1) % 1000 == 0:
                print(f"  processed {k + 1}/{len(jobs)} ({time.time() - t0:.0f}s)", flush=True)
    return out


def pack(order, trees, spacings, prune_mult):
    """order: rids with trees; spacings: per-neuron spacing (um) -> columns for write_columns."""
    rows = [encode(simplify(trees[r], s, prune_mult * s)) for r, s in zip(order, spacings)]
    counts = np.array([len(r[0]) for r in rows], np.uint32)
    starts = np.zeros(len(rows), np.uint32)
    starts[1:] = np.cumsum(counts)[:-1]
    ridx = root_index()
    return {
        "pos": np.concatenate([r[0] for r in rows]).reshape(-1, 3),
        "parent": np.concatenate([r[1] for r in rows]),
        "dist": np.concatenate([r[2] for r in rows]),
        "nIndex": np.array([ridx[int(r)] for r in order], "<u4"),
        "vStart": starts.astype("<u4"),
        "vCount": counts.astype("<u4"),
    }


def ladder_counts(trees, order, ladder, prune_mult):
    """(M, L) vertex count of every neuron at every spacing of the ladder."""
    return np.array([[len(simplify(trees[r], s, prune_mult * s)[0]) for s in ladder] for r in order])


def allocate(counts, budget_vertices, alpha=0.5):
    """Water-filling vertex cap. Neuron i may use up to cap * (c_i / median c)^alpha
    vertices (c = its count at the finest spacing) and gets the finest ladder
    spacing within that; cap is the largest value whose total fits the budget.
    alpha=0 -> equal cap for all, alpha=1 -> one uniform spacing. Small neurons
    keep full detail; big ones are coarsened, but keep more vertices."""
    m, L = counts.shape
    c0 = counts[:, 0].astype(float)
    rel = np.maximum(c0 / max(np.median(c0), 1.0), 1.0) ** alpha

    def pick(cap):
        ok = counts <= cap * rel[:, None]
        idx = np.where(ok.any(1), ok.argmax(1), L - 1)
        return idx, int(counts[np.arange(m), idx].sum())

    lo, hi = 1.0, float(counts.max())
    if pick(hi)[1] <= budget_vertices:
        return pick(hi)[0], hi
    for _ in range(40):
        mid = (lo + hi) / 2
        if pick(mid)[1] <= budget_vertices:
            lo = mid
        else:
            hi = mid
    return pick(lo)[0], lo


# --------------------------------------------------------------------------
# neuron selection


def load_annotations():
    a = pd.read_csv(ANNOT, sep="\t", low_memory=False).sort_values("root_id").reset_index(drop=True)
    has_soma = a.soma_x.notna().to_numpy()
    vox = np.where(has_soma[:, None], a[["soma_x", "soma_y", "soma_z"]].to_numpy(float),
                   a[["pos_x", "pos_y", "pos_z"]].to_numpy(float))
    a[["rx", "ry", "rz"]] = vox * ANNOT_VOXEL_NM           # skeleton root target, nm
    for c in ("cell_type", "cell_class", "cell_sub_class", "super_class", "side", "hemibrain_type"):
        a[c] = a[c].fillna("")
    return a


def spread(df, n, seed, strata=("side",)):
    """Deterministic sample of up to n root ids, round-robin across strata
    (e.g. side, or cell_type+side) so rare strata are represented."""
    if n is None or len(df) <= n:
        return [int(r) for r in df.root_id]
    rng = np.random.default_rng(seed)
    groups = [g.root_id.to_numpy()[rng.permutation(len(g))]
              for _, g in df.groupby(list(strata), sort=True)]
    groups = [groups[i] for i in rng.permutation(len(groups))]
    out, k = [], 0
    while len(out) < n:
        for g in groups:
            if k < len(g) and len(out) < n:
                out.append(int(g[k]))
        k += 1
    return out


def nearest(df, center_nm, n):
    d = ((df[["rx", "ry", "rz"]].to_numpy() - center_nm) ** 2).sum(1)
    return [int(r) for r in df.root_id.to_numpy()[np.argsort(d)[:n]]]


def lh_targets_of(a, pn_ids, n):
    """Top-n central neurons receiving the most lateral-horn synapses from pn_ids."""
    import pyarrow.compute as pc
    import pyarrow.feather as feather
    t = feather.read_table(CONNECTIONS, columns=["pre_pt_root_id", "post_pt_root_id", "neuropil", "syn_count"])
    t = t.filter(pc.is_in(t["pre_pt_root_id"], value_set=__import__("pyarrow").array(pn_ids, "int64")))
    c = t.to_pandas()
    c = c[c.neuropil.isin(["LH_L", "LH_R"])]
    w = c.groupby("post_pt_root_id").syn_count.sum()
    info = a.set_index("root_id").reindex(w.index)
    ok = (info.super_class == "central") & ~info.cell_class.isin(["ALPN", "ALLN", "Kenyon_Cell"])
    w = w[ok.to_numpy()].sort_values(ascending=False, kind="stable")
    # balance sides: alternate the strongest left and right targets
    side = info.loc[w.index, "side"]
    L = [int(r) for r in w.index[side.to_numpy() == "left"]]
    R = [int(r) for r in w.index[side.to_numpy() == "right"]]
    out = [x for pair in zip(L, R) for x in pair][:n]
    return out


def cable_um(rid):
    v, e = load_raw(rid)
    if len(e) == 0:
        return 0.0
    return float(np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1).sum() / 1000)


def featured_selection(a, workers):
    ct = a.cell_type
    T = lambda *types: a[ct.isin(types)]
    groups = []

    def group(gid, *parts):
        ids = []
        for p in parts:
            ids += [r for r in p if r not in ids]
        groups.append({"id": gid, "rids": ids})

    group("compass", spread(T("EPG"), None, 7), spread(T("PEN_a(PEN1)"), None, 7),
          spread(T("PEN_b(PEN2)"), None, 7), spread(T("Delta7"), 20, 7))
    group("giant-fiber", spread(T("DNp01"), None, 7))
    group("looming", spread(T("LC4"), 24, 7), spread(T("LPLC2"), 24, 7))
    group("moonwalker", spread(T("MDN"), None, 7))
    group("steering", spread(T("DNa02"), None, 7), spread(T("DNa01"), None, 7))
    group("memory", spread(a[a.cell_class == "MBON"], 60, 7, ("cell_type", "side")),
          spread(T("APL"), None, 7), spread(T("DPM"), None, 7),
          spread(a[a.cell_class == "Kenyon_Cell"], 90, 7, ("cell_type", "side")))
    # T4/T5: one retinotopic neighbourhood in the right optic lobe (nearest somata to a seed T4a)
    t45 = a[ct.str.fullmatch(r"T[45][abcd]") & (a.side == "right")]
    t4a = t45[t45.cell_type == "T4a"]
    med = t4a[["rx", "ry", "rz"]].median().to_numpy()
    seed = t4a.iloc[int(np.argmin(((t4a[["rx", "ry", "rz"]].to_numpy() - med) ** 2).sum(1)))]
    center = seed[["rx", "ry", "rz"]].to_numpy(float)
    motion = [nearest(t45[t45.cell_type == t], center, 8) for t in
              ["T4a", "T4b", "T4c", "T4d", "T5a", "T5b", "T5c", "T5d"]]
    group("motion", *motion, spread(T("CT1"), None, 7))
    group("lobula-plate", spread(T("HSN", "HSE", "HSS"), None, 7),
          spread(T(*[f"VS{i}" for i in range(1, 9)]), None, 7))
    # taste: sugar/water GRNs + proboscis/ingestion motor neurons (MN9 = CB0701, Shiu et al. 2024)
    grn = a[(a.cell_class == "gustatory") & (a.cell_sub_class == "sugar/water")]
    mn = a[(a.cell_class == "brain_motor_neuron") &
           a.cell_sub_class.isin(["proboscis_motor_neuron", "ingestion_motor_neuron"])]
    rng = np.random.default_rng(7)
    mtypes = sorted(set(mn.cell_type) - {"CB0701"})
    mtypes = ["CB0701"] + [mtypes[i] for i in rng.permutation(len(mtypes))]
    mids = []
    for t in mtypes:
        mids += [int(r) for r in mn[mn.cell_type == t].sort_values("side").root_id]
    group("taste", spread(grn, 30, 7), mids[:20])
    # smell: DA1 ORNs, DA1 PNs, strongest lateral-horn targets of the PNs
    pns = spread(T("DA1_lPN", "DA1_vPN"), None, 7)
    group("smell", spread(T("ORN_DA1"), 30, 7), pns, lh_targets_of(a, pns, 10))
    group("clock", spread(T("s-LNv_a", "s-LNv_b", "l-LNv", "LNd_a", "LNd_b", "LNd_c",
                            "DN1a", "DN1pA", "DN1pB", "APDN3"), None, 7))
    # serotonin: CSD + the 6 largest (by cable) other 5-HT / OA typed neurons
    cand = a[(ct.str.startswith("5-HT") | ct.str.startswith("OA-")) & (ct != "CSD")]
    ensure_cached(cand.root_id.tolist(), workers)
    cab = sorted(((cable_um(r), int(r)) for r in cand.root_id), reverse=True)
    group("serotonin", spread(T("CSD"), None, 7), [r for _, r in cab[:6]])
    return groups


FOREST_TARGET = {           # neurons per super_class (None = all)
    "optic": 2400, "central": 1500, "sensory": 800, "visual_projection": 720,
    "descending": 300, "ascending": 300, "visual_centrifugal": 250,
    "sensory_ascending": 120, "motor": None, "endocrine": None,
}


def forest_selection(a, scale=1.0):
    """Stratified whole-brain sample. Prefix-stable: every stratum is shuffled
    once (seed 11), so a smaller `scale` gives a subset of a larger one."""
    ids = []
    for k, (sc, n) in enumerate(FOREST_TARGET.items()):
        df = a[a.super_class == sc]
        if n is not None and sc not in ("descending", "ascending", "visual_centrifugal", "motor", "endocrine"):
            n = int(round(n * scale))
        if n is None or n >= len(df):
            ids += [int(r) for r in df.root_id]
            continue
        rng = np.random.default_rng([11, k])
        if sc == "sensory":
            # sqrt-proportional allocation over cell classes so all modalities show up
            cls = df.cell_class.replace("", "unknown")
            cnt = cls.value_counts().sort_index()
            w = np.sqrt(cnt.to_numpy())
            alloc = np.minimum(cnt.to_numpy(), np.floor(w / w.sum() * n).astype(int))
            for c, m in zip(cnt.index, alloc):
                sub = df[cls == c].root_id.to_numpy()
                ids += [int(r) for r in sub[rng.permutation(len(sub))[:m]]]
        else:
            sub = df.root_id.to_numpy()
            ids += [int(r) for r in sub[rng.permutation(len(sub))[:n]]]
    return ids


# --------------------------------------------------------------------------
# outputs


def file_size(cols):
    # write_columns layout: 4 + header + 8-byte aligned arrays (header ~300 bytes)
    return 512 + sum(np.asarray(c).nbytes + 8 for c in cols.values())


def build_columns(trees, order, ladder, prune_mult, budget_bytes):
    """Per-neuron spacing from `ladder` (water-filled vertex cap) fitting budget_bytes."""
    t0 = time.time()
    counts = ladder_counts(trees, order, ladder, prune_mult)
    budget_v = int((budget_bytes - 1024 - BYTES_PER_NEURON * len(order)) / BYTES_PER_VERTEX)
    idx, cap = allocate(counts, budget_v, ALPHA)
    spacings = np.asarray(ladder)[idx]
    cols = pack(order, trees, spacings, prune_mult)
    hist = {float(s): int((spacings == s).sum()) for s in ladder if (spacings == s).any()}
    print(f"  vertex cap {cap}/neuron -> {len(cols['dist'])} vertices, {file_size(cols) / 1e6:.2f} MB; "
          f"neurons per spacing {hist} ({time.time() - t0:.0f}s)", flush=True)
    return cols, spacings, cap, hist


def build_featured(a, root_nm, args):
    print("== featured", flush=True)
    groups = featured_selection(a, args.workers)
    ids = [r for g in groups for r in g["rids"]]
    ensure_cached(ids, args.workers)
    trees = fine_trees(ids, root_nm, args.procs)
    missing = [r for r in ids if r not in trees]
    if missing:
        print(f"  {len(missing)} featured neurons without skeleton: {missing}", flush=True)
    order = [r for r in ids if r in trees]
    cols, spacings, cap, hist = build_columns(trees, order, FEATURED_SPACINGS, PRUNE, FEATURED_BUDGET)
    write_columns("featured.bin", cols)
    info = a.set_index("root_id")
    ridx = root_index()
    meta, start = [], 0
    for g in groups:
        rids = [r for r in g["rids"] if r in trees]
        types = list(dict.fromkeys(info.loc[rids, "cell_type"]))
        meta.append({"id": g["id"], "types": types, "neurons": [ridx[r] for r in rids],
                     "start": start, "count": len(rids)})
        start += len(rids)
    write_json("featured.json", {"groups": meta, "spacing_um": FEATURED_SPACINGS[0],
                                 "spacing_um_max": float(spacings.max()), "prune_x_spacing": PRUNE,
                                 "vertex_cap": round(float(cap)), "neuronsPerSpacing": hist,
                                 "count": len(order), "vertices": int(len(cols["dist"])), "quant": 20})
    size = (OUT / "featured.bin").stat().st_size
    print(f"  featured.bin {size / 1e6:.2f} MB, {len(order)} neurons, {len(cols['dist'])} vertices", flush=True)
    for g in meta:
        print(f"   {g['id']:>13}: {g['count']:>3} neurons  {', '.join(g['types'])}")


def build_forest(a, root_nm, args):
    print("== forest", flush=True)
    ids = forest_selection(a, args.forest_scale)
    ensure_cached(ids, args.workers)
    trees = fine_trees(ids, root_nm, args.procs)
    order = [r for r in ids if r in trees]
    print(f"  {len(order)}/{len(ids)} forest neurons have skeletons", flush=True)
    cols, spacings, cap, hist = build_columns(trees, order, FOREST_SPACINGS, FOREST_PRUNE, FOREST_BUDGET[1])
    write_columns("forest.bin", cols)
    sup = a.set_index("root_id").loc[order, "super_class"].value_counts()
    write_json("forest.json", {"count": len(order), "vertices": int(len(cols["dist"])),
                               "spacing_um": float(np.median(spacings)),
                               "spacing_um_range": [float(spacings.min()), float(spacings.max())],
                               "prune_x_spacing": FOREST_PRUNE, "vertex_cap": round(float(cap)),
                               "neuronsPerSpacing": hist,
                               "bySuper": {k: int(v) for k, v in sup.items()}, "quant": 20})
    size = (OUT / "forest.bin").stat().st_size
    print(f"  forest.bin {size / 1e6:.2f} MB, {len(order)} neurons, {len(cols['dist'])} vertices", flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", choices=["featured", "forest"])
    ap.add_argument("--workers", type=int, default=16, help="download threads")
    ap.add_argument("--procs", type=int, default=os.cpu_count(), help="processing processes")
    ap.add_argument("--forest-scale", type=float, default=FOREST_SCALE,
                    help="multiplier on the optic/central/sensory/VPN forest targets")
    args = ap.parse_args()
    a = load_annotations()
    root_nm = dict(zip(a.root_id.astype(np.int64), a[["rx", "ry", "rz"]].to_numpy()))
    if args.only != "forest":
        build_featured(a, root_nm, args)
    if args.only != "featured":
        build_forest(a, root_nm, args)


if __name__ == "__main__":
    main()

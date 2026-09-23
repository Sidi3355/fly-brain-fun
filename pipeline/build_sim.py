"""Build data/sim/*: whole-brain LIF simulations of sensory stimuli.

Re-implements the leaky integrate-and-fire model of Shiu et al. 2024 (Nature,
"A Drosophila computational brain model reveals sensorimotor processing",
github.com/philshiu/Drosophila_brain_model, model.py) as a numba simulator
that follows Brian2's update schedule step by step, and runs it on the FlyWire
v783 connectome (Connectivity_783.parquet / Completeness_783.csv).

Per time step (dt = 0.1 ms), exactly as Brian2 schedules the Shiu network:
  groups     : non-refractory neurons integrate dv/dt = (v0 - v + g)/t_mbr,
               dg/dt = -g/tau with the exact (method='linear') solution;
               refractory neurons keep v and g frozen ("unless refractory")
  thresholds : v > v_th and not refractory -> spike, lastspike = t
  synapses   : spikes emitted 18 steps (1.8 ms) earlier add w to g of every
               non-refractory postsynaptic partner (w = 0.275 mV x signed
               synapse count; Brian2 blocks on_pre updates of "unless
               refractory" variables in refractory targets);
               Poisson input (rate r_poi, weight 250 x 0.275 mV) adds to v
  resets     : spiking neurons v = v_rst, g = 0
Stimulated neurons have a 0 ms refractory period, all others 2.2 ms.

Usage (from the pipeline dir):
  python build_sim.py              # run all experiments, write data/sim/
  python build_sim.py validate     # compare against the authors' Brian2 output (v630)
  python build_sim.py sugar smell  # run only some experiments (index.json keeps the others)
"""
import json
import sys
import time
from concurrent.futures import ProcessPoolExecutor

import numpy as np
import pandas as pd
from numba import njit

from common import OUT, RAW, root_index, write_columns

SHIU = RAW / "shiu"
CACHE = RAW / "sim_cache"
CACHE.mkdir(exist_ok=True)
SIM_OUT = OUT / "sim"
ANNOT = RAW / "flywire_annotations/supplemental_files/Supplemental_file1_neuron_annotations.tsv"

# ---------------------------------------------------------------- parameters
P = dict(
    v_0=-52.0, v_rst=-52.0, v_th=-45.0,     # mV
    t_mbr=20.0, tau=5.0,                    # ms
    t_rfc=2.2, t_dly=1.8,                   # ms
    w_syn=0.275,                            # mV per synapse
    r_poi=150.0, f_poi=250.0,               # Hz, Poisson weight factor
    dt=0.1,                                 # ms
)
T_RUN_MS = 1000
N_EXTRA = 5            # extra trials used for the mean-rate map
SEED = 20240501        # fixed seed of the replayed trial
SMELL_RATE = 100.0     # Hz; >= ~115 Hz on DA2 ignites the antennal-lobe runaway (see stimuli())
MAX_BYTES = 2_500_000
MN9 = [720575940660219265, 720575940618238523]  # CB0701 = MN9, both sides (v783)
# well-known names of FlyWire cell types (MN9 and aBN1 from the neuron ids in Shiu et al. figures.ipynb)
ALIASES = {"CB0701": "MN9 (proboscis motor neuron)", "DNp01": "Giant Fiber", "SAD093": "aBN1",
           "DA2_lPN": "geosmin projection neuron"}


def _aka(d):
    if d.get("type") in ALIASES:
        d["aka"] = ALIASES[d["type"]]
    return d


# ---------------------------------------------------------------- network
def load_network(version="783"):
    """CSR (rows = presynaptic Shiu index) of weights in mV, cached as npz."""
    f = CACHE / f"net_{version}.npz"
    if f.exists():
        z = np.load(f)
        return dict(ids=z["ids"], indptr=z["indptr"], indices=z["indices"], count=z["count"])
    if version == "783":
        comp, con = SHIU / "Completeness_783.csv", SHIU / "Connectivity_783.parquet"
    else:
        comp, con = (SHIU / "2023_03_23_completeness_630_final.csv",
                     SHIU / "2023_03_23_connectivity_630_final.parquet")
    ids = pd.read_csv(comp, index_col=0).index.to_numpy().astype(np.int64)
    df = pd.read_parquet(con, columns=["Presynaptic_Index", "Postsynaptic_Index", "Excitatory x Connectivity"])
    pre = df["Presynaptic_Index"].to_numpy()
    order = np.argsort(pre, kind="stable")
    pre = pre[order]
    post = df["Postsynaptic_Index"].to_numpy()[order].astype(np.int32)
    cnt = df["Excitatory x Connectivity"].to_numpy()[order].astype(np.int16)  # signed synapse count
    indptr = np.zeros(len(ids) + 1, dtype=np.int64)
    np.cumsum(np.bincount(pre, minlength=len(ids)), out=indptr[1:])
    np.savez(f, ids=ids, indptr=indptr, indices=post, count=cnt)
    return dict(ids=ids, indptr=indptr, indices=post, count=cnt)


# ---------------------------------------------------------------- simulator
@njit(cache=True)
def _lif(indptr, indices, weights, n_neu, stim_idx, stim_p, n_steps, delay, rfc_steps,
         a_v, b_vg, c_g, v0, v_rst, v_th, w_poi, seed, max_spikes):
    np.random.seed(seed)
    v = np.full(n_neu, v0)
    g = np.zeros(n_neu)
    last = np.full(n_neu, -1_000_000_000, dtype=np.int64)
    rfc = np.full(n_neu, rfc_steps, dtype=np.int64)
    for q in range(stim_idx.shape[0]):
        rfc[stim_idx[q]] = 0
    rfc_syn = np.maximum(rfc, 1)
    spk_t = np.empty(max_spikes, dtype=np.int32)
    spk_n = np.empty(max_spikes, dtype=np.int32)
    ptr = np.zeros(n_steps + 1, dtype=np.int64)
    cnt = 0
    for n in range(n_steps):
        ptr[n] = cnt
        # groups + thresholds
        for i in range(n_neu):
            if n - last[i] >= rfc[i]:
                gi = g[i]
                vi = v0 + (v[i] - v0) * a_v + gi * b_vg
                v[i] = vi
                g[i] = gi * c_g
                if vi > v_th:
                    if cnt >= max_spikes:
                        return spk_t[:cnt], spk_n[:cnt], False
                    last[i] = n
                    spk_t[cnt] = n
                    spk_n[cnt] = i
                    cnt += 1
        # synapses: deliver spikes emitted `delay` steps ago. g is an "unless refractory"
        # variable, so Brian2 drops on_pre updates to refractory targets (and to neurons
        # that spiked in this very step, whose not_refractory flag was just cleared)
        if n >= delay:
            for s in range(ptr[n - delay], ptr[n - delay + 1]):
                pre = spk_n[s]
                for j in range(indptr[pre], indptr[pre + 1]):
                    post = indices[j]
                    if n - last[post] >= rfc_syn[post]:
                        g[post] += weights[j]
        # Poisson input to stimulated neurons
        for q in range(stim_idx.shape[0]):
            if np.random.random() < stim_p[q]:
                v[stim_idx[q]] += w_poi
        # resets
        for s in range(ptr[n], cnt):
            i = spk_n[s]
            v[i] = v_rst
            g[i] = 0.0
    ptr[n_steps] = cnt
    return spk_t[:cnt], spk_n[:cnt], True


_NET = {}


def _consts():
    dt, T, tau = P["dt"], P["t_mbr"], P["tau"]
    a_v = np.exp(-dt / T)
    c_g = np.exp(-dt / tau)
    b_vg = tau / (tau - T) * (c_g - a_v)   # exact coupling of g into v over one step
    return a_v, b_vg, c_g


def simulate(stim, seed, t_run_ms=T_RUN_MS, net=None, max_spikes=30_000_000):
    """stim: list of (shiu_index_array, rate_Hz). Returns (step int32, shiu index int32)."""
    net = net or _NET["net"]
    idx = np.concatenate([np.asarray(s, dtype=np.int64) for s, _ in stim]) if stim else np.zeros(0, np.int64)
    prob = np.concatenate([np.full(len(s), r * P["dt"] * 1e-3) for s, r in stim]) if stim else np.zeros(0)
    a_v, b_vg, c_g = _consts()
    t, n, ok = _lif(net["indptr"], net["indices"], net["weights"], len(net["ids"]), idx, prob,
                    int(round(t_run_ms / P["dt"])), int(round(P["t_dly"] / P["dt"])),
                    int(round(P["t_rfc"] / P["dt"])), a_v, b_vg, c_g,
                    P["v_0"], P["v_rst"], P["v_th"], P["w_syn"] * P["f_poi"], seed, max_spikes)
    if not ok:
        raise RuntimeError("spike buffer overflow")
    return t, n


def _trial(args):
    stim, seed = args
    return simulate(stim, seed)


def use_network(version):
    net = load_network(version)
    net["weights"] = net["count"].astype(np.float64) * P["w_syn"]
    _NET["net"] = net
    simulate([(np.array([0]), 150.0)], 0, t_run_ms=2)   # compile before forking workers
    return net


def run_trials(stim, seeds, workers=4):
    with ProcessPoolExecutor(max_workers=min(workers, len(seeds))) as ex:
        return list(ex.map(_trial, [(stim, s) for s in seeds]))


def rates_from(trials, n_neu, t_run_ms=T_RUN_MS):
    counts = np.zeros(n_neu)
    for _, n in trials:
        counts += np.bincount(n, minlength=n_neu)
    return counts / len(trials) / (t_run_ms / 1000.0)


# ---------------------------------------------------------------- validation
def validate():
    """Compare with the authors' own Brian2 output shipped in results/example
    (v630 connectome, 21 right labellar sugar GRNs, 30 trials each)."""
    sets = paper_sets_630()
    net = use_network("630")
    i_of = {int(r): i for i, r in enumerate(net["ids"])}
    sugar = np.array([i_of[r] for r in sets["neu_sugar"]])
    mn9_630 = [720575940660219265, 720575940645521262]
    out = {}
    for name, rate in [("sugarR", 200.0), ("sugarR_100Hz", 100.0)]:
        t0 = time.time()
        trials = run_trials([(sugar, rate)], list(range(1000, 1030)))
        mine = pd.Series(rates_from(trials, len(net["ids"])), index=net["ids"])
        ref = pd.read_parquet(SHIU / f"results/example/{name}.parquet").groupby("flywire_id").size() / 30.0
        both = pd.concat([mine.rename("mine"), ref.rename("brian2")], axis=1).fillna(0)
        act = both[(both.mine > 0) | (both.brian2 > 0)]
        r = np.corrcoef(act.mine, act.brian2)[0, 1]
        out[name] = dict(
            rate_hz=rate, trials=30, secs=round(time.time() - t0, 1),
            active_mine=int((both.mine > 0).sum()), active_brian2=int((both.brian2 > 0).sum()),
            pearson_r_active=round(float(r), 4),
            mean_abs_diff_hz=round(float((act.mine - act.brian2).abs().mean()), 3),
            spikes_per_trial_mine=round(float(sum(len(n) for _, n in trials) / 30), 1),
            spikes_per_trial_brian2=round(float(ref.sum()), 1),
            mn9_mine=[round(float(both.mine.get(m, 0)), 2) for m in mn9_630],
            mn9_brian2=[round(float(both.brian2.get(m, 0)), 2) for m in mn9_630],
        )
        print(name, out[name], flush=True)
    json.dump(out, open(CACHE / "validation.json", "w"), indent=1)
    return out


# ---------------------------------------------------------------- annotations
def load_annotations(ids):
    """Annotation rows aligned to the Shiu index (NaN rows for unannotated ids)."""
    a = pd.read_csv(ANNOT, sep="\t", low_memory=False,
                    usecols=["root_id", "pos_x", "pos_y", "pos_z", "super_class", "cell_class",
                             "cell_sub_class", "cell_type", "hemibrain_type", "side"])
    a["ct"] = a.cell_type.fillna(a.hemibrain_type)          # same label rule as build_neurons.py
    a = a.drop_duplicates("root_id").set_index("root_id").reindex(ids)
    fallback = a.cell_class.fillna(a.super_class).fillna("unannotated") + " (untyped)"
    a["label"] = a.ct.fillna(fallback)
    return a


# ---------------------------------------------------------------- stimuli
def paper_sets_630():
    """Neuron id lists defined in the authors' figures.ipynb (FlyWire v630), cached as json."""
    f = CACHE / "paper_sets_630.json"
    if not f.exists():
        import re
        nb = json.load(open(SHIU / "figures.ipynb"))
        src = "\n".join("".join(c["source"]) for c in nb["cells"] if c["cell_type"] == "code")
        names = ["neu_sugar", "neu_bitter", "neu_ir94e", "neu_water", "neu_JON_CE", "neu_JON_F",
                 "neu_JON_D_m", "neu_sugar_left", "three_inhibitory"]
        sets = {k: [int(x) for x in re.findall(r"\d{18}", re.search(k + r"\s*=\s*\[([^\]]*)\]", src).group(1))]
                for k in names}
        json.dump(sets, open(f, "w"))
    return json.load(open(f))


def paper_sets():
    """Neuron sets of figures.ipynb (FlyWire v630) mapped to v783. All but four ids are
    unchanged in v783; those four were matched by synaptic-partner overlap (best match
    shares 85-97 % of the v630 partners' synapses, runner-up <= 58 %)."""
    sets = paper_sets_630()
    remap = {720575940620900446: 720575940639259967, 720575940627961104: 720575940630882039,
             720575940618600651: 720575940619072513, 720575940626307902: 720575940625054647}
    return {k: [remap.get(r, r) for r in v] for k, v in sets.items()}


def eye_patch(a, types, side, n):
    """n photoreceptors of `types` on `side` nearest to a central neuron of that eye (by annotation position)."""
    m = a.ct.isin(types) & (a.side == side) & a.cell_sub_class.isna()     # skip dorsal-rim (DRA) cells
    pos = a.loc[m, ["pos_x", "pos_y", "pos_z"]].to_numpy(float) * [4, 4, 40] / 1000.0
    ids = a.index[m.to_numpy()]
    c = np.median(pos, axis=0)
    seed = np.argmin(((pos - c) ** 2).sum(1))
    d = ((pos - pos[seed]) ** 2).sum(1)
    return list(ids[np.argsort(d)[:n]])


def stimuli(a):
    ps = paper_sets()
    ct = a.ct
    def of(mask):
        return list(a.index[mask.to_numpy()])
    bitter_types = ["LB1a,LB1d", "LB1b", "LB1c"]
    sugar = ps["neu_sugar"] + ps["neu_sugar_left"]
    bitter = of(ct.isin(bitter_types))
    S = {}
    S["sugar"] = dict(
        label="Taste: sugar", ids=sugar,
        description="Labellar sugar-sensing gustatory receptor neurons (GRNs), both sides: the 21 + 10 "
                    "neurons stimulated in Shiu et al. (Fig. 1, S1), mapped to FlyWire v783, driven at 150 Hz.")
    S["bitter"] = dict(
        label="Taste: bitter", ids=bitter,
        description="Labellar bitter GRNs (types LB1a/d, LB1b, LB1c = the Shiu et al. Fig. 3 bitter set), "
                    "both sides, driven at 150 Hz.")
    S["sugar_bitter"] = dict(
        label="Sugar + bitter", ids=sugar + bitter,
        description="Sugar and bitter GRNs driven together at 150 Hz each: bitter input suppresses the "
                    "sugar-evoked feeding motor output (Shiu et al. Fig. 3a).")
    S["smell"] = dict(
        label="Smell: geosmin (DA2)", ids=of((ct == "ORN_DA2") & (a.side == "right")), rate=SMELL_RATE,
        description=f"Olfactory receptor neurons of glomerulus DA2 (Or56a; geosmin, the smell of mould that "
                    f"flies innately avoid) in the right antenna, driven at {SMELL_RATE:.0f} Hz.",
        note="Driven below the default 150 Hz on purpose: in this model any olfactory receptor input of "
             "~115-150 Hz (and DM1 input even at 15 Hz) ignites a self-sustaining runaway in the antennal lobe "
             "(excitatory local neurons) that recruits ~8,400 neurons incl. ~3,400 Kenyon cells. Every one of "
             "the 53 right-antenna ORN types except DA3 triggers it at 150 Hz, so the default-rate response is a "
             "model artefact rather than odour-specific activity.")
    S["light"] = dict(
        label="Light flash", ids=eye_patch(a, ["R1-6"], "right", 300),
        description="A patch of 300 neighbouring R1-6 photoreceptors (about 50 ommatidia) in the right eye "
                    "(non-DRA, nearest to a neuron at the eye's median position), driven at 150 Hz: a small "
                    "spot of light.",
        note="Real photoreceptors release histamine (inhibitory onto L1/L2); the model signs synapses from "
             "the predicted transmitter (mostly acetylcholine for R1-6), so here the flash excites the lamina.")
    S["sound"] = dict(
        label="Sound (Johnston's organ)", ids=of(ct.fillna("").str.match(r"JO-[AB]")),
        description="Auditory Johnston's organ neurons (JO-A and JO-B subtypes, sound/near-field vibration "
                    "sensors in the antenna), both antennae, driven at 150 Hz.")
    S["groom"] = dict(
        label="Antennal touch (grooming)", ids=ps["neu_JON_CE"] + ps["neu_JON_F"] + ps["neu_JON_D_m"],
        description="Johnston's organ neurons JO-C/E, JO-F and JO-D/m of one antenna (the Shiu et al. Fig. 5 "
                    "set, mapped to v783) that trigger antennal grooming, driven at 150 Hz.")
    S["escape"] = dict(
        label="Looming threat (escape)", ids=of(ct.isin(["LC4", "LPLC2"]) & (a.side == "right")),
        description="Right-side LC4 and LPLC2 visual projection neurons (looming detectors), driven at 150 Hz; "
                    "they converge on the Giant Fiber descending neuron (DNp01).")
    return S


# ---------------------------------------------------------------- analysis
def first_spikes(t, n, n_neu):
    """First spike step of each neuron in one trial (-1 = silent)."""
    fs = np.full(n_neu, -1, dtype=np.int64)
    uniq, first = np.unique(n, return_index=True)   # spikes are time-ordered
    fs[uniq] = t[first]
    return fs


def hop_distance(net, stim, active, thresholds=(5, 1)):
    """BFS hops from the stimulated neurons along excitatory edges between active neurons.
    First only edges with >= 5 synapses; neurons still unreached then use weaker edges."""
    hop = np.full(len(net["ids"]), -1, dtype=np.int64)
    hop[stim] = 0
    for thr in thresholds:
        level = 0
        while level <= hop.max():
            frontier = np.nonzero(hop == level)[0]
            if len(frontier):
                starts, lens = net["indptr"][frontier], np.diff(net["indptr"])[frontier]
                sel = np.repeat(starts - np.cumsum(lens) + lens, lens) + np.arange(lens.sum())
                post, cnt = net["indices"][sel], net["count"][sel]
                ok = (cnt >= thr) & active[post] & (hop[post] < 0)
                hop[np.unique(post[ok])] = level + 1
            level += 1
    return hop


def summarize(exp, net, a, stim_idx, main, extra_rates, first_ms, site_of):
    n_neu = len(net["ids"])
    stim_set = np.zeros(n_neu, bool)
    stim_set[stim_idx] = True
    rate = extra_rates
    fired_main = np.zeros(n_neu, bool)
    fired_main[main[1]] = True
    active = (rate >= 1.0) | stim_set
    lab = a.label.to_numpy()
    sup = a.super_class.fillna("").to_numpy()
    df = pd.DataFrame(dict(label=lab, sup=sup, rate=rate, first=first_ms, stim=stim_set, active=active))

    # top responding types (stimulated neurons excluded)
    resp = df[df.active & ~df.stim]
    g = resp.groupby("label")
    top = pd.DataFrame(dict(sup=g.sup.agg(lambda s: s.mode().iat[0]), n=g.size(), mean_rate=g.rate.mean(),
                            total=g.rate.sum(), first=g["first"].median()))
    top = top.sort_values("total", ascending=False)
    top_list = [_aka(dict(type=k, super_class=r.sup, n_neurons=int(r.n), mean_rate=round(float(r.mean_rate), 1),
                     first_spike_ms=None if np.isnan(r.first) else round(float(r.first), 1)))
                for k, r in top.head(25).iterrows()]

    # motor / descending outputs
    out_m = (df.sup.isin(["motor", "descending"])) & (df.active | fired_main) & ~df.stim
    outs = df[out_m].sort_values("rate", ascending=False)
    outputs = [_aka(dict(type=r.label, index=int(site_of[i]), rate=round(float(r.rate), 1),
                         side=str(a.side.iat[i]) if isinstance(a.side.iat[i], str) else ""))
               for i, r in outs.head(40).iterrows() if site_of[i] >= 0]

    # pathway: hop distance through the active excitatory subgraph, grouped by cell type
    # (type hop = its earliest-reached neuron; per layer up to 6 types: well-known neurons (ALIASES)
    # first, then the 2 most active motor / descending types, then the most active by summed rate)
    hop = hop_distance(net, stim_idx, active)
    df["hop"] = hop
    act = df[df.active & (df.hop >= 0)]
    tg = act.groupby("label")
    ttab = pd.DataFrame(dict(sup=tg.sup.agg(lambda s: s.mode().iat[0]), n=tg.size(), rate=tg.rate.mean(),
                             total=tg.rate.sum(), hop=tg.hop.min(),
                             first=tg["first"].median()))
    stim_types = set(df[df.stim].label)
    ttab.loc[ttab.index.isin(stim_types), "hop"] = 0
    layers, node_of = [], {}
    for h in range(0, 7):
        cand = ttab[ttab.hop == h].sort_values("total", ascending=False)
        if not len(cand):
            break
        size = 6 if h else 8
        is_out = cand.sup.isin(["motor", "descending"])
        pick = list(cand.index[cand.index.isin(list(ALIASES))])            # famous neurons first
        pick += [t for t in cand.index[is_out][:2] if t not in pick]         # then behavioural outputs
        pick += [t for t in cand.index if t not in pick]                     # then the most active
        lt = cand.loc[pick[:size]].sort_values("total", ascending=False)
        layer = []
        for t, r in lt.iterrows():
            node_of[t] = (len(layers), len(layer))
            layer.append(_aka(dict(type=t, super_class=r.sup, n=int(r.n), rate=round(float(r.rate), 1),
                                   first_spike_ms=None if np.isnan(r["first"]) else round(float(r["first"]), 1))))
        layers.append(layer)
    # synapses between active neurons of consecutive-layer types
    lab_active = np.where(df.active.to_numpy(), lab, None)
    links = {}
    src_neurons = [i for i in np.nonzero(df.active.to_numpy())[0] if lab[i] in node_of]
    for i in src_neurons:
        li, _ = node_of[lab[i]]
        s, e = net["indptr"][i], net["indptr"][i + 1]
        for j, c in zip(net["indices"][s:e], net["count"][s:e]):
            tj = lab_active[j]
            if tj is None or tj not in node_of or node_of[tj][0] != li + 1:
                continue
            key = (node_of[lab[i]], node_of[tj])
            links[key] = links.get(key, 0) + int(c)
    ranked = sorted(links.items(), key=lambda kv: -abs(kv[1]))
    keep = set(k for k, v in ranked[:20] if abs(v) >= 5)
    for layer_i, layer in enumerate(layers[1:], start=1):       # every node keeps its strongest excitatory input
        for node_i in range(len(layer)):
            cands = [kv for kv in ranked if kv[0][1] == (layer_i, node_i) and kv[1] > 0]
            if cands:
                keep.add(cands[0][0])
    link_list = [dict(**{"from": list(k[0]), "to": list(k[1])}, synapses=abs(v), sign=1 if v > 0 else -1)
                 for k, v in ranked if k in keep]
    # well-known neurons: every one that fired, plus MN9 in taste experiments (to show suppression)
    hl = []
    for i in np.nonzero(np.isin(lab, list(ALIASES)))[0]:
        if site_of[i] >= 0 and (rate[i] >= 1.0 or (lab[i] == "CB0701" and "sugar" in exp)):
            hl.append(_aka(dict(type=lab[i], index=int(site_of[i]), rate=round(float(rate[i]), 1),
                                side=str(a.side.iat[i]) if isinstance(a.side.iat[i], str) else "")))
    return dict(top=top_list, outputs=outputs, pathway=dict(layers=layers, links=link_list), highlights=hl)


# ---------------------------------------------------------------- main
EXPERIMENTS = ["sugar", "bitter", "sugar_bitter", "smell", "light", "sound", "groom", "escape"]


def run_experiment(exp_id, S, net, a, site_of):
    spec = S[exp_id]
    i_of = {int(r): i for i, r in enumerate(net["ids"])}
    stim_idx = np.array(sorted({i_of[r] for r in spec["ids"] if r in i_of}))
    t0 = time.time()
    seeds = [SEED + k for k in range(1 + N_EXTRA)]
    rate_hz = spec.get("rate", P["r_poi"])
    trials = run_trials([(stim_idx, rate_hz)], seeds)
    main = trials[0]
    n_neu = len(net["ids"])
    rate = rates_from(trials[1:], n_neu)
    fs = np.stack([first_spikes(t, n, n_neu) for t, n in trials]).astype(float)
    fs[fs < 0] = np.nan
    first_ms = np.full(n_neu, np.nan)
    fired = ~np.isnan(fs).all(axis=0)
    first_ms[fired] = np.nanmedian(fs[:, fired], axis=0) * P["dt"]

    # runaway check: > 3000 spikes in a 10 ms bin (~ the antennal-lobe/Kenyon-cell flood)
    bins = [np.bincount(tt // 100, minlength=T_RUN_MS // 10) for tt, _ in trials]
    peak = round(float(max(b.max() for b in bins)) / 10.0, 1)
    runaway = int(sum(b.max() > 3000 for b in bins))

    # remap to site indices, drop neurons not in the site table
    t, n = main
    s_n = site_of[n]
    keep = s_n >= 0
    dropped = int((~keep).sum())
    t_out, n_out = t[keep].astype("<u2"), s_n[keep].astype("<u4")
    rmask = (rate >= 1.0) & (site_of >= 0)
    stim_site = site_of[stim_idx]
    cols = {"t": t_out, "n": n_out, "stim": stim_site[stim_site >= 0].astype("<u4"),
            "rate": rate[rmask].astype("<f4"), "rateIdx": site_of[rmask].astype("<u4")}
    size = sum(v.nbytes for v in cols.values())
    if size > MAX_BYTES:
        raise RuntimeError(f"{exp_id}: {size} bytes > {MAX_BYTES}")
    write_columns(f"sim/{exp_id}.bin", cols)

    summ = summarize(exp_id, net, a, stim_idx, main, rate, first_ms, site_of)
    types = a.label.iloc[stim_idx].value_counts()
    entry = dict(
        id=exp_id, label=spec["label"],
        stimulus=dict(description=spec["description"], cell_types=list(types.index),
                      type_counts={k: int(v) for k, v in types.items()}, count=int(len(stim_idx)),
                      rate_hz=rate_hz,
                      sides={k: int(v) for k, v in a.side.iloc[stim_idx].fillna("").value_counts().items()}),
        spikes=int(len(t_out)), active_neurons=int(len(np.unique(n_out))), duration_ms=T_RUN_MS,
        dropped_spikes=dropped, rate_neurons=int(rmask.sum()),
        top=summ["top"], outputs=summ["outputs"], highlights=summ["highlights"], pathway=summ["pathway"],
        peak_spikes_per_ms=peak, trials_runaway=runaway,
    )
    if spec.get("note"):
        entry["note"] = spec["note"]
    fsize = (SIM_OUT / f"{exp_id}.bin").stat().st_size
    mn9 = [round(float(rate[i_of[m]]), 1) for m in MN9]
    print(f"{exp_id}: stim {len(stim_idx)}  spikes {len(t_out)} (dropped {dropped})  active {entry['active_neurons']}"
          f"  rate>=1Hz {rmask.sum()}  file {fsize / 1e6:.2f} MB  MN9 {mn9}  {time.time() - t0:.0f}s", flush=True)
    return entry


def model_meta(net, validation):
    return dict(
        name="Leaky integrate-and-fire whole-brain model",
        citation="Shiu et al. 2024 Nature",
        reference="Shiu, P.K. et al. A Drosophila computational brain model reveals sensorimotor processing. "
                  "Nature 634, 210-219 (2024). github.com/philshiu/Drosophila_brain_model",
        connectome="FlyWire v783",
        neurons=int(len(net["ids"])), connections=int(len(net["indices"])),
        synapses=int(np.abs(net["count"].astype(np.int64)).sum()),
        params=dict(v_0_mV=P["v_0"], v_rst_mV=P["v_rst"], v_th_mV=P["v_th"], t_mbr_ms=P["t_mbr"],
                    tau_ms=P["tau"], t_rfc_ms=P["t_rfc"], t_dly_ms=P["t_dly"], w_syn_mV=P["w_syn"],
                    r_poi_Hz=P["r_poi"], f_poi=P["f_poi"], dt_ms=P["dt"]),
        sign_rule="per presynaptic neuron's predicted transmitter: GABA and glutamate inhibitory, acetylcholine "
                  "and all others excitatory (Shiu et al. Connectivity_783.parquet)",
        simulator="numba re-implementation of the Brian2 update schedule of Shiu et al. model.py (exact integration)",
        trials=dict(replay_seed=SEED, extra_trials=N_EXTRA, rate="mean rate over the extra trials"),
        units=dict(t="0.1 ms steps", rate="Hz"),
        validation=validation,
    )


def main(selected):
    net = use_network("783")
    a = load_annotations(net["ids"])
    ridx = root_index()
    site_of = np.array([ridx.get(int(r), -1) for r in net["ids"]], dtype=np.int64)
    print(f"{(site_of < 0).sum()} Shiu neurons are not in the site table", flush=True)
    SIM_OUT.mkdir(exist_ok=True)
    S = stimuli(a)
    idx_path = SIM_OUT / "index.json"
    old = json.load(open(idx_path)) if idx_path.exists() else {}
    entries = {e["id"]: e for e in old.get("experiments", [])}
    for exp_id in selected:
        entries[exp_id] = run_experiment(exp_id, S, net, a, site_of)
    validation = {}
    for key, name in [("vs_authors_brian2_output_v630", "validation.json"), ("exact_match_test", "validation_exact.json"),
                      ("olfactory_runaway_in_brian2", "validation_runaway.json")]:
        if (CACHE / name).exists():
            validation[key] = json.load(open(CACHE / name))
    index = dict(model=model_meta(net, validation),
                 experiments=[entries[e] for e in EXPERIMENTS if e in entries])
    with open(idx_path, "w") as f:
        json.dump(index, f, separators=(",", ":"))


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "validate":
        validate()
    else:
        main([e for e in EXPERIMENTS if not args or e in args])

import json, struct, sys, numpy as np
import os
root = os.environ.get('NEURONAUT_DATA', '../fly-brain-fun/data') + '/'
fm = json.load(open(root + 'featured.json'))
b = open(root + 'featured.bin', 'rb').read()
n = struct.unpack('<I', b[:4])[0]; h = json.loads(b[4:4 + n]); base = 4 + n
def col(k):
    e = h[k]; dt = np.dtype(e['dtype']); cnt = int(np.prod(e['shape']))
    return np.frombuffer(b, dt, cnt, base + e['offset']).reshape(e['shape'])
pos, parent, vStart, vCount = col('pos'), col('parent'), col('vStart'), col('vCount')

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, c = pts[0], pts[-1]; v = c - a; L = np.hypot(*v)
    w = pts - a; d = np.abs(v[0] * w[:, 1] - v[1] * w[:, 0]) / L if L > 0 else np.hypot(*(pts - a).T)
    i = int(np.argmax(d))
    if d[i] > eps:
        return np.vstack([rdp(pts[:i + 1], eps)[:-1], rdp(pts[i:], eps)])
    return np.array([a, c])

def chains_for(i, view):
    s, c = int(vStart[i]), int(vCount[i])
    p = pos[s:s + c].astype(float)[:, view] / fm['quant']
    par = parent[s:s + c].astype(int)
    kids = [[] for _ in range(c)]
    for j in range(c):
        if par[j] >= 0: kids[par[j]].append(j)
    out = []
    starts = [j for j in range(c) if par[j] < 0]
    stack = [(r, None) for r in starts]
    while stack:
        node, prev = stack.pop()
        chain = [prev, node] if prev is not None else [node]
        while len(kids[node]) == 1:
            node = kids[node][0]; chain.append(node)
        if len(chain) > 1: out.append(p[chain])
        for k in kids[node]: stack.append((k, node))
    return out

def build(gid, W, H, pad, eps, view=(0, 1), types=None, maxlen=None, out='out.svg'):
    g = next(g for g in fm['groups'] if g['id'] == gid)
    chains = []
    for i in range(g['start'], g['start'] + g['count']):
        chains += chains_for(i, list(view))
    pts = np.vstack(chains); lo, hi = pts.min(0), pts.max(0); span = hi - lo
    sc = min((W - 2 * pad) / span[0], (H - 2 * pad) / span[1]); off = (np.array([W, H]) - span * sc) / 2
    d = []
    for ch in chains:
        q = (ch - lo) * sc + off; q[:, 1] = H - q[:, 1]
        if maxlen is not None:
            seg = np.hypot(*np.diff(q, axis=0).T)
            if seg.max() > maxlen: continue
        q = rdp(q, eps); q = np.round(q).astype(int)
        rel = np.diff(q, axis=0); rel = rel[(rel != 0).any(1)]
        if len(rel) == 0: continue
        d.append(f'M{q[0][0]} {q[0][1]}' + 'l' + ' '.join(f'{x} {y}' for x, y in rel).replace(' -', '-'))
    path = ''.join(d)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path d="{path}" fill="none" stroke="#000" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    open(out, 'w').write(svg)
    print(out, len(chains), 'chains ->', len(d), 'paths', len(svg) // 1024, 'KB')

build('lobula-plate', 960, 600, 24, 0.9, out=sys.argv[1] if len(sys.argv) > 1 else 'lobula-plate.svg')

// Tens of thousands of real connections drawn as arcs that bend through the neuropil
// where their synapses sit, with pulses travelling from sender to receiver.
import * as THREE from "three";
import { NTS, glow } from "../theme.js";

const SEG = 10;

const VERT = /* glsl */`
  attribute float aT;
  attribute float aPhase;
  attribute float aW;
  attribute vec3 aColor;
  attribute float aKind;
  uniform float uTime, uGrow;
  uniform vec4 uKinds;
  varying float vA;
  varying vec3 vColor;
  void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float on = aKind < 0.5 ? uKinds.x : (aKind < 1.5 ? uKinds.y : (aKind < 2.5 ? uKinds.z : uKinds.w));
    float head = fract(aPhase + uTime * (0.16 + aW * 0.1));
    float pulse = exp(-pow((aT - head) * 14.0, 2.0));
    float grown = step(aT, uGrow + aPhase * 0.25 - 0.25);
    vA = on * grown * (0.008 + 0.03 * aW + pulse * (0.1 + 0.3 * aW));
    vColor = aColor;
  }`;

const FRAG = /* glsl */`
  uniform float uOpacity;
  varying float vA;
  varying vec3 vColor;
  void main(){
    if (vA < 0.004) discard;
    gl_FragColor = vec4(vColor * vA * uOpacity, 1.0);
  }`;

export class ArcLayer {
  constructor(world, cols, neuronLayer, neuropilLayer, meta) {
    this.world = world;
    const n = cols.pre.length;
    const P = neuronLayer.positions;
    const verts = n * SEG * 2;
    const pos = new Float32Array(verts * 3), t = new Float32Array(verts), phase = new Float32Array(verts);
    const w = new Float32Array(verts), color = new Float32Array(verts * 3), kind = new Float32Array(verts);
    const npCentroid = meta.neuropils.map((name) => {
      const m = neuropilLayer.byName.get(name);
      return m ? m.userData.centroid : null;
    });
    const ntNames = ["acetylcholine", "glutamate", "gaba", "dopamine", "serotonin", "octopamine"];
    const ntKind = { acetylcholine: 0, gaba: 1, glutamate: 2 };
    const ntColor = ntNames.map((k) => glow(NTS[k].color, 1.3));
    let maxSyn = 1;
    for (let i = 0; i < n; i++) maxSyn = Math.max(maxSyn, cols.syn[i]);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), p = new THREE.Vector3(), q = new THREE.Vector3();
    let v = 0;
    for (let i = 0; i < n; i++) {
      const s = cols.pre[i], r = cols.post[i];
      a.set(P[s * 3], P[s * 3 + 1], P[s * 3 + 2]);
      b.set(P[r * 3], P[r * 3 + 1], P[r * 3 + 2]);
      const cc = npCentroid[cols.np[i]];
      if (cc) c.set(cc[0], cc[1], cc[2]);
      else c.copy(a).add(b).multiplyScalar(0.5).multiplyScalar(0.7);
      // control point that makes the quadratic curve pass through the neuropil centroid
      const ctrl = c.clone().multiplyScalar(2).sub(a.clone().add(b).multiplyScalar(0.5));
      const ph = Math.random();
      const ww = Math.log(cols.syn[i]) / Math.log(maxSyn);
      const col = ntColor[cols.nt[i]] || [0.6, 0.6, 0.7];
      const k = ntKind[ntNames[cols.nt[i]]] ?? 3;
      for (let sgm = 0; sgm < SEG; sgm++) {
        for (const tt of [sgm / SEG, (sgm + 1) / SEG]) {
          const u = 1 - tt;
          p.copy(a).multiplyScalar(u * u).add(q.copy(ctrl).multiplyScalar(2 * u * tt)).add(q.copy(b).multiplyScalar(tt * tt));
          pos[v * 3] = p.x; pos[v * 3 + 1] = p.y; pos[v * 3 + 2] = p.z;
          t[v] = tt; phase[v] = ph; w[v] = ww; kind[v] = k;
          color[v * 3] = col[0]; color[v * 3 + 1] = col[1]; color[v * 3 + 2] = col[2];
          v++;
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(t, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aW", new THREE.BufferAttribute(w, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.setAttribute("aKind", new THREE.BufferAttribute(kind, 1));
    this.uniforms = {
      uTime: { value: 0 }, uGrow: { value: 1.3 }, uOpacity: { value: 1 },
      uKinds: { value: new THREE.Vector4(1, 1, 1, 1) },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(g, this.material);
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    world.brain.add(this.lines);
    this.count = n;
    world.onFrame((dt, tm) => { this.uniforms.uTime.value = tm; this.uniforms.uOpacity.value = world.lineGain; });
  }

  show(on) { this.lines.visible = on; }

  grow(dur = 3) {
    this.show(true);
    const u = this.uniforms.uGrow, t0 = this.world.time;
    this._g?.();
    this._g = this.world.onFrame((dt, t) => {
      const k = Math.min(1, (t - t0) / dur);
      u.value = k * 1.3;
      if (k >= 1) { this._g(); this._g = null; }
    });
  }

  // kinds: { ach, gaba, glu, other } booleans
  setKinds(k) { this.uniforms.uKinds.value.set(k.ach ? 1 : 0, k.gaba ? 1 : 0, k.glu ? 1 : 0, k.other ? 1 : 0); }
}

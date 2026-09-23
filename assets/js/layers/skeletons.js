// Real neuron morphologies (FlyWire skeletons) drawn as glowing fibres that can grow from the soma.
import * as THREE from "three";
import { CLASSES, glow } from "../theme.js";

const VERT = /* glsl */`
  attribute float aDist;
  attribute vec3 aColor;
  uniform float uGrow;
  varying float vDist;
  varying vec3 vColor;
  void main(){
    vDist = aDist;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const FRAG = /* glsl */`
  uniform float uGrow, uOpacity, uTime, uGain;
  varying float vDist;
  varying vec3 vColor;
  void main(){
    if (vDist > uGrow) discard;
    float tip = 1.0 - smoothstep(0.0, 0.06, uGrow - vDist);
    float travel = 0.5 + 0.5 * sin(vDist * 40.0 - uTime * 3.0);
    vec3 c = vColor * (0.75 + 0.25 * travel) + vec3(0.8, 0.95, 1.0) * tip * 1.6;
    float a = uOpacity * uGain;
    gl_FragColor = vec4(c * a, 1.0);
  }`;

export class SkeletonLayer {
  // cols: pos int16 (V,3), parent int32, dist uint8, nIndex, vStart, vCount.
  // range: [firstNeuron, endNeuron) to build from a contiguous slice (featured groups).
  constructor(world, cols, neuronMeta, neuronCols, { range = null, opacity = 0.5, colorFor = null, maxGain = 1 } = {}) {
    this.world = world;
    const M0 = range ? range[0] : 0, M1 = range ? range[1] : cols.nIndex.length;
    const v0 = cols.vStart[M0], v1 = cols.vStart[M1 - 1] + cols.vCount[M1 - 1];
    const V = v1 - v0;
    const pos = new Float32Array(V * 3);
    for (let i = 0; i < pos.length; i++) pos[i] = cols.pos[v0 * 3 + i] / 20;
    const dist = new Float32Array(V);
    for (let i = 0; i < V; i++) dist[i] = cols.dist[v0 + i] / 255;
    const color = new Float32Array(V * 3);
    const idx = [];
    for (let m = M0; m < M1; m++) {
      const n = cols.nIndex[m], s = cols.vStart[m] - v0, c = cols.vCount[m];
      const cls = neuronMeta.superClasses[neuronCols.super[n]];
      const col = colorFor ? colorFor(m, n, cls) : glow((CLASSES[cls] || CLASSES[""]).color, 1.25);
      for (let v = s; v < s + c; v++) {
        color[v * 3] = col[0]; color[v * 3 + 1] = col[1]; color[v * 3 + 2] = col[2];
        const p = cols.parent[v0 + v];
        if (p >= 0) idx.push(v, s + p);
      }
    }
    this.neurons = Array.from(cols.nIndex.slice(M0, M1));
    this.positions = pos;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aDist", new THREE.BufferAttribute(dist, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    g.setIndex(new THREE.BufferAttribute(V > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
    g.computeBoundingSphere();
    this.geometry = g;
    this.uniforms = {
      uGrow: { value: 1.02 }, uOpacity: { value: opacity }, uTime: { value: 0 }, uGain: { value: 1 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(g, this.material);
    this.lines.frustumCulled = false;
    this.lines.visible = false;
    world.brain.add(this.lines);
    this.baseOpacity = opacity;
    world.onFrame((dt, t) => { this.uniforms.uTime.value = t; this.uniforms.uGain.value = Math.min(maxGain, world.lineGain); });
  }

  show(on = true) { this.lines.visible = on; }

  grow(duration = 4, from = 0) {
    this.show(true);
    const u = this.uniforms.uGrow, t0 = this.world.time;
    this._stop?.();
    this._stop = this.world.onFrame((dt, t) => {
      const k = Math.min(1, (t - t0) / duration);
      u.value = from + (1.02 - from) * (1 - Math.pow(1 - k, 2.2));
      if (k >= 1) { this._stop(); this._stop = null; }
    });
  }

  fade(to, duration = 1) {
    const u = this.uniforms.uOpacity, from = u.value, t0 = this.world.time;
    this._fade?.();
    if (to > 0) this.show(true);
    this._fade = this.world.onFrame((dt, t) => {
      const k = Math.min(1, (t - t0) / duration);
      u.value = from + (to - from) * k;
      if (k >= 1) { this._fade(); this._fade = null; if (to <= 0) this.show(false); }
    });
  }

  centroid() {
    const p = this.positions;
    let x = 0, y = 0, z = 0, n = 0;
    for (let i = 0; i < p.length; i += 9) { x += p[i]; y += p[i + 1]; z += p[i + 2]; n++; }
    return [-x / n, y / n, z / n];
  }

  radius(c) {
    const p = this.positions;
    let r = 0;
    for (let i = 0; i < p.length; i += 15) r = Math.max(r, Math.hypot(-p[i] - c[0], p[i + 1] - c[1], p[i + 2] - c[2]));
    return r;
  }
}

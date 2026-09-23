// The 78 neuropils + whole-brain outline as luminous fresnel shells.
import * as THREE from "three";
import { SYSTEM_COLORS } from "../theme.js";

const VERT = /* glsl */`
  varying vec3 vN;
  varying vec3 vV;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */`
  uniform vec3 uColor;
  uniform float uOpacity, uHover, uFill;
  varying vec3 vN;
  varying vec3 vV;
  void main(){
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 3.0);
    float a = uOpacity * (uFill + rim * 0.55) * (1.0 + uHover * 2.6) + uHover * 0.05;
    gl_FragColor = vec4(uColor * a, 1.0);
  }`;

export class NeuropilLayer {
  constructor(world, cols, meta) {
    this.world = world;
    this.meta = meta;
    this.group = new THREE.Group();
    this.group.visible = false;
    world.brain.add(this.group);
    this.meshes = [];
    this.byName = new Map();
    meta.meshes.forEach((m, k) => {
      const vs = cols.vStart[k], vc = cols.vCount[k], is = cols.iStart[k], ic = cols.iCount[k];
      const pos = new Float32Array(vc * 3);
      for (let i = 0; i < vc * 3; i++) pos[i] = cols.pos[vs * 3 + i] / 20;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setIndex(new THREE.BufferAttribute(cols.index.slice(is, is + ic), 1));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      const isBrain = m.system === "brain";
      const color = new THREE.Color(SYSTEM_COLORS[m.system] || "#ffffff");
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: {
          uColor: { value: color }, uOpacity: { value: isBrain ? 0.2 : 0.34 },
          uHover: { value: 0 }, uFill: { value: isBrain ? 0.006 : 0.012 },
        },
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(g, mat);
      mesh.userData = { ...m, base: mat.uniforms.uOpacity.value };
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.meshes.push(mesh);
      this.byName.set(m.name, mesh);
      if (isBrain) this.brainMesh = mesh;
    });
    this.opacity = 1;
    this.raycaster = new THREE.Raycaster();
  }

  show(on) { this.group.visible = on; }

  setOpacity(k, { brainOnly = false } = {}) {
    this.opacity = k;
    for (const m of this.meshes) {
      const isBrain = m === this.brainMesh;
      m.material.uniforms.uOpacity.value = (brainOnly && !isBrain) ? 0 : m.userData.base * k;
      m.visible = !(brainOnly && !isBrain);
    }
  }

  fadeTo(k, dur = 1, opts = {}) {
    const from = this.opacity, t0 = this.world.time;
    this.show(true);
    this._f?.();
    this._f = this.world.onFrame((dt, t) => {
      const e = Math.min(1, (t - t0) / dur);
      this.setOpacity(from + (k - from) * e, opts);
      if (e >= 1) { this._f(); this._f = null; if (k <= 0) this.show(false); }
    });
  }

  highlight(pred) {
    for (const m of this.meshes) {
      if (m === this.brainMesh) continue;
      m.material.uniforms.uHover.value = pred && pred(m.userData) ? 1 : 0;
    }
  }

  pick(ndc) {
    if (!this.group.visible) return null;
    this.raycaster.setFromCamera(ndc, this.world.camera);
    const hits = this.raycaster.intersectObjects(this.meshes.filter((m) => m !== this.brainMesh && m.visible), false);
    return hits.length ? hits[0].object.userData : null;
  }

  centroidWorld(name) {
    const m = this.byName.get(name);
    if (!m) return null;
    const c = m.userData.centroid;
    return [-c[0], c[1], c[2]];
  }
}

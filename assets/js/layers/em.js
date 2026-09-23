// Real FAFB electron-microscopy sections: a 3D sweep plane and a 2D "microscope" deep zoom.
import * as THREE from "three";

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FRAG = /* glsl */`
  uniform sampler2D uA, uB;
  uniform float uMix, uOpacity, uTime;
  varying vec2 vUv;
  void main(){
    float a = texture2D(uA, vUv).r, b = texture2D(uB, vUv).r;
    float l = mix(a, b, uMix);
    float mask = smoothstep(0.03, 0.14, l);
    vec3 tint = mix(vec3(0.55, 0.62, 0.95), vec3(1.0, 0.97, 0.92), l);
    float scan = 0.92 + 0.08 * sin(vUv.y * 900.0 + uTime * 2.0);
    gl_FragColor = vec4(tint * l * l * mask * uOpacity * scan * 0.7, 1.0);
  }`;

export class EMSweep {
  constructor(world, meta, base = "data/em/") {
    this.world = world;
    this.frames = meta.images.filter((i) => i.kind === "sweep").sort((a, b) => a.z - b.z);
    const loader = new THREE.TextureLoader();
    this.textures = this.frames.map((f) => {
      const t = loader.load(base + f.file);
      t.colorSpace = THREE.NoColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    });
    const c = this.frames[0].corners_site;
    const g = new THREE.BufferGeometry();
    // tl, tr, br, bl
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([
      c[0][0], c[0][1], 0, c[1][0], c[1][1], 0, c[2][0], c[2][1], 0, c[3][0], c[3][1], 0,
    ]), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]), 2));
    g.setIndex([0, 3, 1, 1, 3, 2]);
    this.uniforms = {
      uA: { value: this.textures[0] }, uB: { value: this.textures[1] ?? this.textures[0] },
      uMix: { value: 0 }, uOpacity: { value: 0 }, uTime: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, uniforms: this.uniforms,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    world.brain.add(this.mesh);
    // site z of each frame (all corners share z)
    this.zs = this.frames.map((f) => f.corners_site[0][2]);
    this.sections = this.frames.map((f) => f.z);
    this.progress = 0;
    world.onFrame((dt, t) => { this.uniforms.uTime.value = t; });
  }

  // p in [0,1] from anterior (first frame) to posterior (last frame)
  setProgress(p) {
    this.progress = p;
    const n = this.frames.length - 1;
    const x = Math.max(0, Math.min(n, p * n));
    const i = Math.min(n - 1, Math.floor(x)), f = x - i;
    this.uniforms.uA.value = this.textures[i];
    this.uniforms.uB.value = this.textures[i + 1];
    this.uniforms.uMix.value = f;
    const z = this.zs[i] + (this.zs[i + 1] - this.zs[i]) * f;
    this.mesh.position.z = z - this.zs[0] * 0; // corners already carry frame-0 z
    this.mesh.position.z = z - this.frames[0].corners_site[0][2];
    this.section = Math.round(this.sections[i] + (this.sections[i + 1] - this.sections[i]) * f);
    this.depthUm = z;
  }

  show(on) { this.mesh.visible = on; }
  setOpacity(o) { this.uniforms.uOpacity.value = o; this.mesh.visible = o > 0.001; }
}

// ---------- 2D microscope ----------
export class Microscope {
  constructor(canvas, meta, base = "data/em/") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.levels = meta.images.filter((i) => i.kind === "zoom").sort((a, b) => b.nm_per_px - a.nm_per_px);
    const segs = meta.images.filter((i) => i.kind === "seg");
    this.segFor = new Map(segs.map((s) => [s.nm_per_px, s]));
    this.imgs = this.levels.map((l) => loadImg(base + l.file));
    this.segImgs = this.levels.map((l) => (this.segFor.has(l.nm_per_px) ? loadImg(base + this.segFor.get(l.nm_per_px).file) : null));
    this.fovs = this.levels.map((l) => (l.width || 1024) * l.nm_per_px / 1000); // micrometres across
    this.s = 0;
    this.seg = 0;
    this.location = meta.location;
  }

  get fovUm() {
    const a = Math.log(this.fovs[0]), b = Math.log(this.fovs[this.fovs.length - 1]);
    return Math.exp(a + (b - a) * this.s);
  }

  draw() {
    const c = this.canvas, ctx = this.ctx;
    const W = c.clientWidth, H = c.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingQuality = "high";
    const f = this.fovUm;
    const side = Math.max(W, H);
    const drawLevel = (k, alpha, which) => {
      const img = which === "seg" ? this.segImgs[k] : this.imgs[k];
      if (!img || !img.complete || !img.naturalWidth || alpha <= 0) return;
      const size = side * this.fovs[k] / f;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, W / 2 - size / 2, H / 2 - size / 2, size, size);
    };
    const passes = [["em", 1]];
    if (this.seg > 0.001) passes.push(["seg", this.seg]);
    for (const [which, amt] of passes) {
      for (let k = 0; k < this.levels.length; k++) {
        if (this.fovs[k] < f * 0.999 && k > 0) {
          // finer than needed: fade in as we approach its field of view
          const t = smooth(this.fovs[k] * 1.7, this.fovs[k], f);
          drawLevel(k, t * amt, which);
        } else {
          drawLevel(k, amt, which);
        }
      }
    }
    ctx.globalAlpha = 1;
    return f;
  }
}

function smooth(e0, e1, x) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function loadImg(src) {
  const i = new Image();
  i.decoding = "async";
  i.src = src;
  return i;
}

export function niceScale(fovUm, targetFrac = 0.22) {
  const want = fovUm * targetFrac;
  const steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200];
  let best = steps[0];
  for (const s of steps) if (s <= want) best = s;
  const label = best < 1 ? `${Math.round(best * 1000)} nm` : `${best} µm`;
  return { um: best, frac: best / fovUm, label };
}

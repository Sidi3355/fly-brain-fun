// The WebGL world: renderer, bloom, camera flights, starfield and the render loop.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.mobile = matchMedia("(max-width: 860px), (pointer: coarse)").matches;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Colours are authored as display values and added together in the shaders, so keep
    // the whole pipeline in display space (no sRGB lift of faint additive glow).
    THREE.ColorManagement.enabled = false;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x07060d, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 1.75);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.scene.fog = null;
    this.camera = new THREE.PerspectiveCamera(38, 1, 1, 40000);
    this.camera.position.set(0, 60, 1500);

    // Everything anatomical lives in `brain`. The FAFB volume is mirrored relative to the
    // animal, so flip x to show the fly's right on the viewer's left in a frontal view.
    this.brain = new THREE.Group();
    this.brain.scale.x = -1;
    this.scene.add(this.brain);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.rotateSpeed = 0.6;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 9000;
    this.controls.autoRotate = !this.reduced;
    this.controls.autoRotateSpeed = 0.18;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener("start", () => { this.userActive = true; this.cancelFlight(); });
    this.controls.addEventListener("end", () => { this.userActive = false; this.lastInteraction = performance.now(); });
    this.lastInteraction = 0;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.72, 0.55, 0.14);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.clock = new THREE.Clock();
    this.time = 0;
    this.updaters = new Set();
    this.flight = null;
    this.frameTimes = [];

    this.addStarfield();
    this.resize();
    addEventListener("resize", () => this.resize());
  }

  get pointScale() {
    // pixels per world unit at distance 1 (used by point shaders)
    const h = this.renderer.domElement.height;
    return h / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2));
  }

  // Thin lines don't grow with zoom the way points do, so line layers scale their
  // brightness by on-screen pixels per micrometre (1.0 on a typical desktop framing).
  get lineGain() {
    const d = this.camera.position.distanceTo(this.controls.target) || 1;
    return Math.min(1.4, Math.max(0.12, (this.pointScale / d) / 1.1));
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.composer.setPixelRatio(this.dpr);
    this.bloom.setSize(Math.round(w * this.dpr / 2), Math.round(h * this.dpr / 2));
    this.camera.aspect = w / h;
    // keep the brain framed on narrow screens
    this.camera.fov = w < h ? 52 : 38;
    this.camera.updateProjectionMatrix();
  }

  addStarfield() {
    const n = this.mobile ? 2200 : 4200;
    const pos = new Float32Array(n * 3), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const r = 2600 + Math.random() * 9000;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6;
      pos[i * 3 + 2] = r * Math.cos(ph);
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uScale: { value: 1 }, uOpacity: { value: 1 } },
      vertexShader: `
        attribute float aSeed; uniform float uTime; uniform float uScale; varying float vA; varying vec3 vC;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          gl_Position = projectionMatrix * mv;
          float tw = 0.55 + 0.45*sin(uTime*(0.3+aSeed*1.2) + aSeed*40.0);
          gl_PointSize = (1.2 + aSeed*2.4) * uScale * 7.0 / -mv.z;
          vA = tw * (0.25 + 0.5*aSeed);
          vC = mix(vec3(0.62,0.72,1.0), vec3(1.0,0.82,0.7), step(0.82, aSeed));
        }`,
      fragmentShader: `
        uniform float uOpacity; varying float vA; varying vec3 vC;
        void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vC*a*vA*uOpacity, 1.0); }`,
    });
    this.stars = new THREE.Points(g, m);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);
  }

  onFrame(fn) { this.updaters.add(fn); return () => this.updaters.delete(fn); }

  cancelFlight() {
    if (this.flight) { const f = this.flight; this.flight = null; f.resolve?.(); }
  }

  // Fly the camera to a new position/target with a gentle arc.
  flyTo({ position, target = [0, 0, 0], duration = 2.6, autoRotate }) {
    this.cancelFlight();
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    const p1 = new THREE.Vector3(...position), t1 = new THREE.Vector3(...target);
    const d = this.reduced ? 0.01 : duration;
    return new Promise((resolve) => {
      this.flight = { p0, t0, p1, t1, start: this.time, d, resolve, autoRotate };
      this.controls.autoRotate = false;
    });
  }

  step(dt) {
    const f = this.flight;
    if (!f) return;
    const k = this.skipFlights ? 1 : Math.min(1, (this.time - f.start) / f.d);
    const e = ease(k);
    const target = f.t0.clone().lerp(f.t1, e);
    // interpolate in spherical coordinates around the moving target for an orbital arc
    const a = f.p0.clone().sub(f.t0), b = f.p1.clone().sub(f.t1);
    const sa = new THREE.Spherical().setFromVector3(a), sb = new THREE.Spherical().setFromVector3(b);
    let dTheta = sb.theta - sa.theta;
    if (dTheta > Math.PI) dTheta -= 2 * Math.PI;
    if (dTheta < -Math.PI) dTheta += 2 * Math.PI;
    const s = new THREE.Spherical(
      THREE.MathUtils.lerp(sa.radius, sb.radius, e) * (1 + 0.12 * Math.sin(Math.PI * e) * (Math.abs(dTheta) > 0.4 ? 1 : 0)),
      THREE.MathUtils.lerp(sa.phi, sb.phi, e),
      sa.theta + dTheta * e,
    );
    this.camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(s));
    this.controls.target.copy(target);
    if (k >= 1) {
      this.flight = null;
      this.controls.autoRotate = f.autoRotate ?? (!this.reduced);
      f.resolve();
    }
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.time += dt;
      this.step(dt);
      this.controls.update();
      this.stars.material.uniforms.uTime.value = this.time;
      this.stars.material.uniforms.uScale.value = this.pointScale;
      for (const fn of this.updaters) fn(dt, this.time);
      this.composer.render();
      this.adapt(dt);
    };
    loop();
  }

  // Drop resolution when the GPU struggles so the voyage stays smooth.
  adapt(dt) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 1 / 38 && this.dpr > 0.8) {
      this.dpr = Math.max(0.75, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    }
  }
}

// Generative sound: a slow drone for the void, soft chimes for travel, clicks for spikes.
export class Audio {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.lastBlip = 0;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    // reverb from a synthetic impulse
    const len = ctx.sampleRate * 3.2;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    this.verb = ctx.createConvolver();
    this.verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.55;
    this.verb.connect(wet).connect(this.master);

    // drone: detuned oscillators through a breathing low-pass
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.16;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 520; lp.Q.value = 0.7;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 260;
    lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
    [55, 82.41, 110.3, 164.8, 220.6].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 2) * 4;
      const g = ctx.createGain(); g.gain.value = [0.5, 0.28, 0.2, 0.08, 0.05][i];
      o.connect(g).connect(lp); o.start();
    });
    lp.connect(this.droneGain);
    this.droneGain.connect(this.master);
    this.droneGain.connect(this.verb);

    this.blipBus = ctx.createGain();
    this.blipBus.gain.value = 0.5;
    this.blipBus.connect(this.master);
    this.blipBus.connect(this.verb);
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.init();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(on ? 0.9 : 0, now, on ? 1.2 : 0.3);
  }

  chime(pitch = 0) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const base = [392, 440, 523.25, 587.33, 659.25, 783.99][((pitch % 6) + 6) % 6];
    [1, 1.5, 2.01].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = base * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.06);
      g.gain.linearRampToValueAtTime(0.07 / (i + 1), now + i * 0.06 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 2.4);
      o.connect(g).connect(this.blipBus); o.start(now + i * 0.06); o.stop(now + 2.6);
    });
  }

  // called with the number of spikes this frame
  spikes(n, byClass) {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx, now = ctx.currentTime;
    if (now - this.lastBlip < 0.028) return;
    this.lastBlip = now;
    const count = Math.min(3, Math.ceil(Math.log2(1 + n) / 2));
    const scale = [0, 3, 5, 7, 10, 12, 15, 17];
    const classes = [...byClass.keys()];
    for (let k = 0; k < count; k++) {
      const cls = classes[k % Math.max(1, classes.length)] || 0;
      const f = 330 * Math.pow(2, scale[(cls + k * 3) % scale.length] / 12) * (Math.random() < 0.3 ? 2 : 1);
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = ctx.createGain();
      const t = now + k * 0.012;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.035, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; o.connect(g).connect(pan).connect(this.blipBus); }
      else o.connect(g).connect(this.blipBus);
      o.start(t); o.stop(t + 0.25);
    }
  }
}

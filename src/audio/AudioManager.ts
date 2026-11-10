import { defaults, type Preferences } from "../persistence/Preferences";
/** One context, one sequencer and one engine. Two fixed music buses crossfade themes. */
export class AudioManager {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  effects: GainNode | null = null;
  buses: GainNode[] = [];
  activeBus = 0;
  noiseBuffer: AudioBuffer | null = null;
  enabled = true;
  paused = false;
  mode = "menu";
  stage = "M01";
  settings = { ...defaults };
  timer: ReturnType<typeof setInterval> | null = null;
  step = 0;
  last = new Map<string, number>();
  loops = new Map<string, { osc: OscillatorNode; gain: GainNode }>();
  async unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.42;
      this.master.connect(c.destination);
      this.music = c.createGain();
      this.music.connect(this.master);
      this.effects = c.createGain();
      this.effects.connect(this.master);
      for (let i = 0; i < 2; i++) {
        const b = c.createGain();
        b.gain.value = i === 0 ? 1 : 0;
        b.connect(this.music);
        this.buses.push(b);
      }
      this.noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const a = this.noiseBuffer.getChannelData(0);
      let seed = 883;
      for (let i = 0; i < a.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        a[i] = (seed / 4294967296) * 2 - 1;
      }
      this.updateVolume();
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.timer) this.timer = setInterval(() => this.beat(), 150);
  }
  configure(p: Preferences) {
    this.settings = { ...p };
    this.updateVolume();
  }
  setStage(stage: string) {
    if (this.stage === stage) return;
    this.stage = stage;
    this.crossfade();
  }
  setMode(mode: string) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.crossfade();
    if (mode === "game" || mode === "boss") this.startLoop("motor", 48);
    else this.stopLoop("motor");
  }
  crossfade() {
    if (!this.ctx || this.buses.length !== 2) return;
    const t = this.ctx.currentTime,
      old = this.activeBus;
    this.activeBus = 1 - old;
    for (let i = 0; i < 2; i++) {
      const g = this.buses[i].gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(i === this.activeBus ? 1 : 0, t + 0.75);
    }
    this.step = 0;
  }
  startLoop(id: string, freq: number) {
    if (!this.ctx || !this.effects || this.loops.has(id)) return;
    const osc = this.ctx.createOscillator(),
      gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(this.effects);
    osc.start();
    this.loops.set(id, { osc, gain });
  }
  stopLoop(id: string) {
    const l = this.loops.get(id);
    if (l) {
      l.osc.stop();
      l.osc.disconnect();
      l.gain.disconnect();
      this.loops.delete(id);
    }
  }
  setPaused(p: boolean) {
    this.paused = p;
    this.updateVolume();
  }
  setEnabled(e: boolean) {
    this.enabled = e;
    this.updateVolume();
  }
  updateVolume() {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 0.42 : 0, t, 0.08);
    this.music?.gain.setTargetAtTime(
      this.settings.music * (this.paused ? 0.22 : 0.46),
      t,
      0.12,
    );
    this.effects?.gain.setTargetAtTime(
      this.settings.effects * (this.paused ? 0.3 : 1),
      t,
      0.08,
    );
  }
  tone(
    freq: number,
    duration: number,
    vol = 0.1,
    type: OscillatorType = "sine",
    music = false,
    slide = 1,
  ) {
    if (!this.ctx || !this.enabled || !this.effects) return;
    const c = this.ctx,
      t = c.currentTime,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, freq * slide),
      t + duration,
    );
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(music ? this.buses[this.activeBus] : this.effects);
    o.start(t);
    o.stop(t + duration + 0.01);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  noise(duration: number, vol: number, cutoff: number, music = false) {
    if (!this.ctx || !this.effects || !this.noiseBuffer || !this.enabled)
      return;
    const c = this.ctx,
      t = c.currentTime,
      n = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      g = c.createGain();
    n.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    n.connect(filter);
    filter.connect(g);
    g.connect(music ? this.buses[this.activeBus] : this.effects);
    n.start(t);
    n.stop(t + duration);
    n.onended = () => {
      n.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  }
  sfx(id: string) {
    const now = performance.now();
    if (
      now - (this.last.get(id) || -1000) <
      (id === "shot" ? 105 : id === "impact" ? 65 : 75)
    )
      return;
    this.last.set(id, now);
    switch (id) {
      case "shot":
        this.tone(720, 0.06, 0.025, "triangle", false, 0.58);
        break;
      case "impact":
        this.noise(0.055, 0.035, 3400);
        this.tone(260, 0.045, 0.035, "square", false, 0.55);
        break;
      case "hit":
        this.noise(0.16, 0.12, 1300);
        this.tone(135, 0.2, 0.12, "sawtooth", false, 0.3);
        break;
      case "explosion":
        this.noise(0.55, 0.21, 650);
        this.tone(72, 0.45, 0.19, "sine", false, 0.32);
        break;
      case "bomb":
        this.noise(0.9, 0.2, 430);
        this.tone(55, 0.85, 0.25, "sine", false, 0.37);
        break;
      case "posture":
        this.tone(330, 0.2, 0.09, "sine", false, 2);
        this.tone(660, 0.3, 0.04, "triangle");
        break;
      case "missile":
        this.noise(0.17, 0.05, 1500);
        this.tone(190, 0.3, 0.045, "triangle", false, 1.4);
        break;
      case "rescue":
        this.tone(660, 0.5, 0.1);
        this.tone(990, 0.7, 0.07);
        break;
      case "pickup":
        this.tone(1000, 0.1, 0.06, "sine", false, 1.5);
        break;
      case "dodge":
        this.tone(880, 0.18, 0.055, "triangle", false, 1.4);
        break;
      case "laser":
        this.tone(210, 0.5, 0.07, "sawtooth", false, 1.8);
        break;
      case "win":
        for (const n of [523.25, 659.25, 783.99]) this.tone(n, 1.3, 0.08);
        break;
      default:
        this.tone(520, 0.08, 0.055, "triangle", false, 0.8);
    }
  }
  beat() {
    if (!this.ctx || !this.enabled || this.paused) return;
    const i = this.step++,
      boss = this.mode === "boss",
      menu = this.mode === "menu";
    const themes: Record<string, number[]> = {
      M01: [146.83, 174.61, 220, 196, 130.81, 164.81, 196, 174.61],
      M02: [164.81, 174.61, 196, 220, 164.81, 146.83, 130.81, 146.83],
      M03: [220, 261.63, 329.63, 293.66, 196, 246.94, 293.66, 329.63],
    };
    const notes = menu
      ? [130.81, 196, 261.63, 293.66, 164.81, 246.94, 329.63, 293.66]
      : themes[this.stage] || themes.M01;
    const root = notes[Math.floor(i / 4) % notes.length];
    if (i % 4 === 0) {
      this.tone(
        root / (boss ? 4 : 2),
        0.5,
        boss ? 0.13 : 0.085,
        "triangle",
        true,
      );
      if (!boss)
        for (const ratio of [1, 1.5, 2])
          this.tone(root * ratio, 1.7, 0.025, "sine", true);
    }
    const n = notes[(i + (this.stage === "M02" ? 3 : 0)) % notes.length];
    this.tone(
      n * (boss ? 1 : 2),
      menu ? 0.6 : 0.21,
      this.stage === "M03" ? 0.045 : 0.055,
      this.stage === "M02" ? "triangle" : "sine",
      true,
    );
    if (!menu && i % 2 === 0)
      this.tone(58, 0.09, boss ? 0.13 : 0.075, "sine", true, 0.55);
    if (!menu && i % 8 === 4) this.noise(0.09, 0.035, 2600, true);
    if (boss && i % 2 === 1) this.noise(0.035, 0.025, 6500, true);
  }
}

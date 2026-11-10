export class AudioManager {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  music: GainNode | null = null;
  enabled = true;
  paused = false;
  mode = "menu";
  timer: ReturnType<typeof setInterval> | null = null;
  step = 0;
  last = new Map<string, number>();
  loops = new Map<string, { osc: OscillatorNode; gain: GainNode }>();
  async unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.gain.value = 0.2;
      this.music.connect(this.master);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (!this.timer) this.timer = setInterval(() => this.beat(), 180);
  }
  setMode(mode: string) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.stopLoop("motor");
    if (mode === "game" || mode === "boss") this.startLoop("motor", 48);
  }
  startLoop(id: string, freq: number) {
    if (!this.ctx || !this.master || this.loops.has(id)) return;
    const osc = this.ctx.createOscillator(),
      gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(this.master);
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
    if (this.ctx && this.master)
      this.master.gain.setTargetAtTime(
        this.enabled ? (this.paused ? 0.08 : 0.35) : 0,
        this.ctx.currentTime,
        0.12,
      );
  }
  tone(
    freq: number,
    duration: number,
    vol = 0.1,
    type: OscillatorType = "sine",
    music = false,
  ) {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(
      Math.max(20, freq * 0.65),
      t + duration,
    );
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(music ? this.music! : this.master);
    o.start(t);
    o.stop(t + duration);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  sfx(id: string) {
    const now = performance.now();
    if (now - (this.last.get(id) || -1000) < (id === "shot" ? 110 : 70)) return;
    this.last.set(id, now);
    const map: Record<string, number[]> = {
      shot: [680, 0.065, 0.035],
      hit: [150, 0.12, 0.1],
      explosion: [65, 0.3, 0.16],
      pickup: [1000, 0.12, 0.07],
      rescue: [780, 0.45, 0.15],
      laser: [230, 0.5, 0.09],
      bomb: [40, 0.7, 0.23],
      win: [1046, 0.7, 0.18],
      ui: [520, 0.1, 0.08],
    };
    const [f, d, v] = map[id] || map.ui;
    this.tone(f, d, v, id === "shot" ? "triangle" : "sine");
  }
  beat() {
    if (!this.ctx || !this.enabled || this.paused) return;
    const notes =
      this.mode === "boss"
        ? [55, 55, 65.4, 55, 73.4, 65.4, 49, 55]
        : [
            65.4, 98, 130.8, 98, 73.4, 110, 146.8, 110, 82.4, 123.5, 164.8,
            123.5, 73.4, 110, 146.8, 98,
          ];
    const i = this.step++;
    this.tone(notes[i % notes.length], 0.3, 0.11, "triangle", true);
    if (i % 4 === 0)
      this.tone(notes[i % notes.length] * 4, 0.6, 0.07, "sine", true);
    if ((this.mode === "game" || this.mode === "boss") && i % 2 === 0)
      this.tone(65, 0.07, 0.1, "sine", true);
  }
}

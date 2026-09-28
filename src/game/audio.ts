type Kind = "move" | "capture" | "castle" | "check" | "promote" | "end" | "select" | "illegal";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let prefsLoaded = false;
let ambientOn = false;
const listeners = new Set<() => void>();

function loadPrefs(): void {
  if (prefsLoaded || typeof window === "undefined") return;
  prefsLoaded = true;
  muted = window.localStorage.getItem("celestial-mute") === "1";
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeMute(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isMuted(): boolean {
  return muted;
}

export function hydrateMute(): void {
  loadPrefs();
  emit();
}

export function setMuted(next: boolean): void {
  loadPrefs();
  muted = next;
  window.localStorage.setItem("celestial-mute", next ? "1" : "0");
  if (ctx && master) {
    master.gain.setTargetAtTime(next ? 0.0001 : 0.85, ctx.currentTime, 0.03);
  }
  emit();
}

function startAmbient(): void {
  if (!ctx || !master || ambientOn) return;
  ambientOn = true;
  for (const freq of [196, 247, 311]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.012;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
  }
}

export function unlockAudio(): void {
  loadPrefs();
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) {
    ctx = new Ctx({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0.0001 : 0.85;
    master.connect(ctx.destination);
    startAmbient();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
}

function tone(freq: number, dur: number, type: OscillatorType, gainValue: number, delay = 0): void {
  if (!ctx || !master || muted) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

export function playFx(kind: Kind): void {
  unlockAudio();
  const drift = 0.97 + Math.random() * 0.06;
  if (kind === "select") tone(740 * drift, 0.07, "sine", 0.035);
  if (kind === "illegal") tone(140, 0.09, "triangle", 0.04);
  if (kind === "move") {
    tone(620 * drift, 0.11, "sine", 0.05);
    tone(930 * drift, 0.16, "triangle", 0.03, 0.03);
  }
  if (kind === "capture") {
    tone(220 * drift, 0.16, "sawtooth", 0.03);
    tone(440 * drift, 0.2, "triangle", 0.05, 0.01);
    tone(180, 0.12, "square", 0.015);
  }
  if (kind === "castle") {
    tone(523, 0.12, "sine", 0.045);
    tone(784, 0.16, "sine", 0.04, 0.08);
  }
  if (kind === "check") {
    tone(880, 0.1, "square", 0.03);
    tone(1170, 0.18, "triangle", 0.04, 0.06);
  }
  if (kind === "promote") {
    [523, 659, 784, 1046].forEach((freq, index) => tone(freq, 0.18, "sine", 0.045, index * 0.07));
  }
  if (kind === "end") {
    [392, 494, 587, 784].forEach((freq, index) => tone(freq, 0.4, "triangle", 0.04, index * 0.1));
  }
}

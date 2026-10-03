type Kind = "move" | "capture" | "castle" | "check" | "promote" | "end" | "select" | "illegal";

const THEMES = ["crystal", "rome", "anime", "sanguo", "ember", "tide", "aurora", "nile", "frost", "neon", "viet", "sengoku", "classic"] as const;
type ThemeId = (typeof THEMES)[number];

const THEME_FX: Record<ThemeId, { rate: number; cut: number; root: number }> = {
  crystal: { rate: 1, cut: 4800, root: 440 },
  rome: { rate: 0.84, cut: 1500, root: 392 },
  anime: { rate: 1.16, cut: 5600, root: 523 },
  sanguo: { rate: 0.92, cut: 2100, root: 330 },
  ember: { rate: 0.78, cut: 1100, root: 277 },
  tide: { rate: 1.05, cut: 2600, root: 349 },
  aurora: { rate: 1.1, cut: 3600, root: 415 },
  nile: { rate: 0.88, cut: 1800, root: 370 },
  frost: { rate: 0.96, cut: 2800, root: 392 },
  neon: { rate: 1.18, cut: 6200, root: 494 },
  viet: { rate: 0.9, cut: 2000, root: 349 },
  sengoku: { rate: 0.94, cut: 2200, root: 311 },
  classic: { rate: 1, cut: 3200, root: 392 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let fxBus: GainNode | null = null;
let muted = false;
let musicVol = 1;
let sfxVol = 1;
let prefsLoaded = false;
const listeners = new Set<() => void>();
const clips = new Map<string, AudioBuffer>();
let bedToken = 0;
let bedTheme = "";
let bedSource: AudioBufferSourceNode | null = null;
let bedGain: GainNode | null = null;

function clampVol(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function loadPrefs(): void {
  if (prefsLoaded || typeof window === "undefined") return;
  prefsLoaded = true;
  muted = window.localStorage.getItem("celestial-mute") === "1";
  const music = window.localStorage.getItem("celestial-music");
  const sfx = window.localStorage.getItem("celestial-sfx");
  if (music !== null) musicVol = clampVol(Number(music));
  if (sfx !== null) sfxVol = clampVol(Number(sfx));
}

function applyBuses(): void {
  if (!ctx || !master || !musicBus || !fxBus) return;
  const now = ctx.currentTime;
  master.gain.setTargetAtTime(muted ? 0.0001 : 0.85, now, 0.03);
  musicBus.gain.setTargetAtTime(musicVol, now, 0.03);
  fxBus.gain.setTargetAtTime(sfxVol, now, 0.02);
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
  applyBuses();
  emit();
}

export function musicVolume(): number {
  loadPrefs();
  return musicVol;
}

export function sfxVolume(): number {
  loadPrefs();
  return sfxVol;
}

export function setMusicVolume(value: number): void {
  loadPrefs();
  musicVol = clampVol(value);
  window.localStorage.setItem("celestial-music", String(musicVol));
  applyBuses();
  emit();
}

export function setSfxVolume(value: number): void {
  loadPrefs();
  sfxVol = clampVol(value);
  window.localStorage.setItem("celestial-sfx", String(sfxVol));
  applyBuses();
  emit();
}

function themeId(): ThemeId {
  const saved = typeof window === "undefined" ? "crystal" : (window.localStorage.getItem("celestial-theme") ?? "crystal");
  if (saved === "ember" || saved === "tide" || saved === "aurora") return "crystal";
  return (THEMES as readonly string[]).includes(saved) ? (saved as ThemeId) : "crystal";
}

function pieceId(piece?: string): string | null {
  const id = piece?.toLowerCase();
  return id && "pnbrqk".includes(id) ? id : null;
}

async function loadClip(url: string): Promise<AudioBuffer | null> {
  if (!ctx) return null;
  const hit = clips.get(url);
  if (hit) return hit;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
    clips.set(url, buffer);
    return buffer;
  } catch {
    return null;
  }
}

async function ensureBed(): Promise<void> {
  if (!ctx || !master || !musicBus) return;
  const theme = themeId();
  if (bedTheme === theme && bedSource) return;
  const token = ++bedToken;
  const buffer = await loadClip(`/audio/music/${theme}.mp3`);
  if (!ctx || !master || token !== bedToken || !buffer) return;
  const now = ctx.currentTime;
  const nextGain = ctx.createGain();
  nextGain.gain.setValueAtTime(0.0001, now);
  nextGain.connect(musicBus);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(nextGain);
  source.start();
  nextGain.gain.linearRampToValueAtTime(0.22, now + 0.7);
  if (bedGain && bedSource) {
    const oldGain = bedGain;
    const oldSource = bedSource;
    oldGain.gain.cancelScheduledValues(now);
    oldGain.gain.setValueAtTime(oldGain.gain.value, now);
    oldGain.gain.linearRampToValueAtTime(0.0001, now + 0.55);
    window.setTimeout(() => {
      try {
        oldSource.stop();
      } catch {
        /* already stopped */
      }
    }, 700);
  }
  bedGain = nextGain;
  bedSource = source;
  bedTheme = theme;
}

export function unlockAudio(): void {
  loadPrefs();
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!ctx) {
    ctx = new Ctx({ latencyHint: "interactive" });
    master = ctx.createGain();
    musicBus = ctx.createGain();
    fxBus = ctx.createGain();
    master.gain.value = muted ? 0.0001 : 0.85;
    musicBus.gain.value = musicVol;
    fxBus.gain.value = sfxVol;
    musicBus.connect(master);
    fxBus.connect(master);
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  void ensureBed();
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("celestial-theme", () => {
    if (ctx) void ensureBed();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx?.state === "suspended") void ctx.resume();
  });
}

function tone(freq: number, dur: number, type: OscillatorType, gainValue: number, delay = 0): void {
  if (!ctx || !fxBus || muted || sfxVol <= 0.001) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(fxBus);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

function playClip(url: string, rate: number, cut: number, gainValue: number): void {
  if (!ctx || !fxBus || muted || sfxVol <= 0.001) return;
  void loadClip(url).then((buffer) => {
    if (!buffer || !ctx || !fxBus || muted || sfxVol <= 0.001) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cut;
    const gain = ctx.createGain();
    gain.gain.value = gainValue;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(fxBus);
    source.start();
  });
}

function pieceLayer(piece: string | null, kind: Kind): void {
  const theme = THEME_FX[themeId()];
  const root = theme.root;
  if (piece) playClip(`/audio/pieces/${piece}.wav`, theme.rate, theme.cut, kind === "capture" ? 0.7 : 0.55);
  if (piece === "p") tone(root * 1.5, 0.08, "triangle", 0.03);
  if (piece === "n") {
    tone(root, 0.07, "triangle", 0.035);
    tone(root * 1.5, 0.1, "sine", 0.03, 0.08);
  }
  if (piece === "b") tone(root * 2, 0.22, "sine", 0.04);
  if (piece === "r") tone(root * 0.5, 0.16, "triangle", 0.04);
  if (piece === "q") {
    tone(root * 1.25, 0.1, "sine", 0.035);
    tone(root * 1.5, 0.12, "sine", 0.03, 0.06);
    tone(root * 2, 0.16, "triangle", 0.028, 0.12);
  }
  if (piece === "k") tone(root * 0.5, 0.24, "sine", 0.045);
}

export function playFx(kind: Kind, piece?: string): void {
  unlockAudio();
  const id = pieceId(piece);
  const drift = 0.97 + Math.random() * 0.06;
  const theme = THEME_FX[themeId()];
  if (kind === "select") {
    tone(theme.root * 1.5 * drift, 0.07, "sine", 0.03);
    pieceLayer(id, kind);
  }
  if (kind === "illegal") tone(140, 0.09, "triangle", 0.04);
  if (kind === "move") {
    tone(theme.root * 1.25 * drift, 0.11, "sine", 0.045);
    tone(theme.root * 1.5 * drift, 0.16, "triangle", 0.028, 0.03);
    pieceLayer(id, kind);
  }
  if (kind === "capture") {
    tone(theme.root * 0.5 * drift, 0.16, "sawtooth", 0.025);
    tone(theme.root * drift, 0.2, "triangle", 0.04, 0.01);
    pieceLayer(id, kind);
  }
  if (kind === "castle") {
    tone(theme.root, 0.12, "sine", 0.04);
    tone(theme.root * 1.5, 0.16, "sine", 0.035, 0.08);
    pieceLayer("k", kind);
    pieceLayer("r", kind);
  }
  if (kind === "check") {
    tone(theme.root * 2, 0.1, "square", 0.025);
    tone(theme.root * 2.5, 0.18, "triangle", 0.035, 0.06);
    pieceLayer(id ?? "k", kind);
  }
  if (kind === "promote") {
    [1, 1.25, 1.5, 2].forEach((step, index) => tone(theme.root * step, 0.16, "sine", 0.04, index * 0.07));
    pieceLayer(id ?? "q", kind);
  }
  if (kind === "end") {
    [1, 1.25, 1.5, 2].forEach((step, index) => tone(theme.root * step, 0.36, "triangle", 0.035, index * 0.1));
  }
}

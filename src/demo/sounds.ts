let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)());

function tone(f: number, dur: number, type: OscillatorType = 'sine', t0 = 0, g = 0.2, f2?: number) {
  const c = ac(), o = c.createOscillator(), v = c.createGain(), t = c.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(v).connect(c.destination); o.start(t); o.stop(t + dur);
}

function noise(dur: number, t0 = 0, g = 0.25, hp = 3000) {
  const c = ac(), n = c.sampleRate * dur, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain(), t = c.currentTime + t0;
  s.buffer = b; f.type = 'highpass'; f.frequency.value = hp;
  v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(v).connect(c.destination); s.start(t);
}

export const sounds = {
  scissors: () => {
    noise(0.09, 0, 0.3, 4500);
    noise(0.12, 0.13, 0.3, 3500);
    tone(2400, 0.05, 'square', 0, 0.04);
  },
  drawer: () => {
    tone(90, 0.18, 'sine', 0, 0.5, 40);
    noise(0.06, 0.02, 0.2, 800);
    tone(1568, 0.5, 'sine', 0.2, 0.12);
    tone(2093, 0.6, 'sine', 0.24, 0.1);
  },
  creditStamp: () => {
    tone(140, 0.2, 'triangle', 0, 0.6, 50);
    noise(0.1, 0, 0.35, 300);
    tone(70, 0.3, 'sine', 0.05, 0.4);
  },
  boltBuster: () => {
    for (let i = 0; i < 4; i++) {
      tone(i % 2 ? 660 : 880, 0.18, 'sawtooth', i * 0.2, 0.15);
    }
  },
  beep: () => tone(1200, 0.07, 'square', 0, 0.08),
  remove: () => tone(500, 0.15, 'triangle', 0, 0.15, 220),
  success: () => {
    tone(523, 0.12, 'sine', 0, 0.2);
    tone(659, 0.12, 'sine', 0.1, 0.2);
    tone(784, 0.25, 'sine', 0.2, 0.2);
  },
  error: () => {
    tone(200, 0.25, 'sawtooth', 0, 0.2);
    tone(150, 0.3, 'sawtooth', 0.2, 0.2);
  }
};

let isMuted = false;
export const setMuted = (m: boolean) => { isMuted = m; };
export const getMuted = () => isMuted;

export type SoundName = keyof typeof sounds;
export const play = (n: SoundName) => {
  if (isMuted) return;
  try {
    ac().resume();
    sounds[n]();
  } catch {
    /* audio blocked */
  }
};

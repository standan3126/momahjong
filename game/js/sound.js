/* ============================================================================
   1. SYNTHESIZED WEB AUDIO SOUND ENGINE (SFX + ZEN MUSIC LOOP, NO AUDIO FILES)
   ============================================================================ */
const SoundFX = {
    ctx: null,
    master: null,
    sfx: null,
    musicBus: null,
    noiseBuf: null,
    musicTimer: null,
    nextNoteTime: 0,
    musicStep: 0,
    melIdx: 3,

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            this.ctx = new AudioCtx();
            this.master = this.ctx.createGain();
            this.master.connect(this.ctx.destination);
            this.sfx = this.ctx.createGain();
            this.sfx.connect(this.master);
            this.musicBus = this.ctx.createGain();
            this.musicBus.gain.value = 0;
            this.musicBus.connect(this.master);
            const len = this.ctx.sampleRate;
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const data = this.noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
            this.applyVolumes();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    applyVolumes() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.master.gain.setTargetAtTime(settings.volume, now, 0.05);
        this.sfx.gain.setTargetAtTime(settings.sound ? 1 : 0, now, 0.05);
        this.musicBus.gain.setTargetAtTime(settings.music ? 0.35 : 0, now, 0.4);
    },
    ready() {
        if (!settings.sound) return false;
        this.init();
        return !!this.ctx;
    },
    tone(freq, dur, { type = 'sine', vol = 0.2, when = 0, slide = null, attack = 0.005, dest = null } = {}) {
        const t = this.ctx.currentTime + Math.max(0, when);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(dest || this.sfx);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    },
    noise(dur, { vol = 0.2, when = 0, type = 'bandpass', freq = 1000, freqTo = null, q = 1 } = {}) {
        const t = this.ctx.currentTime + when;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(freq, t);
        if (freqTo) filter.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
        filter.Q.value = q;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfx);
        src.start(t);
        src.stop(t + dur + 0.05);
    },

    // --- Tile & board sounds ---
    select() {
        if (!this.ready()) return;
        this.tone(440, 0.07, { type: 'triangle', vol: 0.26, slide: 170 });
        this.noise(0.03, { vol: 0.07, freq: 3200, q: 2 });
    },
    deselect() {
        if (!this.ready()) return;
        this.tone(300, 0.06, { type: 'triangle', vol: 0.16, slide: 120 });
    },
    match(step = 0) {
        if (!this.ready()) return;
        // Quick matches walk this little pentatonic tune up and back down, then around
        // again, so a long run stays gentle instead of climbing out of reach.
        const penta = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        const TUNE = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];
        const i = TUNE[step % TUNE.length];
        this.tone(penta[i], 0.38, { vol: 0.2 });
        this.tone(penta[i] * 1.5, 0.4, { vol: 0.07, when: 0.06 });
        this.noise(0.05, { vol: 0.05, freq: 5000, q: 3 });
    },
    golden() {
        if (!this.ready()) return;
        [1046.5, 1318.51, 1567.98, 2093.0, 2637.0].forEach((f, i) => this.tone(f, 0.55, { type: 'triangle', vol: 0.11, when: i * 0.055 }));
        this.noise(0.6, { vol: 0.05, type: 'highpass', freq: 7000 });
    },
    error() {
        if (!this.ready()) return;
        this.tone(160, 0.16, { type: 'sawtooth', vol: 0.11, slide: 110 });
    },
    mystery() {
        if (!this.ready()) return;
        this.tone(600, 0.35, { vol: 0.1, slide: 1800 });
        this.tone(1200, 0.3, { type: 'triangle', vol: 0.06, when: 0.1, slide: 2400 });
    },
    gong() {
        if (!this.ready()) return;
        [[110, 0.2, 2.2], [220, 0.09, 1.8], [333, 0.06, 1.4], [572, 0.04, 1.0]].forEach(([f, v, d]) => this.tone(f, d, { vol: v, attack: 0.01 }));
    },

    // --- Power-ups ---
    powerup() {
        if (!this.ready()) return;
        [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, 0.3, { vol: 0.16, when: i * 0.05 }));
    },
    hint() {
        if (!this.ready()) return;
        this.tone(880, 0.25, { vol: 0.16 });
        this.tone(1318.5, 0.4, { vol: 0.16, when: 0.12 });
    },
    shuffle() {
        if (!this.ready()) return;
        this.noise(0.65, { vol: 0.28, freq: 350, freqTo: 4500, q: 0.8 });
        this.tone(220, 0.55, { type: 'triangle', vol: 0.06, slide: 700 });
    },
    undo() {
        if (!this.ready()) return;
        this.tone(950, 0.35, { type: 'triangle', vol: 0.15, slide: 300 });
        this.noise(0.3, { vol: 0.08, freq: 3000, freqTo: 500 });
    },
    torch() {
        if (!this.ready()) return;
        this.noise(0.95, { type: 'lowpass', freq: 3200, freqTo: 180, vol: 0.4, q: 0.5 });
        this.tone(95, 0.85, { type: 'sawtooth', vol: 0.12, slide: 45 });
    },
    eagle() {
        if (!this.ready()) return;
        this.tone(2300, 0.38, { vol: 0.12, slide: 1300 });
        this.tone(2600, 0.32, { vol: 0.1, when: 0.26, slide: 1500 });
    },

    // --- UI / rewards ---
    ui() {
        if (!this.ready()) return;
        this.tone(700, 0.05, { type: 'triangle', vol: 0.1 });
    },
    tick() {
        if (!this.ready()) return;
        this.tone(1500, 0.03, { type: 'square', vol: 0.045 });
    },
    coach() {
        if (!this.ready()) return;
        this.tone(1046.5, 0.15, { vol: 0.09 });
        this.tone(1568, 0.25, { vol: 0.09, when: 0.08 });
    },
    star(i) {
        if (!this.ready()) return;
        this.tone(880 * (1 + i * 0.26), 0.3, { type: 'triangle', vol: 0.15 });
        this.tone(1760 * (1 + i * 0.26), 0.2, { vol: 0.05, when: 0.03 });
    },
    prize() {
        if (!this.ready()) return;
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.14, when: i * 0.07 }));
        this.noise(0.5, { vol: 0.05, type: 'highpass', freq: 6000, when: 0.25 });
    },
    fanfare() {
        if (!this.ready()) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.32, { type: 'triangle', vol: 0.16, when: i * 0.1 }));
        [523.25, 659.25, 783.99, 1046.5].forEach(f => this.tone(f, 1.2, { vol: 0.08, when: 0.42 }));
    },

    // --- Zen music: soft pentatonic plucks over a slow drone ---
    startMusic() {
        if (!settings.music) return;
        this.init();
        if (!this.ctx || this.musicTimer) return;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.musicTimer = setInterval(() => this.scheduleMusic(), 120);
        this.applyVolumes();
    },
    stopMusic() {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
        this.applyVolumes();
    },
    scheduleMusic() {
        const ctx = this.ctx;
        const scale = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
        if (this.nextNoteTime < ctx.currentTime) this.nextNoteTime = ctx.currentTime + 0.05;
        while (this.nextNoteTime < ctx.currentTime + 0.5) {
            const when = this.nextNoteTime - ctx.currentTime;
            const step = this.musicStep;
            if (step % 16 === 0) {
                const bass = [73.42, 98.0, 110.0, 82.41][(step / 16) % 4];
                this.tone(bass, 4.6, { vol: 0.16, when, attack: 0.3, dest: this.musicBus });
                this.tone(bass * 1.5, 4.6, { vol: 0.05, when, attack: 0.5, dest: this.musicBus });
            }
            if (Math.random() < (step % 2 === 0 ? 0.55 : 0.22)) {
                this.melIdx = Math.max(0, Math.min(scale.length - 1, this.melIdx + Math.floor(Math.random() * 5) - 2));
                this.tone(scale[this.melIdx], 0.9, { type: 'triangle', vol: 0.07, when, attack: 0.01, dest: this.musicBus });
            }
            this.nextNoteTime += 0.3;
            this.musicStep++;
        }
    }
};

function buzz(pattern) {
    if (!settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* unsupported (iOS) */ }
}

/* ============================================================================
   1. MOMAHJONG'S TILE SOUNDS (synthesized, no audio files)
      Played through GameHub's shared Sound (js/hub.js: Hub.sound), into its "game
      sounds" bus, so the shared Settings' volume, Mute, sleep timer and pause-when-
      hidden all apply. Music and nature sounds are the shared Sound's; the old Zen
      music moved into the toolbox (shared/v1/sound/zen.js) on 2026-10-28.
   ============================================================================ */
const SoundFX = {
    ctx: null,
    sfx: null,
    noiseBuf: null,

    // Ready once GameHub's Sound has been unlocked by the first tap (Tap to Start).
    ready() {
        const sound = window.Hub && window.Hub.sound;
        if (!sound || !sound.ctx) return false;
        if (this.ctx !== sound.ctx) {
            this.ctx = sound.ctx;
            this.sfx = this.ctx.createGain();
            this.sfx.gain.value = 1;
            this.sfx.connect(sound.buses.notes);
            const len = this.ctx.sampleRate;
            this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const data = this.noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        }
        return true;
    },
    tone(freq, dur, { type = 'sine', vol = 0.2, when = 0, slide = null, attack = 0.005 } = {}) {
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
        gain.connect(this.sfx);
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

    // --- UI / rewards ---
    ui() {
        if (!this.ready()) return;
        this.tone(700, 0.05, { type: 'triangle', vol: 0.1 });
    },
    star(i) {
        if (!this.ready()) return;
        this.tone(880 * (1 + i * 0.26), 0.3, { type: 'triangle', vol: 0.15 });
        this.tone(1760 * (1 + i * 0.26), 0.2, { vol: 0.05, when: 0.03 });
    },
    fanfare() {
        if (!this.ready()) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.32, { type: 'triangle', vol: 0.16, when: i * 0.1 }));
        [523.25, 659.25, 783.99, 1046.5].forEach(f => this.tone(f, 1.2, { vol: 0.08, when: 0.42 }));
    }
};

function buzz(pattern) {
    if (!settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch (e) { /* unsupported (iOS) */ }
}

/* ============================================================================
   1b. PARTICLE FX (match bursts, sparkles, confetti) ON ONE CANVAS
   ============================================================================ */
const FX = {
    canvas: null,
    g: null,
    parts: [],
    running: false,
    dpr: 1,
    init() {
        this.canvas = document.getElementById('fxCanvas');
        this.g = this.canvas.getContext('2d');
        this.resize();
    },
    resize() {
        if (!this.canvas) return;
        this.dpr = Math.min(2, window.devicePixelRatio || 1);
        this.canvas.width = Math.round(window.innerWidth * this.dpr);
        this.canvas.height = Math.round(window.innerHeight * this.dpr);
    },
    burst(x, y, colors, n = 16, opts = {}) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = (opts.speed || 4) * (0.4 + Math.random());
            this.parts.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - (opts.lift ?? 1.5),
                g: opts.gravity ?? 0.15,
                life: (opts.life || 32) + Math.random() * 22,
                age: 0,
                size: (opts.size || 4) * (0.6 + Math.random() * 0.8),
                color: colors[i % colors.length],
                shape: opts.shape || (i % 3 === 0 ? 'star' : 'circle'),
                rot: Math.random() * 6,
                vr: (Math.random() - 0.5) * 0.4
            });
        }
        this.start();
    },
    confetti(n = 140) {
        const cols = ['#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#f87171', '#fde047', '#a78bfa'];
        for (let i = 0; i < n; i++) {
            this.parts.push({
                x: Math.random() * window.innerWidth,
                y: -20 - Math.random() * window.innerHeight * 0.4,
                vx: (Math.random() - 0.5) * 2.5,
                vy: 2 + Math.random() * 3,
                g: 0.05,
                life: 150 + Math.random() * 90,
                age: 0,
                size: 6 + Math.random() * 6,
                color: cols[i % cols.length],
                shape: 'rect',
                rot: Math.random() * 6,
                vr: (Math.random() - 0.5) * 0.3
            });
        }
        this.start();
    },
    start() {
        if (this.running || !this.g) return;
        this.running = true;
        requestAnimationFrame(() => this.tick());
    },
    tick() {
        const g = this.g;
        g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        g.clearRect(0, 0, window.innerWidth, window.innerHeight);
        this.parts = this.parts.filter(p => p.age < p.life);
        for (const p of this.parts) {
            p.age++;
            p.vy += p.g;
            p.vx *= 0.985;
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vr;
            const alpha = 1 - p.age / p.life;
            g.globalAlpha = Math.max(0, Math.min(1, alpha * 1.4));
            g.fillStyle = p.color;
            if (p.shape === 'rect') {
                g.save();
                g.translate(p.x, p.y);
                g.rotate(p.rot);
                g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                g.restore();
            } else if (p.shape === 'star') {
                const s = p.size * 1.4;
                g.save();
                g.translate(p.x, p.y);
                g.rotate(p.rot);
                g.beginPath();
                g.moveTo(0, -s); g.lineTo(s * 0.25, -s * 0.25); g.lineTo(s, 0); g.lineTo(s * 0.25, s * 0.25);
                g.lineTo(0, s); g.lineTo(-s * 0.25, s * 0.25); g.lineTo(-s, 0); g.lineTo(-s * 0.25, -s * 0.25);
                g.closePath();
                g.fill();
                g.restore();
            } else {
                g.beginPath();
                g.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
                g.fill();
            }
        }
        g.globalAlpha = 1;
        if (this.parts.length) {
            requestAnimationFrame(() => this.tick());
        } else {
            this.running = false;
            g.clearRect(0, 0, window.innerWidth, window.innerHeight);
        }
    }
};

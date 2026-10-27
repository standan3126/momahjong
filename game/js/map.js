/* ============================================================================
   13b. THE BAMBOO PATH: A SCROLLING MAP OF EVERY LEVEL
        Drawn in code (SVG): a bamboo path winds up through a new scene every
        10 levels. Won levels show their stars and can be replayed; the next
        level glows; later ones are locked. Bosses are pagodas, chests are 🎁.
   ============================================================================ */
const MAP_W = 360;          // the map's drawing width; it scales to the screen
const MAP_STEP = 92;        // height between two levels
const MAP_PAD = 120;        // space above the top level and below level 1
const MAP_GAP = 74;         // extra room between chapters, for the chapter's sign

const MAP_SCENES = [
    { name: 'Sanctuary Training', sky: '#0d3324', ground: '#14462f', leaf: '#86b35a', accent: '🎓' },
    { name: 'Bamboo Grove', sky: '#123a29', ground: '#1b4d35', leaf: '#9cc56b', accent: '🎋' },
    { name: 'Koi River', sky: '#0f3a3a', ground: '#14504d', leaf: '#7fb98f', accent: '🐟' },
    { name: 'Misty Mountains', sky: '#24363a', ground: '#2f4a47', leaf: '#93b39a', accent: '⛰️' },
    { name: 'Cherry Blossom Garden', sky: '#3a2333', ground: '#4b2f3f', leaf: '#a7c27a', accent: '🌸' },
    { name: 'Lantern Village', sky: '#3a2516', ground: '#4d3220', leaf: '#a4b86a', accent: '🏮' },
    { name: 'Jade Temple', sky: '#0f3b33', ground: '#155244', leaf: '#8fd1a8', accent: '🏯' },
    { name: 'Moonlit Pond', sky: '#1a2236', ground: '#22304a', leaf: '#86a98a', accent: '🌙' },
    { name: 'Crane Peaks', sky: '#2b3330', ground: '#38443f', leaf: '#a0b88f', accent: '🕊️' }
];
// Chapter 0 is training (levels 1-10); then each 10 levels is one scene, cycling forever.
const chapterOf = level => Math.floor((level - 1) / 10);
const sceneOf = chapter => (chapter === 0 ? MAP_SCENES[0] : MAP_SCENES[1 + ((chapter - 1) % (MAP_SCENES.length - 1))]);

// The level the player is on, even while replaying an old one.
const mainLevel = () => state.replayFrom ?? (state.levelDone ? nextLevelAfter(state.level) : state.level);

function mapPoint(level, lastLevel) {
    const y = MAP_PAD + (lastLevel - level) * MAP_STEP + (chapterOf(lastLevel) - chapterOf(level)) * MAP_GAP;
    const x = MAP_W / 2 + Math.sin(level * 0.85) * MAP_W * 0.27;
    return { x, y };
}

// A smooth curve through the points (Catmull-Rom as cubic Béziers).
function smoothPath(pts) {
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
        const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
        d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
}

// One bamboo stalk with joints and a few leaves.
function stalk(x, yTop, yBottom, w, color, rng) {
    let s = `<rect x="${(x - w / 2).toFixed(1)}" y="${yTop.toFixed(1)}" width="${w}" height="${(yBottom - yTop).toFixed(1)}" rx="${w / 2}" fill="${color}" opacity="0.55"/>`;
    for (let y = yTop + 30 + rng() * 20; y < yBottom - 10; y += 38 + rng() * 22) {
        s += `<rect x="${(x - w / 2 - 1).toFixed(1)}" y="${y.toFixed(1)}" width="${w + 2}" height="3" rx="1.5" fill="#0b2a1d" opacity="0.45"/>`;
        if (rng() < 0.55) {
            const dir = rng() < 0.5 ? -1 : 1;
            s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q${dir * 14},-10 ${dir * 30},-4 q${-dir * 14},4 ${-dir * 30},4z" fill="${color}" opacity="0.6"/>`;
        }
    }
    return s;
}

// Scenery for one chapter's band of the map.
function chapterDecor(chapter, yTop, yBottom) {
    const scene = sceneOf(chapter);
    const rng = mulberry32(hashSeed(chapter, 777));
    let s = `<rect x="0" y="${yTop}" width="${MAP_W}" height="${yBottom - yTop}" fill="${scene.sky}"/>`;
    s += `<rect x="0" y="${yBottom - 26}" width="${MAP_W}" height="26" fill="${scene.ground}" opacity="0.7"/>`;
    // Stalks along both edges, away from the path in the middle
    for (let i = 0; i < 4; i++) {
        s += stalk(10 + rng() * 34, yTop + rng() * 120, yBottom, 7 + rng() * 5, scene.leaf, rng);
        s += stalk(MAP_W - 10 - rng() * 34, yTop + rng() * 120, yBottom, 7 + rng() * 5, scene.leaf, rng);
    }
    // A few touches that belong to this scene
    const dots = (n, fn) => { for (let i = 0; i < n; i++) s += fn(rng() * MAP_W, yTop + 60 + rng() * (yBottom - yTop - 90)); };
    const kind = scene.name;
    if (kind === 'Koi River') dots(5, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="4" fill="#f97316" opacity="0.55"/><path d="M${x - 9},${y} l-6,-4 v8z" fill="#f97316" opacity="0.55"/>`);
    if (kind === 'Misty Mountains') dots(3, (x, y) => `<path d="M${x - 50},${y + 30} L${x},${y - 30} L${x + 50},${y + 30}z" fill="#cbd5d1" opacity="0.12"/>`);
    if (kind === 'Cherry Blossom Garden') dots(16, (x, y) => `<circle cx="${x}" cy="${y}" r="${2 + rng() * 3}" fill="#f9a8d4" opacity="0.6"/>`);
    if (kind === 'Lantern Village') dots(5, (x, y) => `<circle cx="${x}" cy="${y}" r="14" fill="#f59e0b" opacity="0.12"/><rect x="${x - 6}" y="${y - 8}" width="12" height="16" rx="5" fill="#dc2626" opacity="0.75"/>`);
    if (kind === 'Jade Temple') dots(2, (x, y) => `<path d="M${x - 26},${y} L${x},${y - 14} L${x + 26},${y}z M${x - 18},${y + 10} L${x},${y} L${x + 18},${y + 10}z" fill="#0f766e" opacity="0.35"/>`);
    if (kind === 'Moonlit Pond') s += `<circle cx="${MAP_W - 70}" cy="${yTop + 70}" r="26" fill="#fef3c7" opacity="0.18"/>`;
    if (kind === 'Crane Peaks') dots(4, (x, y) => `<path d="M${x - 10},${y} q10,-8 20,0" stroke="#e5e7eb" stroke-width="2" fill="none" opacity="0.4"/>`);
    if (kind === 'Bamboo Grove' || kind === 'Sanctuary Training') dots(8, (x, y) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#fde68a" opacity="0.35"/>`);
    return s;
}

// The chapter's name on a little sign, in the gap where the chapter begins.
function chapterSign(chapter, y) {
    const scene = sceneOf(chapter);
    const label = `${scene.accent} ${scene.name}`;
    const w = 40 + label.length * 9;
    return `<g><rect x="${(MAP_W - w) / 2}" y="${y - 17}" width="${w}" height="30" rx="15" fill="#062a1c" fill-opacity="0.88" stroke="#fbbf24" stroke-opacity="0.6"/>
        <text x="${MAP_W / 2}" y="${y + 4}" text-anchor="middle" font-size="14" font-weight="800" fill="#fde68a" font-family="Cinzel, serif">${label}</text></g>`;
}

function renderMap() {
    const current = mainLevel();
    const nextBoss = Math.ceil((current + 1) / 10) * 10;
    const last = Math.max(current + 8, nextBoss);
    const height = mapPoint(1, last).y + MAP_PAD;
    let svg = '';
    const signs = [];

    // Scenery, one band per chapter; each band starts (at its bottom) with the chapter's sign
    for (let ch = chapterOf(last); ch >= 0; ch--) {
        const top = ch === chapterOf(last) ? 0 : mapPoint(ch * 10 + 10, last).y - MAP_STEP / 2;
        const bottom = ch === 0 ? height : mapPoint(ch * 10 + 1, last).y + MAP_STEP / 2 + MAP_GAP;
        svg += chapterDecor(ch, top, bottom);
        signs.push(chapterSign(ch, ch === 0 ? height - MAP_PAD / 2 : bottom - MAP_GAP / 2));
    }

    // The bamboo path: a pale stalk, darker joints, and a soft shadow
    const pts = [];
    for (let l = 1; l <= last; l++) pts.push(mapPoint(l, last));
    const d = smoothPath(pts);
    svg += `<path d="${d}" stroke="#000" stroke-opacity="0.25" stroke-width="20" fill="none" stroke-linecap="round" transform="translate(0 4)"/>`;
    svg += `<path d="${d}" stroke="#a3c46f" stroke-width="15" fill="none" stroke-linecap="round"/>`;
    svg += `<path d="${d}" stroke="#d9ec9c" stroke-opacity="0.5" stroke-width="4" fill="none" stroke-linecap="round" transform="translate(-3 -2)"/>`;
    svg += `<path d="${d}" stroke="#4d6b2a" stroke-width="15" fill="none" stroke-dasharray="3 31" stroke-linecap="butt"/>`;

    svg += signs.join('');

    // The levels
    for (let l = 1; l <= last; l++) {
        const { x, y } = mapPoint(l, last);
        const won = l < current;
        const here = l === current;
        const boss = isBossLevel(l);
        const r = boss ? 26 : here ? 23 : 19;
        const fill = here ? 'url(#nodeGold)' : won ? 'url(#nodeJade)' : '#3f4a46';
        let g = `<g class="map-node${here ? ' map-here' : ''}" data-level="${l}" role="button" aria-label="Level ${l}${won ? `, ${starsOf(l)} stars` : here ? ', play' : ', locked'}" tabindex="0">`;
        g += `<circle cx="${x}" cy="${y}" r="${r + 10}" fill="transparent"/>`;
        if (here) g += `<circle class="map-ring" cx="${x}" cy="${y}" r="${r + 6}" fill="none" stroke="#fde68a" stroke-width="3"/>`;
        g += `<circle cx="${x}" cy="${y + 3}" r="${r}" fill="#000" opacity="0.3"/>`;
        g += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${boss ? '#f87171' : '#fde68a'}" stroke-width="${boss ? 3.5 : 2}" stroke-opacity="${won || here ? 1 : 0.35}"/>`;
        if (boss) g += `<text x="${x}" y="${y - r - 6}" text-anchor="middle" font-size="22">🏯</text>`;
        else if (isChestLevel(l)) g += `<text x="${x + r + 4}" y="${y - r + 8}" font-size="16">🎁</text>`;
        g += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="${l > 99 ? 13 : 15}" font-weight="800" fill="${won || here ? '#062a1c' : '#9ca3af'}">${l}</text>`;
        if (won && !isTrainingLevel(l)) {
            const n = starsOf(l);
            for (let i = 0; i < 3; i++) g += `<text x="${x - 16 + i * 16}" y="${y + r + 15}" text-anchor="middle" font-size="12" opacity="${i < n ? 1 : 0.25}">⭐</text>`;
        } else if (won) {
            g += `<text x="${x}" y="${y + r + 15}" text-anchor="middle" font-size="12">🎓</text>`;
        } else if (!here) {
            g += `<text x="${x + r - 4}" y="${y + r - 2}" font-size="11">🔒</text>`;
        }
        if (boss && l >= current) {
            const gate = bossGate(l);
            const label = gate.open ? '🔓 open' : `🔒 ${gate.have} / ${gate.need} ⭐`;
            g += `<rect x="${x - 42}" y="${y + r + 4}" width="84" height="20" rx="10" fill="#062a1c" fill-opacity="0.9"/>`;
            g += `<text x="${x}" y="${y + r + 18}" text-anchor="middle" font-size="11" font-weight="800" fill="${gate.open ? '#86efac' : '#fca5a5'}">${label}</text>`;
        }
        svg += g + '</g>';
    }

    const defs = `<defs>
        <radialGradient id="nodeJade" cx="40%" cy="35%"><stop offset="0%" stop-color="#a7f3d0"/><stop offset="100%" stop-color="#059669"/></radialGradient>
        <radialGradient id="nodeGold" cx="40%" cy="35%"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#f59e0b"/></radialGradient>
    </defs>`;
    $('mapCanvas').innerHTML = `<svg viewBox="0 0 ${MAP_W} ${height}" width="100%" style="display:block">${defs}${svg}</svg>`;
    $('mapStars').textContent = `⭐ ${totalStars()}`;
    $('mapGold').textContent = `🪙 ${state.gold}`;
    $('mapRank').textContent = getCurrentRank().name;
    $('mapPlayBtn').textContent = `▶ Play Level ${current}`;
    return { last, height };
}

function openMap(focus = mainLevel()) {
    hideTitle();
    const { last, height } = renderMap();
    $('mapScreen').classList.remove('hidden');
    // Scroll so the focused level sits in the middle of the screen
    const scroller = $('mapScroll');
    requestAnimationFrame(() => {
        const scale = scroller.clientWidth / MAP_W;
        const y = mapPoint(Math.min(focus, last), last).y * scale;
        scroller.scrollTop = Math.max(0, Math.min(height * scale, y - scroller.clientHeight / 2));
    });
}

function closeMap() {
    $('mapScreen').classList.add('hidden');
}

// Back from the map: carry on with the level in progress, or start the current one.
function mapPlay() {
    closeMap();
    const level = mainLevel();
    if (!state.replayFrom && state.level === level && state.tiles.length && !state.levelDone) return;
    if (state.replayFrom) state.replayFrom = null;
    resumeOrPlay(level);
}

// Picks up a half-played board if one is saved for this level; otherwise starts it.
function resumeOrPlay(level) {
    const d = currentSlot && storageGet(SLOT_KEY(currentSlot));
    if (d && d.board && d.board.level === level && level > TRAINING_LEVELS) restoreBoard(d.board);
    else playLevel(level);
}

function replayLevel(level, returnTo = mainLevel()) {
    saveProgress(); // keeps a half-played board of the main level, to come back to
    closeMap();
    state.replayFrom = returnTo;
    startLevel(level);
}

function onMapTap(level) {
    const current = mainLevel();
    if (level === current) return mapPlay();
    if (level > current) {
        SoundFX.error();
        const gate = isBossLevel(level) ? ` It needs ${bossGate(level).need} ⭐ from levels ${level - 9}–${level - 1}.` : '';
        return showMessage({ icon: '🔒', title: `Level ${level} is locked`, text: `Finish Level ${current} first.${gate}`, buttons: [{ label: 'OK', style: 'primary' }] });
    }
    SoundFX.ui();
    const n = starsOf(level);
    const lesson = isTrainingLevel(level);
    showMessage({
        icon: lesson ? '🎓' : '🔁',
        title: `Replay Level ${level}?`,
        text: lesson
            ? 'Play this lesson again. Lessons give no gold or stars.'
            : `Best so far: ${n ? '⭐'.repeat(n) : 'no stars'}. Replays pay half the gold, and a better result raises your stars. You'll come back to Level ${current} after.`,
        buttons: [
            { label: `Replay Level ${level}`, style: 'primary', onClick: () => replayLevel(level) },
            { label: 'Cancel', style: 'ghost' }
        ]
    });
}

document.addEventListener('click', e => {
    const node = e.target.closest && e.target.closest('.map-node');
    if (node) onMapTap(Number(node.dataset.level));
});

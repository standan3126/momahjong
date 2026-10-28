// Picks a board for each of levels 1-150 so difficulty climbs the staircase smoothly instead of
// by luck of the draw. Every level can be built 24 ways (its "variants", all from seeds, so
// nothing but one character per level is stored). For each variant a simple simulated player
// (picks any open match at random) plays it many times; the share of games finished without
// ever running out of matches is the board's "clean finish" rate. The variant closest to the
// rate wanted for the level's step is kept and written to game/js/level-seeds.js.
// Run it again after changing the level code: node build/tune-levels.mjs  (under a minute on 16 cores)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';

const here = path.dirname(fileURLToPath(import.meta.url));
const js = path.join(here, '..', 'game', 'js');
const LEVELS = 150;
const VARIANTS = 24;
const PLAYS = 150;

// Wanted clean-finish rate: 80% on step 1, down to 40% on the top step. Bosses already play a
// step ahead (difficultyStep) on a bigger board, and aim one more step lower so they stand out.
const wanted = (level, step) => 0.8 - 0.4 * Math.min(1, (step - 1 + (level % 10 === 0 ? 1 : 0)) / 7);

function loadLevelCode() {
    const stub = () => new Proxy(function () {}, { get: () => stub(), apply: () => stub() });
    const context = vm.createContext({ console, Math, window: stub(), document: stub(), localStorage: stub(), navigator: stub() });
    const code = ['tiles', 'random', 'formations', 'level-seeds', 'levels', 'economy'].map(f => fs.readFileSync(path.join(js, `${f}.js`), 'utf8')).join('\n');
    vm.runInContext(code + '\n;globalThis.__api = { generateBoard, difficultyStep, mulberry32, hashSeed };', context);
    return context.__api;
}

// The random player. Free-tile rules as in isTileFree, kept as counters for speed.
function cleanFinishRate(board, mulberry32, hashSeed, seedBase) {
    const n = board.tiles.length;
    const above = [], left = [], right = [];
    for (const t of board.tiles) {
        const a = [], l = [], r = [];
        for (const o of board.tiles) {
            if (o === t) continue;
            if (o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2) a.push(o.uid);
            else if (o.z === t.z && Math.abs(o.y - t.y) < 2) {
                if (o.x === t.x - 2) l.push(o.uid);
                if (o.x === t.x + 2) r.push(o.uid);
            }
        }
        above.push(a); left.push(l); right.push(r);
    }
    // Who each tile holds down, so removing it updates only its neighbours' counts.
    const holds = Array.from({ length: n }, () => []);
    board.tiles.forEach((t, i) => {
        above[i].forEach(o => holds[o].push([i, 0]));
        left[i].forEach(o => holds[o].push([i, 1]));
        right[i].forEach(o => holds[o].push([i, 2]));
    });
    let clean = 0;
    for (let play = 0; play < PLAYS; play++) {
        const rng = mulberry32(hashSeed(seedBase, play));
        const cnt = board.tiles.map((_, i) => [above[i].length, left[i].length, right[i].length]);
        const removed = new Array(n).fill(false);
        let left_ = n, stuck = false;
        while (left_ > 0) {
            const byFace = new Map();
            for (let i = 0; i < n; i++) {
                if (removed[i] || cnt[i][0] || (cnt[i][1] && cnt[i][2])) continue;
                const f = board.tiles[i].tileId;
                (byFace.get(f) || byFace.set(f, []).get(f)).push(i);
            }
            const pairs = [];
            for (const list of byFace.values()) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) pairs.push([list[a], list[b]]);
            if (!pairs.length) { stuck = true; break; }
            for (const i of pairs[Math.floor(rng() * pairs.length)]) {
                removed[i] = true;
                left_--;
                for (const [j, side] of holds[i]) cnt[j][side]--;
            }
        }
        if (!stuck) clean++;
    }
    return clean / PLAYS;
}

if (isMainThread) {
    const { difficultyStep } = loadLevelCode();
    const jobs = [];
    for (let level = 1; level <= LEVELS; level++) for (let v = 0; v < VARIANTS; v++) jobs.push([level, v]);
    const rate = {};
    const threads = Math.max(1, os.cpus().length - 1);
    await Promise.all(Array.from({ length: threads }, (_, w) => new Promise((resolve, reject) => {
        const mine = jobs.filter((_, i) => i % threads === w);
        const worker = new Worker(fileURLToPath(import.meta.url), { workerData: mine });
        worker.on('message', ([level, v, r]) => (rate[`${level}.${v}`] = r));
        worker.on('error', reject);
        worker.on('exit', resolve);
    })));

    let seeds = '';
    const rows = [];
    for (let level = 1; level <= LEVELS; level++) {
        const want = wanted(level, difficultyStep(level));
        let best = 0;
        for (let v = 1; v < VARIANTS; v++) if (Math.abs(rate[`${level}.${v}`] - want) < Math.abs(rate[`${level}.${best}`] - want)) best = v;
        seeds += best.toString(36);
        rows.push([level, want, rate[`${level}.${best}`]]);
    }
    const file = path.join(js, 'level-seeds.js');
    const text = fs.readFileSync(file, 'utf8').replace(/const LEVEL_SEEDS = '[0-9a-z]*';/, `const LEVEL_SEEDS = '${seeds}';`);
    fs.writeFileSync(file, text);

    console.log('Clean-finish rate per level (wanted → picked):');
    for (let ten = 0; ten < LEVELS / 10; ten++) {
        const line = rows.slice(ten * 10, ten * 10 + 10).map(([, w, r]) => `${Math.round(w * 100)}→${Math.round(r * 100)}`.padStart(7)).join('');
        console.log(`${String(ten * 10 + 1).padStart(3)}-${String(ten * 10 + 10).padEnd(3)}${line}`);
    }
    const off = rows.filter(([, w, r]) => Math.abs(w - r) > 0.15).map(([l]) => l);
    console.log(`Wrote ${file}. Levels more than 15 points off: ${off.length ? off.join(', ') : 'none'}`);
} else {
    const { generateBoard, mulberry32, hashSeed } = loadLevelCode();
    for (const [level, v] of workerData) parentPort.postMessage([level, v, cleanFinishRate(generateBoard(level, v), mulberry32, hashSeed, level * 100 + v)]);
}

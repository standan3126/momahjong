// Runs the game's level code in Node (no browser) and checks that generated boards are
// solvable and always the same for the same level number. Usage: node build/check-levels.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const js = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'game', 'js');
const stub = () => new Proxy(function () {}, { get: () => stub(), apply: () => stub() });
const context = vm.createContext({ console, Math, Date, JSON, window: stub(), document: stub(), localStorage: stub(), navigator: stub() });
// The level code only: tile list, random, shapes, difficulty and the economy rules it uses.
const code = ['tiles', 'random', 'formations', 'levels', 'economy'].map(f => fs.readFileSync(path.join(js, `${f}.js`), 'utf8')).join('\n');
vm.runInContext(code + '\n;globalThis.__api = { generateBoard, isTileFree };', context);
const { generateBoard, isTileFree } = context.__api;

// Replays the solution order: every pair must be free at the moment it's taken.
function solvable(level) {
    const board = generateBoard(level);
    const active = new Map(board.tiles.map(t => [t.uid, t]));
    for (const [a, b] of board.order) {
        const act = [...active.values()];
        if (!isTileFree(active.get(a), act) || !isTileFree(active.get(b), act)) return false;
        active.delete(a);
        active.delete(b);
    }
    return active.size === 0;
}

const levels = [];
for (let l = 1; l <= 300; l++) levels.push(l);
for (let i = 0; i < 100; i++) levels.push(301 + Math.floor(Math.random() * 1e6));
const failures = levels.filter(l => !solvable(l));
const sig = l => JSON.stringify(generateBoard(l).tiles.map(t => [t.x, t.y, t.z, t.tileId]));
const unstable = [1, 10, 57, 150, 999].filter(l => sig(l) !== sig(l));
console.log(`Checked ${levels.length} levels: ${failures.length} unsolvable, ${unstable.length} not repeatable`);
if (failures.length || unstable.length) {
    console.error({ failures, unstable });
    process.exit(1);
}

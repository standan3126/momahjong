/* ============================================================================
   16. WHERE MOMAHJONG PLUGS INTO GAMEHUB (hub/shared/CONTRACT.md)
       Loaded last, as a module: the toolbox's Sound, the shared Settings panel (with
       Momahjong's own sections), the frame (Hub or Home top left, the gear top right),
       Tap to Start and offline saving. The game's plain scripts reach these through
       window.Hub and window.frame.
   ============================================================================ */
import { gameFrame, setupPage, tapToStart, warmOffline } from '/shared/v1/kit.js';
import { gameStore } from '/shared/v1/save.js';
import { choice, note, SettingsPanel, toggle } from '/shared/v1/settings.js';
import { Sound, ZEN_MUSIC } from '/shared/v1/sound/index.js';

const GAME_ID = 'momahjong';
const store = gameStore(GAME_ID);

// Momahjong's tile sounds play into this Sound (js/sound.js); its music is the toolbox's.
const sound = new Sound({ notes: 0.8, nature: 0.5, music: 0 });

const button = (label, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hub-small-button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
};

const panel = new SettingsPanel({
    gameId: GAME_ID,
    store,
    sound,
    notesLabel: 'Tile sounds',
    // Music was off by default before; its own Zen music is the style when it's turned up.
    defaults: { volumes: { notes: 0.8, nature: 0.5, music: 0 }, music: ZEN_MUSIC.id, highlightFree: true, autoNext: false, haptics: true, breakEvery: 4, breakKinds: ['memory', 'odd'] },
    sections: [
        {
            title: 'Play',
            build: (el, p) =>
                el.append(
                    toggle({ label: 'Highlight free tiles', hint: 'Dims the tiles that can’t be taken yet', checked: p.settings.highlightFree, onToggle: (highlightFree) => p.set({ highlightFree }) }),
                    toggle({ label: 'Next level by itself', hint: 'Starts the next level 3 seconds after you finish', checked: p.settings.autoNext, onToggle: (autoNext) => p.set({ autoNext }) }),
                    toggle({ label: 'Gentle vibration', hint: 'Android only (iPhone browsers can’t vibrate)', checked: p.settings.haptics, onToggle: (haptics) => p.set({ haptics }) }),
                    button('Restart this board', () => {
                        if (!state.tiles.length || state.levelDone) return p.say('Start a level first, then it can be restarted here.');
                        p.close();
                        restartLevel();
                    }),
                    button('Show the tips again', () => {
                        p.close();
                        state.explained = {};
                        showTips();
                    }),
                ),
        },
        {
            title: 'Little games',
            build: (el, p) =>
                el.append(
                    note('A short game between levels, for a few coins.'),
                    choice({
                        label: 'How often',
                        value: p.settings.breakEvery,
                        options: [
                            { value: 0, label: 'Never' },
                            { value: 6, label: 'Every 6' },
                            { value: 4, label: 'Every 4' },
                            { value: 2, label: 'Every 2' },
                        ],
                        onPick: (breakEvery) => p.set({ breakEvery }),
                    }),
                    ...[['memory', 'Memory Pairs'], ['odd', 'Odd Tile Out']].map(([kind, label]) =>
                        toggle({
                            label,
                            checked: p.settings.breakKinds.includes(kind),
                            onToggle: (on) => {
                                const kinds = p.settings.breakKinds.filter((k) => k !== kind);
                                p.set({ breakKinds: on ? [...kinds, kind] : kinds });
                            },
                        }),
                    ),
                ),
        },
    ],
    manual: {
        fields: [
            { id: 'level', label: 'Level', min: 1, get: () => mainLevel() },
            { id: 'coins', label: 'Coins', get: () => state.gold },
        ],
        onSet: ({ level, coins }) => {
            state.replayFrom = null;
            state.gold = coins;
            for (let l = 1; l < level; l++) state.stars[l] = true;
            state.tiles = [];
            state.level = level;
            state.levelDone = false;
            saveProgress();
            updateAllHUD();
            showLaunch();
            return `Set: level ${level}, ${coins} coins.`;
        },
    },
    beforeExport: () => saveProgress(),
    onRestore: () => {
        const board = loadSave();
        state.tiles = [];
        if (board) restoreBoard(board);
        updateAllHUD();
        showLaunch();
    },
    onChange: () => applyLight(),
    credits: [
        'Momahjong was made for GameHub: the boards, tiles and little games were all made for this game.',
        'Every sound and all the music are made in code. Fonts: Cinzel and Plus Jakarta Sans, from Google Fonts (SIL Open Font License).',
    ],
});

// Night: a warm "night shift" glass over the whole game (css: #nightGlass), and warm colours
// for GameHub's frame and panel.
function applyLight() {
    document.documentElement.dataset.theme = panel.night ? 'night' : 'day';
    document.querySelector('meta[name="theme-color"]').content = panel.night ? '#1a0e06' : '#063426';
}

window.Hub = { sound, panel, store };
// Home (while playing) goes back to the launch page; Hub leaves the game.
window.frame = gameFrame({ onSettings: () => panel.open(), beforeExit: () => saveProgress(), onHome: () => showLaunch() });
// The game's own settings object is the panel's (it keeps it up to date).
settings = panel.settings;

setupPage();
applyLight();
startGame();
tapToStart({ title: 'Momahjong', subtitle: 'Match the tiles and clear the board.', onStart: () => sound.unlock() });
setTimeout(() => warmOffline('offline-files.json'), 4000);

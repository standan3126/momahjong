/* ============================================================================
   5. SANCTUARY TRAINING — 10 HAND-BUILT LESSONS
      Step types: info (Got it), match (forced pair), tapBlocked (forced tap on a
      blocked tile), button (forced power-up / chest action), free (play freely;
      advances when the level is cleared).
   ============================================================================ */
const S = (x, y, z = 0) => ({ x, y, z });
const rowOf = (y, n, z = 0, x0 = 0) => Array.from({ length: n }, (_, i) => S(x0 + i * 2, y, z));

const TUTORIAL = {
    1: {
        title: 'Tap & Match',
        slots: [...rowOf(0, 3), ...rowOf(2, 3)],
        types: ['w1', 'a1', 't4', 't4', 'a1', 'w1'],
        steps: [
            { type: 'info', title: 'Welcome to the Sanctuary! 🐼', text: "Your goal: clear every tile by matching identical pairs. Let's learn by playing!" },
            { type: 'match', uids: [0, 5], title: 'Tap & Match', text: 'Tap the Panda 🐼, then tap its twin to match them!' },
            { type: 'match', uids: [3, 2], title: 'Nice one! ✨', text: 'Now match the two Lucky Coins.' },
            { type: 'free', text: 'Finish the last pair on your own! 💪' },
            { type: 'button', action: 'next', target: '#nextLevelBtn', title: 'Onward!', text: 'Tap NEXT LEVEL to continue.' }
        ]
    },
    2: {
        title: 'Free vs Blocked',
        slots: rowOf(0, 6),
        types: ['w3', 'a6', 't4', 't4', 'a6', 'w3'],
        steps: [
            { type: 'info', title: 'Free vs Blocked 🚧', text: 'You can only pick a tile when its LEFT or RIGHT side is open.' },
            { type: 'tapBlocked', uid: 2, title: 'Try this one', text: 'This tile has neighbours on both sides. Tap it and see what happens…' },
            { type: 'info', target: 'tile:2', title: 'Blocked! 🙅', text: "It wiggled — it's stuck. Blocked tiles look darker; free tiles are bright." },
            { type: 'match', uids: [0, 5], title: 'Work from the edges', text: 'The end tiles are free. Match the Golden Koi!' },
            { type: 'free', text: 'Keep peeling from the outside in!' }
        ]
    },
    3: {
        title: 'Stacks',
        slots: [...rowOf(0, 3), ...rowOf(2, 3), S(1, 1, 1), S(3, 1, 1)],
        types: ['w9', 'a2', 'a8', 'a8', 'a2', 'w9', 'w6', 'w6'],
        steps: [
            { type: 'info', target: 'tile:6', title: 'Stacked Tiles 🏯', text: 'Tiles can sit on top of others. Coloured edges and corner dots show how high a tile is.' },
            { type: 'tapBlocked', uid: 0, title: 'Underneath…', text: 'Tap this lower tile.' },
            { type: 'info', target: 'tile:0', title: 'Covered! ⛔', text: 'Any tile resting on top blocks it — even partly.' },
            { type: 'match', uids: [6, 7], title: 'Top first!', text: 'Clear the Jade Dragons on top.' },
            { type: 'free', text: 'The bottom layer is open now — finish it!' }
        ]
    },
    4: {
        title: 'Know Your Screen',
        slots: [...rowOf(0, 4), ...rowOf(2, 4)],
        types: ['t1', 't2', 't2', 't1', 'b5', 'b2', 'b2', 'b5'],
        steps: [
            { type: 'info', target: '#levelBox', title: 'Level & Board 🀄', text: 'Your level and the board name. 🀄 = tiles left. ✅ = free pairs you can match right now.' },
            { type: 'info', target: '#rankBox', title: 'Stars & Rank ⭐', text: 'Every level gives 1–3 stars: more for using fewer power-ups. Stars raise your Sanctuary Rank. Tap here for the guide.' },
            { type: 'info', target: '#goldBox', title: 'Gold 🪙', text: 'Gold buys power-ups once yours run out. Earn it by finishing levels, from treasure chests and little games.' },
            { type: 'info', target: '#dock', title: 'Item Dock 🧰', text: 'Your power-ups live here. The badge shows how many you own, or their price in gold when you have none.' },
            { type: 'info', target: '#settingsBtn', title: 'Settings ⚙️', text: 'Sound, music, vibration and your save slots.' },
            { type: 'free', text: 'Now clear the board!' }
        ]
    },
    5: {
        title: 'Hints',
        slots: [...rowOf(0, 4), ...rowOf(2, 4), ...rowOf(4, 4), S(1, 1, 1), S(5, 1, 1)],
        steps: [
            { type: 'info', title: 'Stuck? Get a Hint 💡', text: "Can't spot a match? The Hint bulb lights up a free pair for you." },
            { type: 'button', action: 'hint', target: '#btnHint', give: 'hint', title: 'Use a Hint', text: 'Tap the 💡 Hint button.' },
            { type: 'match', hinted: true, title: 'There it is!', text: 'Match the glowing pair.' },
            { type: 'free', text: 'Clear the rest. Power-ups cost gold once yours run out, so use them wisely!' }
        ]
    },
    6: {
        title: 'Undo',
        slots: [...rowOf(0, 4), ...rowOf(2, 2), ...rowOf(4, 4)],
        types: ['w1', 'a1', 'a1', 'w1', 't3', 't3', 'b1', 'b9', 'b9', 'b1'],
        steps: [
            { type: 'info', title: 'Oops-Proof 📜', text: 'Everyone makes mistakes. Undo brings your last matched pair back!' },
            { type: 'match', uids: [0, 3], title: 'Match these', text: 'Match the two Pandas…' },
            { type: 'button', action: 'undo', target: '#btnUndo', give: 'undo', title: 'Changed your mind?', text: 'Tap 📜 Undo to bring them back!' },
            { type: 'info', title: "They're back! 🔁", text: 'Use Undo whenever a match leaves you stuck.' },
            { type: 'free', text: 'Clear the board your way!' }
        ]
    },
    7: {
        title: 'Golden Glory',
        slots: [...rowOf(0, 4), ...rowOf(2, 4), ...rowOf(4, 4), S(1, 1, 1), S(5, 1, 1)],
        golden: 12,
        steps: [
            { type: 'info', target: 'tile:12', title: 'Golden Tiles 🌟', text: 'Golden pairs give you bonus gold 🪙 when you match them!' },
            { type: 'free', text: 'Find the golden twin and match it! 🌟' },
            { type: 'free' }
        ]
    },
    8: {
        title: 'Shuffle Wind',
        slots: [...rowOf(0, 2), ...rowOf(2, 4), ...rowOf(4, 4)],
        types: ['w7', 'w7', 'a4', 't8', 'a4', 't8', 'b4', 'b6', 'b4', 'b6'],
        steps: [
            { type: 'info', target: '#pairsBox', title: 'Watch the ✅ counter', text: 'It shows how many free pairs you can match right now.' },
            { type: 'match', uids: [0, 1], title: 'Match these', text: 'Match the Lotus pair.' },
            { type: 'info', target: '#pairsBox', title: 'Uh-oh! 😱', text: "✅ shows 0 — no free pairs left. You're stuck!" },
            { type: 'button', action: 'shuffle', target: '#btnShuffle', give: 'shuffle', title: 'Shuffle Wind 🌪️', text: 'Tap Shuffle to rearrange the tiles into a solvable layout!' },
            { type: 'free', text: 'Saved! Finish it off.' }
        ]
    },
    9: {
        title: 'Auto-Complete',
        slots: [...rowOf(0, 6), ...rowOf(2, 6), S(3, 1, 1), S(7, 1, 1)],
        types: ['a1', 'a5', 'a9', 'a9', 'a5', 'a1', 't1', 't5', 't9', 't9', 't5', 't1', 'w2', 'w2'],
        steps: [
            { type: 'info', title: 'Auto-Complete ✨', text: 'When no tile is stacked on another, the board can finish itself!' },
            { type: 'match', uids: [12, 13], title: 'Clear the top', text: 'Match the Red Pandas on top.' },
            { type: 'button', action: 'auto', target: '#autoCompleteBtn', title: 'Everything is flat!', text: 'Tap Auto-Complete and enjoy the show!' },
            { type: 'free' }
        ]
    },
    10: {
        title: 'Mystery Tiles',
        slots: [...rowOf(0, 3), ...rowOf(2, 3), S(1, 1, 1), S(3, 1, 1), ...rowOf(4, 4)],
        mystery: [1],
        steps: [
            { type: 'info', target: 'tile:1', title: 'Mystery Tiles 🔮', text: 'Purple tiles hide their face until they become free.' },
            { type: 'tapBlocked', uid: 1, title: 'Sneak a peek', text: 'Tap the mystery tile to peek underneath!' },
            { type: 'info', title: 'Peeked! 👀', text: "It reveals for good once it's free. Rumour says a certain relic can unmask them all…" },
            { type: 'free', text: 'Clear the board!' }
        ]
    }
};

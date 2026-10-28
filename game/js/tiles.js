/* ============================================================================
   2. CUSTOM ASIAN ARTWORK SVG GENERATOR (36 DISTINCT HIGH-CONTRAST TILES)
   ============================================================================ */
// A gold coin drawn in CSS (game.css .coin). The 🪙 emoji is silver on iPhones, so the game
// never uses it.
// GameHub's shared coin (kit.css .hub-coin): one look for every game's coins.
const COIN = '<span class="hub-coin" role="img" aria-label="coins"></span>';

const TILE_CATALOG = [
    // --- SUIT 1: BAMBOO STALKS (b1 - b9) ---
    { id: 'b1', suit: 'bamboo', badge: '1竹', color: '#15803d', name: '1 Bamboo' },
    { id: 'b2', suit: 'bamboo', badge: '2竹', color: '#15803d', name: '2 Bamboo' },
    { id: 'b3', suit: 'bamboo', badge: '3竹', color: '#15803d', name: '3 Bamboo' },
    { id: 'b4', suit: 'bamboo', badge: '4竹', color: '#15803d', name: '4 Bamboo' },
    { id: 'b5', suit: 'bamboo', badge: '5竹', color: '#15803d', name: '5 Bamboo' },
    { id: 'b6', suit: 'bamboo', badge: '6竹', color: '#15803d', name: '6 Bamboo' },
    { id: 'b7', suit: 'bamboo', badge: '7竹', color: '#15803d', name: '7 Bamboo' },
    { id: 'b8', suit: 'bamboo', badge: '8竹', color: '#15803d', name: '8 Bamboo' },
    { id: 'b9', suit: 'bamboo', badge: '9竹', color: '#15803d', name: '9 Bamboo' },

    // --- SUIT 2: PANDA & WILDLIFE (w1 - w9) ---
    { id: 'w1', suit: 'wildlife', badge: '熊', color: '#1e293b', name: 'Giant Panda' },
    { id: 'w2', suit: 'wildlife', badge: '狐', color: '#c2410c', name: 'Red Panda' },
    { id: 'w3', suit: 'wildlife', badge: '鯉', color: '#ea580c', name: 'Golden Koi' },
    { id: 'w4', suit: 'wildlife', badge: '鶴', color: '#0284c7', name: 'Sacred Crane' },
    { id: 'w5', suit: 'wildlife', badge: '虎', color: '#d97706', name: 'Bengal Tiger' },
    { id: 'w6', suit: 'wildlife', badge: '龍', color: '#059669', name: 'Jade Dragon' },
    { id: 'w7', suit: 'wildlife', badge: '蓮', color: '#db2777', name: 'Lotus Bloom' },
    { id: 'w8', suit: 'wildlife', badge: '盆', color: '#166534', name: 'Bonsai Pine' },
    { id: 'w9', suit: 'wildlife', badge: '櫻', color: '#e11d48', name: 'Sakura Blossom' },

    // --- SUIT 3: ASIAN ARCHITECTURE & LANDMARKS (a1 - a9) ---
    { id: 'a1', suit: 'arch', badge: '塔', color: '#b91c1c', name: 'Imperial Pagoda' },
    { id: 'a2', suit: 'arch', badge: '鳥', color: '#dc2626', name: 'Torii Gate' },
    { id: 'a3', suit: 'arch', badge: '城', color: '#57534e', name: 'Great Wall' },
    { id: 'a4', suit: 'arch', badge: '寺', color: '#b45309', name: 'Mountain Temple' },
    { id: 'a5', suit: 'arch', badge: '燈', color: '#475569', name: 'Stone Lantern' },
    { id: 'a6', suit: 'arch', badge: '橋', color: '#0369a1', name: 'Moon Bridge' },
    { id: 'a7', suit: 'arch', badge: '亭', color: '#991b1b', name: 'Jade Pavilion' },
    { id: 'a8', suit: 'arch', badge: '宮', color: '#ca8a04', name: 'Forbidden Palace' },
    { id: 'a9', suit: 'arch', badge: '道', color: '#334155', name: 'Yin-Yang Sanctuary' },

    // --- SUIT 4: CULTURAL TREASURES (t1 - t9) ---
    { id: 't1', suit: 'treasure', badge: '灯', color: '#dc2626', name: 'Festival Lantern' },
    { id: 't2', suit: 'treasure', badge: '扇', color: '#9333ea', name: 'Silk Fan' },
    { id: 't3', suit: 'treasure', badge: '茶', color: '#0f766e', name: 'Jade Teapot' },
    { id: 't4', suit: 'treasure', badge: '財', color: '#ca8a04', name: 'Lucky Coin' },
    { id: 't5', suit: 'treasure', badge: '玉', color: '#10b981', name: 'Jade Pendant' },
    { id: 't6', suit: 'treasure', badge: '鈴', color: '#0284c7', name: 'Wind Chime' },
    { id: 't7', suit: 'treasure', badge: '折', color: '#ec4899', name: 'Origami Crane' },
    { id: 't8', suit: 'treasure', badge: '卷', color: '#a16207', name: 'Wisdom Scroll' },
    { id: 't9', suit: 'treasure', badge: '包', color: '#d97706', name: 'Golden Bao' }
];

function renderBambooStalkSVG(x, y, h, color = '#15803d') {
    const w = 7;
    const r = 3;
    return `
        <g transform="translate(${x},${y})">
            <rect x="${-w/2}" y="0" width="${w}" height="${h/2 - 1}" rx="${r}" fill="${color}" />
            <rect x="${-w/2}" y="${h/2 + 1}" width="${w}" height="${h/2 - 1}" rx="${r}" fill="${color}" />
            <rect x="${-w/2 - 1.5}" y="${h/2 - 1.5}" width="${w + 3}" height="3" rx="1.5" fill="#86efac" stroke="${color}" stroke-width="0.8"/>
            <path d="M0,${h*0.3} Q7,${h*0.18} 9,${h*0.25} Q5,${h*0.34} 0,${h*0.3}" fill="#22c55e"/>
        </g>
    `;
}

function getTileSVG(tileId) {
    // Bamboo Suit 1-9
    if (tileId.startsWith('b')) {
        const count = parseInt(tileId.substring(1), 10);
        let stalks = '';
        const positions = {
            1: [[32, 18, 42, '#15803d']],
            2: [[32, 8, 28, '#15803d'], [32, 42, 28, '#047857']],
            3: [[32, 8, 26, '#15803d'], [20, 40, 28, '#047857'], [44, 40, 28, '#047857']],
            4: [[21, 10, 26, '#15803d'], [43, 10, 26, '#047857'], [21, 42, 26, '#047857'], [43, 42, 26, '#15803d']],
            5: [[19, 10, 25, '#15803d'], [45, 10, 25, '#15803d'], [32, 26, 25, '#dc2626'], [19, 43, 25, '#047857'], [45, 43, 25, '#047857']],
            6: [[18, 10, 26, '#15803d'], [32, 10, 26, '#15803d'], [46, 10, 26, '#15803d'], [18, 42, 26, '#047857'], [32, 42, 26, '#047857'], [46, 42, 26, '#047857']],
            7: [[32, 6, 20, '#dc2626'], [18, 28, 20, '#15803d'], [32, 28, 20, '#15803d'], [46, 28, 20, '#15803d'], [18, 50, 20, '#047857'], [32, 50, 20, '#047857'], [46, 50, 20, '#047857']],
            8: [[16, 10, 25, '#15803d'], [27, 10, 25, '#047857'], [37, 10, 25, '#047857'], [48, 10, 25, '#15803d'], [16, 42, 25, '#15803d'], [27, 42, 25, '#047857'], [37, 42, 25, '#047857'], [48, 42, 25, '#15803d']],
            9: [[17, 7, 19, '#15803d'], [32, 7, 19, '#dc2626'], [47, 7, 19, '#15803d'], [17, 29, 19, '#15803d'], [32, 29, 19, '#dc2626'], [47, 29, 19, '#15803d'], [17, 51, 19, '#047857'], [32, 51, 19, '#dc2626'], [47, 51, 19, '#047857']]
        };
        (positions[count] || []).forEach(([x, y, h, col]) => {
            stalks += renderBambooStalkSVG(x, y, h, col);
        });
        return `<svg viewBox="0 0 64 78" class="w-full h-full">${stalks}</svg>`;
    }

    // Custom vector art for Wildlife, Architecture, and Cultural Treasures
    const artMap = {
        // Giant Panda
        w1: `
            <circle cx="17" cy="24" r="8" fill="#1e293b"/>
            <circle cx="47" cy="24" r="8" fill="#1e293b"/>
            <circle cx="32" cy="41" r="20" fill="#ffffff" stroke="#1e293b" stroke-width="2.5"/>
            <ellipse cx="24" cy="38" rx="6" ry="7.5" transform="rotate(-15 24 38)" fill="#1e293b"/>
            <ellipse cx="40" cy="38" rx="6" ry="7.5" transform="rotate(15 40 38)" fill="#1e293b"/>
            <circle cx="25" cy="37" r="2.2" fill="#ffffff"/>
            <circle cx="39" cy="37" r="2.2" fill="#ffffff"/>
            <ellipse cx="32" cy="46" rx="4" ry="2.8" fill="#1e293b"/>
            <path d="M27,51 Q32,55 37,51" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M48,54 L56,42" stroke="#16a34a" stroke-width="3.5" stroke-linecap="round"/>
        `,
        // Red Panda
        w2: `
            <polygon points="12,18 26,24 15,35" fill="#9a3412"/>
            <polygon points="52,18 38,24 49,35" fill="#9a3412"/>
            <circle cx="32" cy="42" r="19" fill="#ea580c" stroke="#7c2d12" stroke-width="2"/>
            <path d="M16,42 Q24,33 32,42 Q40,33 48,42 Q44,56 32,56 Q20,56 16,42 Z" fill="#fff7ed"/>
            <circle cx="25" cy="39" r="3" fill="#1c1917"/>
            <circle cx="39" cy="39" r="3" fill="#1c1917"/>
            <ellipse cx="32" cy="46" rx="3.5" ry="2.5" fill="#1c1917"/>
        `,
        // Golden Koi
        w3: `
            <path d="M18,54 C12,38 22,20 38,20 C48,20 50,32 42,44 C35,54 24,56 18,54 Z" fill="#f97316" stroke="#c2410c" stroke-width="2"/>
            <circle cx="35" cy="29" r="5" fill="#fef3c7"/>
            <circle cx="29" cy="39" r="4" fill="#dc2626"/>
            <path d="M18,54 L8,64 L14,48 L6,45 L18,54 Z" fill="#fb923c"/>
            <circle cx="41" cy="25" r="2" fill="#1e293b"/>
            <path d="M14,26 Q22,16 32,20" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        `,
        // Sacred Crane
        w4: `
            <circle cx="32" cy="40" r="18" fill="#e0f2fe"/>
            <path d="M22,52 Q18,36 32,34 Q46,36 42,52 Z" fill="#ffffff" stroke="#0284c7" stroke-width="2"/>
            <path d="M32,35 Q36,20 30,16 Q25,16 26,22" fill="none" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="29" cy="16" r="3" fill="#dc2626"/>
            <polygon points="25,17 15,20 25,21" fill="#f59e0b"/>
        `,
        // Bengal Tiger
        w5: `
            <circle cx="17" cy="24" r="7" fill="#d97706"/>
            <circle cx="47" cy="24" r="7" fill="#d97706"/>
            <circle cx="32" cy="41" r="19" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
            <path d="M22,26 L28,29 M42,26 L36,29 M15,38 L21,38 M49,38 L43,38 M32,22 L32,30" stroke="#1c1917" stroke-width="2.8" stroke-linecap="round"/>
            <ellipse cx="32" cy="49" rx="11" ry="8" fill="#fef3c7"/>
            <polygon points="28,45 36,45 32,50" fill="#f43f5e"/>
            <circle cx="25" cy="37" r="2.8" fill="#1c1917"/>
            <circle cx="39" cy="37" r="2.8" fill="#1c1917"/>
        `,
        // Jade Dragon
        w6: `
            <path d="M16,54 C12,38 22,22 36,24 C48,26 50,42 38,48 C28,53 26,40 34,38" fill="none" stroke="#059669" stroke-width="7" stroke-linecap="round"/>
            <path d="M16,54 C12,38 22,22 36,24 C48,26 50,42 38,48" fill="none" stroke="#34d399" stroke-width="3" stroke-dasharray="3 3"/>
            <circle cx="36" cy="24" r="7" fill="#059669"/>
            <circle cx="38" cy="22" r="2" fill="#fef08a"/>
            <path d="M32,18 L26,11 M38,18 L44,11" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
        `,
        // Lotus Bloom
        w7: `
            <ellipse cx="32" cy="54" rx="22" ry="6" fill="#10b981"/>
            <path d="M32,20 C22,30 20,46 32,52 C44,46 42,30 32,20 Z" fill="#f472b6" stroke="#be185d" stroke-width="1.8"/>
            <path d="M32,52 C16,48 12,34 20,26 C25,34 26,44 32,52 Z" fill="#ec4899" stroke="#be185d" stroke-width="1.8"/>
            <path d="M32,52 C48,48 52,34 44,26 C39,34 38,44 32,52 Z" fill="#ec4899" stroke="#be185d" stroke-width="1.8"/>
            <circle cx="32" cy="42" r="4" fill="#fde047"/>
        `,
        // Bonsai Pine
        w8: `
            <polygon points="16,50 48,50 43,60 21,60" fill="#9a3412" stroke="#431407" stroke-width="1.8"/>
            <path d="M30,50 Q26,38 35,30" fill="none" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
            <ellipse cx="24" cy="34" rx="11" ry="7" fill="#15803d"/>
            <ellipse cx="40" cy="26" rx="12" ry="8" fill="#16a34a"/>
            <ellipse cx="32" cy="20" rx="10" ry="6" fill="#22c55e"/>
        `,
        // Sakura Blossom
        w9: `
            <g transform="translate(32,40)">
                <circle cx="0" cy="-12" r="9" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/>
                <circle cx="11" cy="-4" r="9" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/>
                <circle cx="7" cy="10" r="9" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/>
                <circle cx="-7" cy="10" r="9" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/>
                <circle cx="-11" cy="-4" r="9" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/>
                <circle cx="0" cy="0" r="5" fill="#fef08a"/>
            </g>
        `,
        // Imperial Pagoda
        a1: `
            <line x1="32" y1="12" x2="32" y2="20" stroke="#ca8a04" stroke-width="3" stroke-linecap="round"/>
            <polygon points="16,28 32,18 48,28" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
            <rect x="23" y="28" width="18" height="8" fill="#fef3c7" stroke="#7f1d1d" stroke-width="1.5"/>
            <polygon points="12,42 32,32 52,42" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
            <rect x="20" y="42" width="24" height="10" fill="#fef3c7" stroke="#7f1d1d" stroke-width="1.5"/>
            <polygon points="10,56 32,47 54,56" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.5"/>
        `,
        // Torii Gate
        a2: `
            <path d="M10,23 Q32,17 54,23 L51,28 Q32,23 13,28 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="1.5"/>
            <rect x="14" y="32" width="36" height="4.5" rx="1" fill="#ef4444"/>
            <rect x="19" y="26" width="5" height="34" fill="#dc2626"/>
            <rect x="40" y="26" width="5" height="34" fill="#dc2626"/>
            <rect x="16" y="56" width="11" height="5" fill="#1e293b"/>
            <rect x="37" y="56" width="11" height="5" fill="#1e293b"/>
        `,
        // Great Wall
        a3: `
            <rect x="12" y="34" width="40" height="24" rx="2" fill="#78716c" stroke="#44403c" stroke-width="2"/>
            <rect x="12" y="26" width="8" height="8" fill="#78716c" stroke="#44403c" stroke-width="1.5"/>
            <rect x="28" y="26" width="8" height="8" fill="#78716c" stroke="#44403c" stroke-width="1.5"/>
            <rect x="44" y="26" width="8" height="8" fill="#78716c" stroke="#44403c" stroke-width="1.5"/>
            <path d="M25,58 L25,45 A7,7 0 0,1 39,45 L39,58 Z" fill="#292524"/>
        `,
        // Mountain Temple
        a4: `
            <path d="M8,36 Q32,16 56,36 Z" fill="#d97706" stroke="#78350f" stroke-width="2"/>
            <rect x="16" y="36" width="32" height="20" fill="#fef3c7" stroke="#78350f" stroke-width="2"/>
            <rect x="27" y="42" width="10" height="14" rx="2" fill="#991b1b"/>
            <circle cx="32" cy="29" r="3.5" fill="#fef08a"/>
        `,
        // Stone Lantern
        a5: `
            <polygon points="14,30 32,18 50,30" fill="#64748b" stroke="#334155" stroke-width="2"/>
            <rect x="22" y="30" width="20" height="14" fill="#fef08a" stroke="#334155" stroke-width="2"/>
            <circle cx="32" cy="37" r="4" fill="#f97316"/>
            <rect x="18" y="44" width="28" height="5" fill="#94a3b8" stroke="#334155" stroke-width="1.5"/>
            <rect x="26" y="49" width="12" height="10" fill="#64748b" stroke="#334155" stroke-width="1.5"/>
        `,
        // Moon Bridge
        a6: `
            <path d="M10,50 A22,22 0 0,1 54,50 L44,50 A12,12 0 0,0 20,50 Z" fill="#0284c7" stroke="#075985" stroke-width="2"/>
            <path d="M10,54 Q22,50 32,54 Q42,58 54,54" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
            <circle cx="32" cy="24" r="5" fill="#fde047"/>
        `,
        // Jade Pavilion
        a7: `
            <polygon points="10,32 32,16 54,32" fill="#059669" stroke="#064e3b" stroke-width="2"/>
            <line x1="18" y1="32" x2="18" y2="54" stroke="#b91c1c" stroke-width="4"/>
            <line x1="46" y1="32" x2="46" y2="54" stroke="#b91c1c" stroke-width="4"/>
            <rect x="12" y="54" width="40" height="5" rx="2" fill="#d97706"/>
        `,
        // Forbidden Palace
        a8: `
            <polygon points="10,30 22,20 42,20 54,30" fill="#eab308" stroke="#854d0e" stroke-width="2"/>
            <rect x="14" y="30" width="36" height="24" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/>
            <path d="M26,54 L26,42 A6,6 0 0,1 38,42 L38,54 Z" fill="#fef08a"/>
        `,
        // Yin-Yang Sanctuary
        a9: `
            <circle cx="32" cy="40" r="19" fill="#1e293b" stroke="#cbd5e1" stroke-width="2"/>
            <path d="M32,21 A19,19 0 0,1 32,59 A9.5,9.5 0 0,1 32,40 A9.5,9.5 0 0,0 32,21 Z" fill="#f8fafc"/>
            <circle cx="32" cy="30.5" r="3.2" fill="#1e293b"/>
            <circle cx="32" cy="49.5" r="3.2" fill="#f8fafc"/>
        `,
        // Festival Lantern
        t1: `
            <rect x="24" y="17" width="16" height="4" fill="#ca8a04"/>
            <ellipse cx="32" cy="37" rx="18" ry="16" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
            <ellipse cx="32" cy="37" rx="9" ry="16" fill="none" stroke="#fca5a5" stroke-width="1.5"/>
            <rect x="24" y="51" width="16" height="4" fill="#ca8a04"/>
            <line x1="32" y1="55" x2="32" y2="63" stroke="#eab308" stroke-width="3"/>
        `,
        // Silk Fan
        t2: `
            <path d="M12,34 A24,24 0 0,1 52,34 L32,56 Z" fill="#a855f7" stroke="#581c87" stroke-width="2"/>
            <line x1="32" y1="56" x2="20" y2="26" stroke="#fde047" stroke-width="1.5"/>
            <line x1="32" y1="56" x2="32" y2="22" stroke="#fde047" stroke-width="1.5"/>
            <line x1="32" y1="56" x2="44" y2="26" stroke="#fde047" stroke-width="1.5"/>
        `,
        // Jade Teapot
        t3: `
            <ellipse cx="32" cy="43" rx="15" ry="12" fill="#14b8a6" stroke="#115e59" stroke-width="2"/>
            <path d="M17,39 Q8,39 14,49" fill="none" stroke="#115e59" stroke-width="3"/>
            <path d="M47,42 Q54,34 56,36" fill="none" stroke="#115e59" stroke-width="3.5" stroke-linecap="round"/>
            <circle cx="32" cy="29" r="3.5" fill="#fbbf24"/>
        `,
        // Lucky Coin
        t4: `
            <circle cx="32" cy="40" r="19" fill="#facc15" stroke="#a16207" stroke-width="2.5"/>
            <circle cx="32" cy="40" r="15" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="3 2"/>
            <rect x="25" y="33" width="14" height="14" rx="2" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>
        `,
        // Jade Pendant
        t5: `
            <path d="M32,15 L32,24" stroke="#ef4444" stroke-width="2.5"/>
            <circle cx="32" cy="41" r="17" fill="#34d399" stroke="#047857" stroke-width="2.5"/>
            <circle cx="32" cy="41" r="6" fill="#ffffff" stroke="#047857" stroke-width="2"/>
        `,
        // Wind Chime
        t6: `
            <path d="M18,32 A14,14 0 0,1 46,32 Z" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/>
            <line x1="24" y1="32" x2="24" y2="50" stroke="#94a3b8" stroke-width="2.5"/>
            <line x1="40" y1="32" x2="40" y2="50" stroke="#94a3b8" stroke-width="2.5"/>
            <rect x="28" y="42" width="8" height="18" rx="3" fill="#f43f5e"/>
        `,
        // Origami Crane
        t7: `
            <polygon points="32,20 12,38 30,44" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>
            <polygon points="32,20 52,38 34,44" fill="#ec4899" stroke="#9d174d" stroke-width="1.5"/>
            <polygon points="22,42 32,56 42,42" fill="#db2777" stroke="#9d174d" stroke-width="1.5"/>
        `,
        // Wisdom Scroll
        t8: `
            <rect x="14" y="21" width="36" height="5" rx="2" fill="#92400e"/>
            <rect x="18" y="26" width="28" height="28" fill="#fef3c7" stroke="#b45309" stroke-width="1.8"/>
            <rect x="14" y="54" width="36" height="5" rx="2" fill="#92400e"/>
            <path d="M26,34 L38,34 M26,40 L38,40 M26,46 L34,46" stroke="#b45309" stroke-width="2.2" stroke-linecap="round"/>
        `,
        // Golden Bao
        t9: `
            <path d="M14,48 C14,30 26,24 32,22 C38,24 50,30 50,48 Z" fill="#fffbeb" stroke="#d97706" stroke-width="2.2"/>
            <path d="M32,22 L26,32 M32,22 L32,33 M32,22 L38,32" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="32" cy="48" rx="18" ry="4" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
        `
    };

    return `<svg viewBox="0 0 64 76" class="w-full h-full">${artMap[tileId] || ''}</svg>`;
}

const CATALOG_BY_ID = Object.fromEntries(TILE_CATALOG.map(c => [c.id, c]));
const $ = id => document.getElementById(id);

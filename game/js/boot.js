/* ============================================================================
   15. BOOT
       js/hub.js (loaded last, as a module) plugs into GameHub's toolbox, then calls
       startGame(): the launch page first, then a half-played board if one is saved.
   ============================================================================ */
function onViewportChange() {
    FX.resize();
    fitBoard(false);
}

function startGame() {
    FX.init();
    buildTitleTiles();
    const board = loadSave();
    if (board) restoreBoard(board);
    updateAllHUD();
    showLaunch();

    window.addEventListener('resize', onViewportChange);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 250));
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });

    if (/[?&]debug=1/.test(location.search)) {
        const levels = [];
        for (let l = 1; l <= 300; l++) levels.push(l);
        for (let i = 0; i < 200; i++) levels.push(301 + Math.floor(Math.random() * 1000000));
        const failures = verifyLevels(levels);
        console.log(`[debug] verified ${levels.length} levels, failures:`, failures);
        spawnFloatingBanner(`Debug: ${levels.length} levels checked, ${failures.length} failures`, failures.length ? '#f87171' : '#34d399');
    }
}

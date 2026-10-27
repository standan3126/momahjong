/* ============================================================================
   15. BOOT
   ============================================================================ */
function onViewportChange() {
    FX.resize();
    fitBoard(false);
    Tutorial.render();
}

window.addEventListener('load', function () {
    loadSettings();
    migrateLegacy();
    FX.init();
    buildWheel();
    buildPrizeLegend();
    buildTitleTiles();
    syncSettingsUI();
    showTitle();

    window.addEventListener('resize', onViewportChange);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 250));
    // Audio can only start after a user gesture (iOS)
    document.addEventListener('pointerdown', () => {
        SoundFX.init();
        if (settings.music) SoundFX.startMusic();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });

    if (/[?&]debug=1/.test(location.search)) {
        const levels = [];
        for (let l = 1; l <= 300; l++) levels.push(l);
        for (let i = 0; i < 200; i++) levels.push(301 + Math.floor(Math.random() * 1000000));
        const failures = verifyLevels(levels);
        console.log(`[debug] verified ${levels.length} levels, failures:`, failures);
        spawnFloatingBanner(`Debug: ${levels.length} levels checked, ${failures.length} failures`, failures.length ? '#f87171' : '#34d399');
    }
});

// Plays Momahjong in phone-sized browsers: npm test (builds, then starts its own server on 4210).
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const FAMILY_CODE = process.env.HUB_CODE ?? readFileSync(new URL('../../hub/private/family-code.txt', import.meta.url), 'utf8').trim()

// Writes a save from a page where the game isn't running (it saves itself when it closes).
async function seed(page, save, settings) {
  await page.goto('offline-files.json')
  await page.evaluate(({ save, settings }) => {
    localStorage.clear()
    if (save) localStorage.setItem('momahjong:save', JSON.stringify({ v: 1, tipsSeen: true, stars: {}, ...save }))
    if (settings) localStorage.setItem('momahjong:my-settings', JSON.stringify(settings))
  }, { save, settings })
}

async function open(page) {
  await page.goto('./')
  await page.locator('.hub-start').click()
  await expect(page.locator('#launch')).toBeVisible()
}

const play = (page) => page.locator('.hub-play').click()
const coins = (page) => page.evaluate(() => state.gold)
const homeButton = (page) => page.locator('.hub-corner', { hasText: 'Home' })

// Clears the board in its solution order, as a player would.
const clearBoard = (page) =>
  page.evaluate(() => {
    for (const [a, b] of state.order) executeMatchPair(state.tiles[a], state.tiles[b])
  })

test.beforeEach(async ({ page }) => {
  await page.goto('offline-files.json')
  await page.evaluate(() => localStorage.clear())
})

test("GameHub's frame: launch page with Play, Home while playing, the gear never moves; tips on the first board", async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await open(page)
  await expect(page.getByRole('button', { name: 'Exit to GameHub' })).toBeVisible()
  await expect(page.locator('#launchWhere')).toHaveText('Match the tiles and clear the board')
  await expect(page.locator('#launchLevels')).toBeHidden()
  const gear = await page.locator('.hub-gear').boundingBox()

  await play(page)
  // Three short tips, skippable, only the first time.
  await expect(page.locator('#msgTitle')).toHaveText('Match two free tiles')
  await page.getByRole('button', { name: 'Skip the tips' }).click()
  await expect(page.locator('#msgModal')).toBeHidden()
  await expect(homeButton(page)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exit to GameHub' })).toBeHidden()
  expect(await page.locator('.hub-gear').boundingBox()).toEqual(gear)
  await expect(page.locator('#levelName')).toHaveText('Level 1')
  await expect(page.locator('#coinsCount')).toHaveText('30') // everyone starts with 30 coins
  const tiles = await page.evaluate(() => state.tiles.length)
  await expect(page.locator('#tilesLeftCount')).toHaveText(String(tiles))

  // The level info stays clear of Home and the gear.
  const info = await page.locator('#levelInfo').boundingBox()
  const home = await homeButton(page).boundingBox()
  expect(info.x).toBeGreaterThanOrEqual(home.x + home.width)
  expect(info.x + info.width).toBeLessThanOrEqual(gear.x)

  await homeButton(page).click()
  await expect(page.locator('#launch')).toBeVisible()
  await open(page)
  await play(page)
  await expect(page.locator('#msgModal')).toBeHidden() // tips seen
  await expect(page.locator('#tilesLeftCount')).toHaveText(String(tiles)) // the board resumed
  expect(errors).toEqual([])
})

test('coins: golden tiles pay 3 or 7 once each, a level pays 5, a boss 10; replays pay the same', async ({ page }) => {
  await seed(page, { level: 1, gold: 30 })
  await open(page)
  await play(page)
  const paid = await page.evaluate(() => {
    state.paidGolden = []
    const g = (uid) => ({ uid, isGolden: true })
    const r = (uid) => ({ uid, isGolden: false })
    return [goldenCoins(g(900), g(901)), goldenCoins(g(902), r(903)), goldenCoins(g(900), g(901)), goldenCoins(r(904), r(905))]
  })
  expect(paid).toEqual([7, 3, 0, 0])

  await page.evaluate(() => (state.paidGolden = []))
  await clearBoard(page)
  await expect(page.locator('#completeModal')).toBeVisible()
  await expect(page.locator('#levelGold')).toContainText('+5')
  const golden = await page.evaluate(() => state.earned)
  expect(await coins(page)).toBe(30 + 5 + golden)
  await page.getByRole('button', { name: 'Next level' }).click()
  await expect(page.locator('#levelName')).toHaveText('Level 2')

  // A boss pays double.
  await page.evaluate(() => startLevel(10))
  await expect(page.locator('#modifierBadge')).toHaveText('👹 Boss level')
  const before = await coins(page)
  await clearBoard(page)
  await expect(page.locator('#levelGold')).toContainText('+10')
  expect(await coins(page)).toBe(before + 10 + (await page.evaluate(() => state.earned)))
})

test('helpers cost coins (Hint 10, Undo 15, Shuffle 30); without enough nothing is spent', async ({ page }) => {
  await seed(page, { level: 3, gold: 60 })
  await open(page)
  await play(page)
  await page.locator('#btnHint').click()
  await expect(page.locator('.mahjong-tile.hinted')).toHaveCount(2)
  expect(await coins(page)).toBe(50)
  await page.evaluate(() => {
    const act = state.tiles.filter((t) => !t.removed)
    const [a, b] = findAvailablePairs(act.filter((t) => isTileFree(t, act)))[0]
    executeMatchPair(a, b)
  })
  await page.locator('#btnUndo').click()
  expect(await coins(page)).toBe(35)
  await page.locator('#btnShuffle').click()
  expect(await coins(page)).toBe(5)
  await expect(page.locator('#btnShuffle')).toHaveClass(/cant-afford/)
  await page.locator('#btnShuffle').click()
  await expect(page.locator('.floating-banner').last()).toContainText('A Shuffle costs 30')
  expect(await coins(page)).toBe(5)
})

test('no matches left: a calm card with Shuffle, Restart and Levels; restarting pays golden tiles only once', async ({ page }) => {
  await seed(page, { level: 4, gold: 12 })
  await open(page)
  await play(page)
  await page.evaluate(() => openStuck())
  await expect(page.locator('#noMovesModal')).toBeVisible()
  await expect(page.locator('#stuckShuffle')).toBeDisabled()
  await expect(page.locator('#stuckNote')).toContainText('You have 12')

  // A golden tile already paid for doesn't pay again after a restart.
  const uid = await page.evaluate(() => state.tiles.find((t) => t.isGolden).uid)
  await page.evaluate((uid) => state.paidGolden.push(uid), uid)
  await page.getByRole('button', { name: 'Restart this board' }).click()
  await expect(page.locator('#noMovesModal')).toBeHidden()
  expect(await page.evaluate((uid) => state.paidGolden.includes(uid), uid)).toBe(true)
  expect(await page.evaluate(() => state.tiles.every((t) => !t.removed))).toBe(true)

  await page.evaluate(() => openStuck())
  await page.locator('#noMovesModal').getByRole('button', { name: 'Levels' }).click()
  await expect(page.locator('#mapScreen')).toBeVisible()
})

test('Levels: one star per finished level; tapping one replays it and comes back', async ({ page }) => {
  await seed(page, { level: 6, gold: 30, stars: { 1: true, 2: true, 3: true, 4: true, 5: true } })
  await open(page)
  await expect(page.locator('#launchWhere')).toHaveText('Level 6')
  await page.locator('#launchLevels').click()
  await expect(page.locator('#mapScreen')).toBeVisible()
  await expect(homeButton(page)).toBeVisible()
  await expect(page.locator('.map-node[data-level="3"]')).toHaveAttribute('aria-label', 'Level 3, finished')
  await page.locator('.map-node[data-level="3"]').click()
  await page.getByRole('button', { name: 'Replay Level 3' }).click()
  await expect(page.locator('#levelName')).toHaveText('Level 3 · replay')
  const before = await coins(page)
  await clearBoard(page)
  await expect(page.locator('#levelGold')).toContainText('+5')
  expect(await coins(page)).toBe(before + 5 + (await page.evaluate(() => state.earned)))
  await page.getByRole('button', { name: 'Back to my level' }).click()
  await expect(page.locator('#levelName')).toHaveText('Level 6')
})

test('a special level explains itself when its badge is tapped, and stays until dismissed', async ({ page }) => {
  await seed(page, { level: 1, gold: 30 })
  await open(page)
  await play(page)
  const misty = await page.evaluate(() => {
    for (let l = 5; l < 200; l++) if (getLevelConfig(l).modifier?.id === 'misty') return l
  })
  await page.evaluate((l) => startLevel(l), misty)
  await page.locator('#modifierBadge').click()
  await expect(page.locator('#msgTitle')).toHaveText('🌫️ Misty Peaks')
  await expect(page.locator('#msgText')).toContainText('mystery tiles')
  await page.waitForTimeout(2500)
  await expect(page.locator('#msgModal')).toBeVisible() // it doesn't flash away
  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(page.locator('#msgModal')).toBeHidden()
})

test('golden and mystery tiles explain themselves on the first tap, and again when pressed and held', async ({ page }) => {
  await seed(page, { level: 1, gold: 30 })
  await open(page)
  await play(page)
  const uid = await page.evaluate(() => state.tiles.find((t) => t.isGolden).uid)
  const golden = page.locator(`#tile-${uid}`)
  await golden.dispatchEvent('click')
  await expect(page.locator('#msgTitle')).toHaveText('🌟 Golden tile')
  await page.getByRole('button', { name: 'Got it' }).click()
  await golden.dispatchEvent('click')
  await golden.dispatchEvent('click')
  await page.waitForTimeout(400)
  await expect(page.locator('#msgModal')).toBeHidden() // only the first time

  // Press and hold explains again; the tap that ends the hold doesn't play.
  const selected = await page.evaluate(() => state.selectedUid)
  await golden.dispatchEvent('pointerdown')
  await page.waitForTimeout(700)
  await golden.dispatchEvent('pointerup')
  await golden.dispatchEvent('click')
  await expect(page.locator('#msgTitle')).toHaveText('🌟 Golden tile')
  expect(await page.evaluate(() => state.selectedUid)).toBe(selected)
  await page.getByRole('button', { name: 'Got it' }).click()

  // A covered mystery tile, on a Misty Peaks level.
  const misty = await page.evaluate(() => {
    for (let l = 5; l < 200; l++) if (getLevelConfig(l).modifier?.id === 'misty') return l
  })
  await page.evaluate((l) => startLevel(l), misty)
  const covered = await page.evaluate(() => state.tiles.find((t) => t.isMystery && !t.mysteryRevealed && !t.isGolden).uid)
  await page.locator(`#tile-${covered}`).dispatchEvent('click')
  await expect(page.locator('#msgTitle')).toHaveText('❓ Mystery tile')
  await page.getByRole('button', { name: 'Got it' }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('momahjong:save')).explained)).toEqual({ golden: true, mystery: true })
})

test('little games: rules the first time, Memory Pairs pays by turns, Odd Tile Out by first taps', async ({ page }) => {
  await seed(page, { level: 3, gold: 30 })
  await open(page)
  await play(page)
  expect(await page.evaluate(() => [8, 12, 13, 20, 30].map(memoryCoins))).toEqual([20, 20, 19, 12, 5])
  expect(await page.evaluate(() => [0, 3, 5].map(oddCoins))).toEqual([0, 12, 20])

  // Memory Pairs, the first time: its rules, then 16 tiles; a perfect game pays 20.
  await page.evaluate(() => { state.levelsCleared = 0; playBreak(() => {}) })
  await expect(page.locator('#breakArea')).toContainText('within 12 turns')
  await page.locator('#breakStart').click()
  const cards = page.locator('.memory-card')
  await expect(cards).toHaveCount(16)
  const faces = await cards.evaluateAll((els) => els.map((el) => el.querySelector('.memory-front').innerHTML))
  const before = await coins(page)
  for (const face of [...new Set(faces)]) {
    const [a, b] = faces.flatMap((f, i) => (f === face ? [i] : []))
    await cards.nth(a).click()
    await cards.nth(b).click()
  }
  await expect(page.locator('#breakStatus')).toContainText('All pairs in 8 turns!')
  expect(await coins(page)).toBe(before + 20)
  await page.locator('#breakFinish').click()
  await expect(page.locator('#breakModal')).toBeHidden()

  // The second time there are no rules first.
  await page.evaluate(() => { state.levelsCleared = 0; playBreak(() => {}) })
  await expect(cards).toHaveCount(16)
  await page.locator('#breakSkip').click()

  // Odd Tile Out: 5 rounds getting bigger; one miss costs that round's 4 coins.
  await page.evaluate(() => { state.levelsCleared = 1; playBreak(() => {}) })
  await page.locator('#breakStart').click()
  const start = await coins(page)
  for (const [i, size] of [9, 16, 16, 25, 25].entries()) {
    await expect(page.locator('#breakStatus')).toContainText(`Round ${i + 1} of 5`)
    await expect(page.locator('.odd-cell')).toHaveCount(size)
    if (size === 9) await page.locator('.odd-cell[data-odd="false"]').first().click()
    await page.locator('.odd-cell[data-odd="true"]').click()
  }
  await expect(page.locator('#breakStatus')).toContainText('4 of 5 on the first tap.')
  expect(await coins(page)).toBe(start + 16)
  await page.locator('#breakFinish').click()

  // Home during a little game leaves it; Play goes on to the next level.
  await page.evaluate(() => { state.levelDone = true; playBreak(() => playLevel(state.level + 1)) })
  await homeButton(page).click()
  await expect(page.locator('#breakModal')).toBeHidden()
  await expect(page.locator('#launchWhere')).toHaveText('Level 4')
  await play(page)
  await expect(page.locator('#levelName')).toHaveText('Level 4')
})

test("the shared Settings: Momahjong's sections, Jade Sanctuary music, Restart, Night glass, hidden tools", async ({ page }) => {
  await seed(page, { level: 7, gold: 40 })
  await open(page)
  await play(page)
  await page.locator('.hub-gear').click()
  const panel = page.locator('dialog.hub-settings')
  await expect(panel.locator('h3:visible')).toHaveText(['Light', 'Sound', 'Play', 'Little games'])
  await expect(panel.getByLabel('Music style')).toHaveValue('jade-sanctuary')
  await expect(panel.getByRole('checkbox', { name: /Suit Sorting/ })).toHaveCount(0)
  await panel.getByRole('button', { name: 'Restart this board' }).click()
  await expect(panel).toBeHidden()

  await page.locator('.hub-gear').click()
  await panel.getByRole('radio', { name: 'Night' }).click()
  await expect(page.locator('#nightGlass')).toBeVisible()
  await panel.getByRole('radio', { name: 'Day' }).click()
  await expect(page.locator('#nightGlass')).toBeHidden()

  for (let i = 0; i < 5; i++) await panel.locator('h2').click()
  await panel.locator('.hub-secret input').fill(FAMILY_CODE)
  await panel.locator('.hub-secret button').click()
  const manual = panel.locator('section', { hasText: 'Set progress by hand' })
  await manual.getByLabel('Level', { exact: true }).fill('25')
  await manual.getByLabel('Coins', { exact: true }).fill('200')
  await manual.getByRole('button', { name: 'Set' }).click()
  await panel.locator('.hub-settings-close').click()
  await expect(page.locator('#launchWhere')).toHaveText('Level 25')
  await play(page)
  await expect(page.locator('#coinsCount')).toHaveText('200')
})

test('a transfer code carries progress to a fresh phone', async ({ page }) => {
  await seed(page, { level: 12, gold: 88 })
  await open(page)
  await page.locator('.hub-gear').click()
  const panel = page.locator('dialog.hub-settings')
  await panel.getByText('Move your progress').click()
  await panel.getByRole('button', { name: 'Get transfer code' }).click()
  const code = await panel.locator('.hub-code').inputValue()
  expect(code).toMatch(/^GH1\.momahjong\./)

  await seed(page, null)
  await open(page)
  await expect(page.locator('#launchWhere')).toHaveText('Match the tiles and clear the board')
  await page.locator('.hub-gear').click()
  await panel.getByText('Move your progress').click()
  await panel.getByRole('button', { name: 'Enter a code' }).click()
  await panel.locator('.hub-code').fill(code)
  await panel.getByRole('button', { name: 'Use this code' }).click()
  await expect(panel.locator('.hub-message')).toHaveText('Progress restored.')
  await panel.locator('.hub-settings-close').click()
  await expect(page.locator('#launchWhere')).toHaveText('Level 12')
})

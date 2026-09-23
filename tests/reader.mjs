import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4173/fujita-earth-trip/';
const browser = await chromium.launch({ headless: true });
const artifacts = process.env.TEST_ARTIFACTS || '/tmp/fujita-test';
await mkdir(artifacts, { recursive: true });
const failures = [], overflow = [], results = [];
const pause = p => p.waitForTimeout(410);
const id = p => p.locator('#page').getAttribute('data-page');
async function context(options = {}) {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...options });
  const p = await c.newPage();
  p.on('pageerror', e => failures.push(e.message));
  await p.goto(base); return { c, p };
}
async function clickNext(p) { await pause(p); await p.locator('#next').click(); }
async function walkthrough(sea, rain, individual = false, blockImages = false) {
  const { c, p } = await context();
  if (blockImages) { await p.route('**/*.webp', route => route.abort()); await p.reload(); }
  const visited = [];
  for (let i = 0; i < 60; i++) {
    const current = await id(p); visited.push(current);
    const geometry = await p.evaluate(() => ({ horizontal: document.documentElement.scrollWidth > innerWidth, extra: document.querySelector('#reading').scrollHeight - document.querySelector('#reading').clientHeight }));
    assert.equal(geometry.horizontal, false, `horizontal overflow ${current}`);
    if (geometry.extra > 6 && sea === 'bath' && rain === 'three' && !blockImages) overflow.push({ page: current, extra: geometry.extra });
    if (sea === 'bath' && rain === 'three' && !blockImages && ['P01','P02','P07','P19','P22','P25','P41','P46','P51'].includes(current)) await p.screenshot({ path: `${artifacts}/${current}.png` });
    if (current === 'P51') break;
    if (current === 'P02' || current === 'P15') {
      assert.equal(await p.locator('#next').isDisabled(), true);
      const initial = await id(p); await p.locator('.story-text').click(); assert.equal(await id(p), initial);
      if (individual) for (const name of ['sea','forest','rainbow']) await p.locator(`[data-paper=${name}]`).click();
      else await p.locator('.alternative').click();
      assert.equal(await id(p), initial, 'collection must not auto-advance');
      assert.equal(await p.locator('.paper-card.gathered').count(), 3);
    }
    if (current === 'P07' || current === 'P19') {
      await pause(p); await p.locator(`[data-choice=${current === 'P07' ? sea : rain}]`).click(); continue;
    }
    if (current === 'P11' || current === 'P18') {
      if (individual) { await p.locator('.sound-object').first().click(); assert.ok((await p.locator('.feedback').innerText()).length); }
      assert.equal(await id(p), current);
    }
    if (current === 'P24') { await p.locator(individual ? '.foldout' : '.alternative').click(); assert.equal(await p.locator('.unfolded').count(), 1); }
    if (current === 'P13') assert.equal((await p.locator('.story-text').innerText()).includes('消しあと'), sea === 'bath');
    if (current === 'P39') { assert.equal((await p.locator('.story-text').innerText()).includes('おふろ'), sea === 'bath'); assert.equal(await p.locator('.smudged').count(), 1); }
    if (current === 'P41') assert.equal(await p.locator('.memory').getAttribute('data-variant'), rain);
    if (current === 'P42') assert.equal(await p.locator('[role=meter]').getAttribute('aria-valuenow'), '1');
    await clickNext(p);
  }
  assert.equal(await id(p), 'P51'); assert.equal(visited.length, 51);
  await pause(p); await p.getByRole('button', { name: 'もういちど よむ' }).click(); assert.equal(await id(p), 'P01');
  const state = await p.evaluate(() => JSON.parse(localStorage.getItem('nijiiro:fujita-white-page:v1')));
  assert.equal(state.sea, null); assert.equal(state.rain, null); assert.equal(state.opened, false); assert.deepEqual(state.collected, []);
  results.push({ sea, rain, individual, blockImages, pages: visited.length, passed: true }); await c.close();
}
async function savedAt(p, page, extra = {}) {
  await p.evaluate(({ page, extra }) => localStorage.setItem('nijiiro:fujita-white-page:v1', JSON.stringify({ version:1, page, sea:'bath', rain:'hat', collected:['sea','forest','rainbow'], protected:['sea','forest','rainbow'], opened:true, ...extra })), { page, extra });
  await p.reload();
}
try {
  await Promise.all(['umi','bath'].flatMap(sea => ['drops','hat','three'].map(rain => walkthrough(sea, rain, rain === 'hat'))));
  await walkthrough('bath','three',false,true);
  const { c, p } = await context({ reducedMotion: 'no-preference' });
  // T01: one tap reveals only; the next page cannot be skipped by double tap.
  await p.locator('#page').click({ position:{x:20,y:20} }); assert.equal(await id(p), 'P01');
  assert.equal(await p.locator('.paragraph:not(.visible)').count(), 0);
  await p.waitForTimeout(500); await p.locator('#next').dblclick({ delay:40 }); assert.equal(await id(p), 'P02');
  await p.waitForTimeout(1800); await p.locator('.alternative').click();
  await p.reload(); await p.waitForTimeout(1800); assert.equal(await p.locator('.paper-card.gathered').count(), 3); assert.equal(await p.locator('.paper-card:disabled').count(), 3);
  await savedAt(p, 'P07'); await p.waitForTimeout(1500); await p.locator('[data-choice=umi]').dblclick({ delay:40 }); assert.equal(await id(p), 'P08a');
  await pause(p); await p.locator('#back').click(); await p.waitForTimeout(1500); await p.locator('[data-choice=bath]').click(); assert.equal(await id(p), 'P08b');
  await savedAt(p, 'P19'); await p.waitForTimeout(500); await p.locator('[data-choice=three]').click(); assert.equal(await id(p), 'P20c');
  await savedAt(p, 'P41', { rain:'three' }); assert.equal(await p.locator('.memory').getAttribute('data-variant'), 'three');
  await pause(p); await p.locator('#back').click(); await pause(p); await p.locator('#next').click(); await p.waitForTimeout(500); await p.locator('#next').click(); await pause(p); await p.locator('#next').click();
  // Reload at a known returned page; value must be derived, never accumulated.
  await savedAt(p, 'P42'); assert.equal(await p.locator('[role=meter]').getAttribute('aria-valuenow'), '1'); await p.reload(); assert.equal(await p.locator('[role=meter]').getAttribute('aria-valuenow'), '1');
  await savedAt(p,'P44'); await p.waitForTimeout(1800); await p.locator('#sound').click(); assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true'); await p.locator('#sound').click(); assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'false');
  const stable = await id(p); await p.waitForTimeout(2500); assert.equal(await id(p), stable);
  results.push({ test:'reveal, double tap, persistence, change choice, meter, sound, no auto-advance', passed:true });
  // Small and landscape viewports with enlarged text retain scrolling and all controls.
  for (const viewport of [{width:320,height:568},{width:844,height:390}]) {
    await p.setViewportSize(viewport); await savedAt(p,'P31'); await p.locator('#settings').click(); await p.locator('#large').check(); await p.getByRole('button',{name:'とじる',exact:true}).click();
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
    const canScroll = await p.locator('#reading').evaluate(e => { e.scrollTop = e.scrollHeight; return e.scrollTop > 0; }); assert.equal(canScroll,true);
    await p.screenshot({path:`${artifacts}/large-${viewport.width}.png`}); await pause(p); await p.locator('#next').click(); assert.equal(await id(p),'P32');
  }
  await c.close();
  // Unavailable storage is a supported in-memory experience.
  const c2 = await browser.newContext({ reducedMotion:'reduce' });
  await c2.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('storage unavailable'); }; });
  const p2 = await c2.newPage(); await p2.goto(base); await pause(p2); await p2.locator('#next').click(); assert.equal(await id(p2),'P02'); await c2.close();
  results.push({test:'small/landscape with enlarged text; unavailable storage',passed:true});
  assert.deepEqual(failures, []);
  await writeFile(`${artifacts}/results.json`, JSON.stringify({results,overflow,failures}, null,2));
  console.log(JSON.stringify({results,overflow,failures},null,2));
} finally { await browser.close(); }

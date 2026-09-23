// DOM/event integration tests. These do not measure CSS layout or replace real-device testing.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Window } = await import(require.resolve('happy-dom'));
const root = new URL('../', import.meta.url);
const html = (await readFile(new URL('fujita-earth-trip/index.html', root), 'utf8')).replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
const source = (await readFile(new URL('fujita-earth-trip/story.js', root), 'utf8')).replace(/export /g, '') + '\n' + (await readFile(new URL('fujita-earth-trip/app.js', root), 'utf8')).split('\n').slice(1).join('\n');
const results = [];
const KEY = 'nijiiro:fujita-white-page:v1';
function mount(saved = null, instant = true, brokenStorage = false) {
  const win = new Window({url:'https://example.invalid/fujita-earth-trip/', settings:{disableCSSFileLoading:true,disableJavaScriptFileLoading:true}});
  win.__testClock = 1000;
  win.localStorage.setItem('nijiiro:reading-preferences:v1', JSON.stringify({instant}));
  if (saved) win.localStorage.setItem(KEY,JSON.stringify(saved));
  if (brokenStorage) win.localStorage.setItem = () => { throw new Error('unavailable'); };
  win.document.write(html); win.eval('(function(performance) {\n' + source + '\n})({ now: () => window.__testClock });');
  return {win, doc:win.document, id:() => win.document.querySelector('#page').dataset.page,
    click(selector, advance = 500, detail = 1) { win.__testClock += advance; const e = win.document.querySelector(selector); assert.ok(e, `missing ${selector}`); assert.ok(!e.disabled, `disabled ${selector}`); e.dispatchEvent(new win.MouseEvent('click',{bubbles:true,detail})); },
    state:() => JSON.parse(win.localStorage.getItem(KEY)),
    close:() => win.happyDOM.abort()};
}
const baseState = (page, extra = {}) => ({version:1,page,sea:'bath',rain:'hat',collected:['sea','forest','rainbow'],protected:['sea','forest','rainbow'],opened:true,...extra});
async function walk(sea, rain, individual) {
  const r = mount(); const visited = [];
  for (let i=0;i<55;i++) {
    const id = r.id(); visited.push(id);
    if (id === 'P51') break;
    if (['P02','P15'].includes(id)) {
      assert.equal(r.doc.querySelector('#next').disabled,true);
      r.click('.story-text'); assert.equal(r.id(),id);
      if (individual) for (const item of ['sea','forest','rainbow']) r.click(`[data-paper=${item}]`);
      else r.click('.alternative');
      assert.equal(r.doc.querySelectorAll('.gathered').length,3); assert.equal(r.id(),id);
    }
    if (['P07','P19'].includes(id)) { r.click(`[data-choice=${id==='P07'?sea:rain}]`); continue; }
    if (['P11','P18'].includes(id)) { r.click('.sound-object'); assert.ok(r.doc.querySelector('.feedback').textContent.length); assert.equal(r.id(),id); }
    if (id==='P24') { r.click(individual?'.foldout':'.alternative'); assert.equal(r.doc.querySelectorAll('.unfolded').length,1); }
    if (id==='P13') assert.equal(r.doc.querySelector('.story-text').textContent.includes('消しあと'),sea==='bath');
    if (id==='P39') { assert.equal(r.doc.querySelector('.story-text').textContent.includes('おふろ'),sea==='bath'); assert.equal(r.doc.querySelectorAll('.smudged').length,1); }
    if (id==='P41') assert.equal(r.doc.querySelector('.memory').dataset.variant,rain);
    if (id==='P42') assert.equal(r.doc.querySelector('[role=meter]').getAttribute('aria-valuenow'),'1');
    r.click('#next');
  }
  assert.equal(r.id(),'P51'); assert.equal(visited.length,51);
  r.click('.end-actions button'); assert.equal(r.id(),'P01'); assert.equal(r.state().sea,null); assert.equal(r.state().rain,null); assert.deepEqual(r.state().collected,[]); assert.equal(r.state().opened,false);
  await r.close(); results.push({test:'full route and replay',sea,rain,individual,pages:visited.length,passed:true});
}
for (const sea of ['umi','bath']) for (const rain of ['drops','hat','three']) await walk(sea,rain,rain==='hat');
{
  const r=mount(null,false); r.click('#page'); assert.equal(r.id(),'P01'); assert.equal(r.doc.querySelectorAll('.paragraph:not(.visible)').length,0);
  r.click('#next',50); assert.equal(r.id(),'P01'); r.click('#next',500); assert.equal(r.id(),'P02');
  r.click('#next',20); assert.equal(r.id(),'P02'); await r.close(); results.push({test:'reveal-only tap and transition double-tap guard',passed:true});
}
{
  const r=mount(baseState('P07')); r.click('[data-choice=umi]'); assert.equal(r.id(),'P08a'); r.click('#back'); assert.equal(r.id(),'P07'); r.click('[data-choice=bath]'); assert.equal(r.id(),'P08b');
  while(r.id()!=='P13') r.click('#next'); assert.ok(r.doc.querySelector('.story-text').textContent.includes('消しあと'));
  await r.close();
  const q=mount(baseState('P19')); q.click('[data-choice=three]'); assert.equal(q.id(),'P20c'); q.click('#back'); q.click('[data-choice=drops]'); assert.equal(q.id(),'P20a');
  while(q.id()!=='P41') { if(q.doc.querySelector('.alternative')&&!q.doc.querySelector('.alternative').hidden)q.click('.alternative'); q.click('#next'); }
  assert.equal(q.doc.querySelector('.memory').dataset.variant,'drops'); q.click('#back'); q.click('#next'); assert.equal(q.doc.querySelector('[role=meter]').getAttribute('aria-valuenow'),'0.75'); q.click('#next'); assert.equal(q.doc.querySelector('[role=meter]').getAttribute('aria-valuenow'),'1');
  const resumed=mount(q.state()); assert.equal(resumed.id(),'P42'); assert.equal(resumed.doc.querySelector('[role=meter]').getAttribute('aria-valuenow'),'1'); await resumed.close(); await q.close(); results.push({test:'back, choice replacement, dependent memories and nonaccumulating meter, resume',passed:true});
}
{
  const r=mount(baseState('P02')); assert.equal(r.doc.querySelectorAll('.paper-card:disabled').length,3); assert.equal(r.doc.querySelector('#next').disabled,false); await r.close();
  const bad=mount(baseState('P45',{sea:null,rain:null}));assert.equal(bad.id(),'P07');await bad.close();
  const unsupported=mount({version:999,page:'P45'});assert.equal(unsupported.id(),'P01');await unsupported.close();
  const storage=mount(null,true,true);storage.click('#next');assert.equal(storage.id(),'P02');await storage.close();
  results.push({test:'completed collection resumes; invalid saves and unavailable storage',passed:true});
}
{
  const r=mount(baseState('P07')); for(const img of r.doc.querySelectorAll('img')) img.dispatchEvent(new r.win.Event('error'));assert.ok(r.doc.querySelector('.image-fallback'));r.click('[data-choice=bath]');assert.equal(r.id(),'P08b');await r.close();
  const quiet=mount(baseState('P22'));assert.equal(quiet.doc.querySelectorAll('.paragraph').length,0);quiet.click('#next');assert.equal(quiet.id(),'P23');await quiet.close();
  results.push({test:'image failure fallback, silent rainbow page remains manually navigable',passed:true});
}
console.log(JSON.stringify({suite:'DOM events only; no visual browser assertions',results},null,2));
if(process.env.TEST_RESULTS)await writeFile(process.env.TEST_RESULTS,JSON.stringify({suite:'DOM events only; no visual browser assertions',results},null,2));

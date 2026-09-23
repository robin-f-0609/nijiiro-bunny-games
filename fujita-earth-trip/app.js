import { pages, route, linesFor, rainNames } from './story.js';

const SAVE = 'nijiiro:fujita-white-page:v1';
const PREFS = 'nijiiro:reading-preferences:v1';
const fresh = () => ({ version: 1, page: 'P01', sea: null, rain: null, collected: [], protected: [], opened: false });
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
let canSave = true;
function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { canSave = false; } }
function restore() {
  const old = read(SAVE);
  if (old?.version !== 1 || !pages.some(p => p.id === old.page)) return fresh();
  const validKeys = v => Array.isArray(v) ? [...new Set(v.filter(k => ['sea', 'forest', 'rainbow'].includes(k)))] : [];
  const state = { ...fresh(), page: old.page, sea: ['umi', 'bath'].includes(old.sea) ? old.sea : null,
    rain: Object.keys(rainNames).includes(old.rain) ? old.rain : null,
    collected: validKeys(old.collected), protected: validKeys(old.protected), opened: old.opened === true };
  const number = parseInt(state.page.slice(1), 10);
  if (number > 7 && !state.sea) state.page = 'P07';
  else if (number > 19 && !state.rain) state.page = 'P19';
  if (!route(state).some(p => p.id === state.page)) state.page = number < 19 ? 'P07' : 'P19';
  return state;
}
let state = restore();
const preferences = read(PREFS) || {};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const $ = id => document.getElementById(id);
const pageElement = $('page');
let current, shown = true, timers = [], lastNavigation = -1000, lastReveal = -1000, sound = false, context;
const voices = new Set();
const descriptions = {
  sea: '青い波が砂浜へ寄せる海の水彩画', forest: '木もれびの道。木の根に木の実があり、小川が流れる森',
  rain: '雨の中、大きな木の根もとにある、雨宿りできそうなくぼみ',
  rainbow: '雨上がりの空いっぱいに広がる七色の虹', moon: 'すすきの向こう、青い夜空に浮かぶまんまるの月',
  carrot: 'にんじん電話', book: 'ひらいた本'
};
function element(tag, className, text) { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = text; return e; }
function picture(name, className = 'landscape') {
  const wrap = element('figure', className);
  const img = element('img'); img.src = `./assets/${name}.webp`; img.alt = descriptions[name] || '';
  img.width = ['carrot','book'].includes(name) ? 360 : 1200; img.height = ['carrot','book'].includes(name) ? 360 : 800;
  img.decoding = 'async';
  img.addEventListener('error', () => { img.hidden = true; wrap.append(element('figcaption', 'image-fallback', descriptions[name])); }, { once: true });
  wrap.append(img); return wrap;
}
function button(text, className, action) {
  const b = element('button', className, text); b.type = 'button';
  b.addEventListener('click', e => { e.stopPropagation(); if (e.detail > 1) return; action(b); }); return b;
}
function meter(value, big = false) {
  const m = element('div', `meter${big ? ' big' : ''}`);
  m.setAttribute('role', 'meter'); m.setAttribute('aria-label', 'わくわくメーター');
  m.setAttribute('aria-valuemin', '0'); m.setAttribute('aria-valuemax', '2'); m.setAttribute('aria-valuenow', value);
  m.setAttribute('aria-valuetext', value === 2 ? 'ふたりぶん' : value === 1 ? 'ひとりぶん' : value === 0 ? 'からっぽ' : value < 1 ? 'ひとりぶんより少ない' : 'ひとりぶんより多い');
  m.innerHTML = `<svg viewBox="0 0 240 110" aria-hidden="true"><path d="M25 91 A95 80 0 0 1 215 91" fill="none" stroke="#d8cdb7" stroke-width="9" stroke-linecap="round"/><path d="M25 91 A95 80 0 0 1 215 91" fill="none" stroke="#8b9b79" stroke-width="3" pathLength="2" stroke-dasharray="${value} 2"/><path d="M120 8v14 M215 86l-12 3 M25 86l12 3" stroke="#756c5b"/><g class="needle" style="transform:rotate(${value * 90 - 90}deg)"><path d="M120 91V28" stroke="#80614c" stroke-width="3" stroke-linecap="round"/></g><circle cx="120" cy="91" r="5" fill="#80614c"/><text x="120" y="46" text-anchor="middle">ひとりぶん</text><text x="238" y="109" text-anchor="end">ふたりぶん</text><text x="2" y="109">からっぽ</text></svg>`;
  if (big) m.prepend(element('span', 'meter-title', 'わくわくメーター'));
  return m;
}
function memory(name) {
  const m = element('div', `memory memory-${name}`);
  m.dataset.variant = name === 'rain' ? state.rain : name;
  if (name === 'rain') {
    // 雨のページは海の紙の余白。人物は描かず、選んだ記録を言葉と紙面の変化で示す。
    m.append(picture('sea', 'rain-underpainting'));
    const caption = element('div', 'rain-record');
    if (state.rain === 'drops') { caption.append(element('span', 'ink-drops', '﹅　﹅　﹅\n　﹅　﹅'), element('span', '', 'パラパラ　しとしと')); }
    if (state.rain === 'hat') { caption.append(element('span', 'hat-drawing', '')); caption.append(element('span', '', 'しょんぼりした ぼうし')); }
    if (state.rain === 'three') { caption.append(element('span', 'rain-words', 'あまやどりの さんにん'), element('span', 'overflow-note', '耳は、ページのそとまで。')); }
    m.append(caption); m.setAttribute('aria-label', `海の紙の余白に加えた記録：${rainNames[state.rain]}`);
  } else {
    m.append(picture(name));
    if (name === 'sea') {
      const freshPage = current.fresh;
      const label = element('div', freshPage ? 'sea-word' : 'sea-word smudged', freshPage && state.sea === 'bath' ? 'とっても おおきな おふろ' : 'うみ');
      if (!freshPage) { label.setAttribute('aria-label', '海の名前は雨でにじんで読めない'); label.setAttribute('role', 'img'); }
      m.append(label);
      if (!freshPage && state.sea === 'bath') { const erased = element('span', 'erased', 'とっても おおきな おふろ'); erased.setAttribute('aria-hidden', 'true'); m.append(erased); }
    }
    if (name === 'forest') m.append(element('div', 'pencil-note', 'さわさわ　こつん'));
    if (name === 'rainbow') m.classList.add('open-spread');
  }
  return m;
}
function save() { store(SAVE, state); }
function stopSounds() { voices.forEach(v => { try { v.stop(); } catch {} }); voices.clear(); }
function play(kind = 'paper') {
  if (!sound || !context || context.state !== 'running') return;
  if (voices.size > 3) stopSounds();
  try {
    const t = context.currentTime;
    const gain = context.createGain(); gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(0.025, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); gain.connect(context.destination);
    const osc = context.createOscillator(); osc.type = 'sine'; const freq = { paper: 480, leaves: 700, nut: 220, water: 880, rain: 620, ring: 940 }[kind] || 480;
    osc.frequency.setValueAtTime(freq, t); osc.frequency.exponentialRampToValueAtTime(freq * 0.72, t + 0.3); osc.connect(gain); voices.add(osc);
    osc.onended = () => { voices.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start(); osc.stop(t + 0.42);
  } catch { /* 音声の失敗は進行を妨げない。 */ }
}
function finishText() {
  timers.forEach(clearTimeout); timers = []; shown = true;
  pageElement.querySelectorAll('.paragraph').forEach(p => p.classList.add('visible'));
  pageElement.querySelectorAll('[data-after-text]').forEach(e => e.disabled = false);
  updateNext();
}
function beginText() {
  const paras = [...pageElement.querySelectorAll('.paragraph')];
  if (preferences.instant || reduced.matches || paras.length === 0) return finishText();
  shown = false;
  pageElement.querySelectorAll('[data-after-text]').forEach(e => e.disabled = true);
  paras.forEach((p, i) => timers.push(setTimeout(() => p.classList.add('visible'), i * 360)));
  timers.push(setTimeout(finishText, paras.length * 360)); updateNext();
}
function complete() {
  if (current.interaction === 'collect') return state.collected.length === 3;
  if (current.interaction === 'protect') return state.protected.length === 3;
  if (current.interaction === 'unfold') return state.opened;
  return true;
}
function updateNext() {
  const b = $('next');
  b.hidden = !!current.choice || !!current.end;
  b.disabled = shown && !complete();
  b.textContent = !shown ? '全文を みる' : `${current.nextLabel || 'つぎへ'} ›`;
  b.setAttribute('aria-label', !shown ? 'このページの文章をすべて表示' : current.nextLabel || 'つぎへ');
}
function navigate(id) {
  if (performance.now() - lastNavigation < 380) return;
  lastNavigation = performance.now(); state.page = id; save(); render(); play('paper');
}
function next() {
  if (performance.now() - lastNavigation < 380) return;
  if (!shown) { lastReveal = performance.now(); finishText(); return; }
  if (performance.now() - lastReveal < 280) return;
  if (current.choice || current.end || !complete()) return;
  const r = route(state), i = r.findIndex(p => p.id === state.page);
  if (r[i + 1]) navigate(r[i + 1].id);
}
function feedbackBox() { const box = element('p', 'feedback'); box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); return box; }
function interaction() {
  const area = element('div', `interaction ${current.interaction}`);
  area.addEventListener('click', e => e.stopPropagation());
  const feedback = feedbackBox();
  const kind = current.interaction;
  if (kind === 'collect' || kind === 'protect') {
    const key = kind === 'collect' ? 'collected' : 'protected';
    const cards = element('div', 'paper-cards');
    const names = { sea: '海の紙', forest: '森の紙', rainbow: '虹の紙' };
    const replies = { sea: 'ふじた「これは……あの、青い水」', forest: 'ふじた「これは……緑の、ふさふさ」', rainbow: 'ふじたは、しばらく紙を見つめました。' };
    const update = () => {
      cards.querySelectorAll('button').forEach(b => { const done = state[key].includes(b.dataset.paper); b.classList.toggle('gathered', done); b.disabled = done; b.querySelector('span').textContent = done ? (kind === 'collect' ? 'ひろった' : 'しまった') : names[b.dataset.paper]; });
      alternative.hidden = state[key].length === 3; updateNext();
    };
    const collect = name => {
      if (state[key].includes(name)) return;
      state[key].push(name); save(); play('paper');
      feedback.textContent = kind === 'collect' ? replies[name] : '生徒が、紙を服の中へ。しっかり守れました。';
      if (state[key].length === 3) feedback.textContent += kind === 'collect' ? ' 三枚とも、机に戻りました。' : ' 三枚とも、なくさずに持っています。';
      update();
    };
    for (const name of Object.keys(names)) {
      const b = button('', 'paper-card', () => collect(name)); b.dataset.paper = name; b.setAttribute('aria-label', `${names[name]}を${kind === 'collect' ? '拾う' : '守る'}`); b.dataset.afterText = '';
      b.append(picture(name), element('span', '', names[name])); cards.append(b);
    }
    const alternative = button(kind === 'collect' ? 'いっしょに ひろう' : 'かみを まもる', 'alternative', () => { Object.keys(names).forEach(collect); }); alternative.dataset.afterText = '';
    area.append(cards, feedback, alternative); update();
    // beginText must not re-enable collected cards.
    cards.querySelectorAll('button:disabled').forEach(b => delete b.dataset.afterText);
  }
  if (kind === 'forest' || kind === 'rain') {
    const opts = kind === 'forest' ? [['葉', 'さわさわ', 'leaves'], ['木の実', 'こつん', 'nut'], ['小川', 'ちょろちょろ', 'water']] : [['雨つぶ', 'パラパラ', 'rain'], ['雨つぶ', 'しとしと', 'water']];
    const row = element('div', 'sound-objects');
    opts.forEach(([label, word, tone], i) => {
      const b = button(label, `sound-object ${kind === 'rain' ? 'drop' : ''}`, () => { feedback.textContent = word; feedback.classList.remove('ripple'); void feedback.offsetWidth; feedback.classList.add('ripple'); play(tone); });
      b.setAttribute('aria-label', kind === 'rain' ? `${word}の雨つぶに触れる` : `${label}に触れる`); b.dataset.afterText = ''; b.style.setProperty('--tilt', `${i % 2 ? 5 : -4}deg`); row.append(b);
    });
    area.append(element('p', 'small-hint', kind === 'forest' ? '気になるところに、ふれてみよう。' : '雨に、そっと音をかさねて。'), row, feedback);
  }
  if (kind === 'unfold') {
    const spread = button('', `foldout${state.opened ? ' unfolded' : ''}`, () => open()); spread.setAttribute('aria-label', '虹の紙をひろげる'); spread.dataset.afterText = '';
    spread.append(picture('rainbow')); spread.append(element('span', 'fold fold-left'), element('span', 'fold fold-right'));
    const alternative = button('ひろげる', 'alternative', () => open()); alternative.dataset.afterText = '';
    function open() { if (state.opened) return; state.opened = true; save(); spread.classList.add('unfolded'); feedback.textContent = '空いっぱいの虹が、紙いっぱいにひろがりました。'; alternative.hidden = true; play(); updateNext(); }
    if (state.opened) alternative.hidden = true;
    area.append(spread, feedback, alternative);
  }
  return area;
}
function render() {
  timers.forEach(clearTimeout); timers = []; stopSounds();
  current = pages.find(p => p.id === state.page);
  const r = route(state), index = r.findIndex(p => p.id === state.page);
  pageElement.replaceChildren(); pageElement.dataset.page = current.id;
  pageElement.className = [current.quiet ? 'quiet' : '', current.panorama ? 'panorama' : '', current.blank ? 'blank-page' : '', current.choice ? 'choice-page' : ''].join(' ');
  $('chapter').textContent = current.chapter;
  $('meter-slot').replaceChildren();
  if (current.meter !== undefined && !current.bigMeter) $('meter-slot').append(meter(current.meter));
  $('page-number').textContent = `${index + 1} / ${r.length}`;
  $('progress').style.width = `${(index + 1) / r.length * 100}%`;
  $('back').disabled = index === 0;
  if (current.image) pageElement.append(picture(current.image));
  if (current.bigMeter) pageElement.append(meter(current.meter, true));
  if (current.memory) pageElement.append(memory(current.memory));
  if (current.prop) pageElement.append(picture(current.prop, 'prop'));
  if (current.blank) { const blank = element('div', 'blank-sheet'); blank.setAttribute('role', 'img'); blank.setAttribute('aria-label', '何も書かれていない、白いページ'); pageElement.append(blank); }
  const text = element('div', 'story-text');
  for (const line of linesFor(current, state)) {
    const para = element('p', `paragraph${line.poem ? ' poem' : ''}${line.speaker ? ' dialogue' : ''}`);
    if (line.speaker) { para.append(element('span', 'speaker', line.speaker)); para.append(document.createTextNode(`「${line.text}」`)); }
    else para.textContent = line.text;
    text.append(para);
  }
  pageElement.append(text);
  if (current.interaction) pageElement.append(interaction());
  if (current.choice) {
    const choices = element('div', 'choices'); choices.setAttribute('role', 'group'); choices.setAttribute('aria-label', '本に書くものを選ぶ');
    current.options.forEach(([value, label]) => {
      const b = button(label, 'choice', () => {
        if (!shown || performance.now() - lastNavigation < 380) return;
        state[current.choice] = value; // 後半の表示はこの値から都度導出。独立した他の選択は残す。
        const target = current.choice === 'sea' ? (value === 'bath' ? 'P08b' : 'P08a') : ({ drops: 'P20a', hat: 'P20b', three: 'P20c' }[value]);
        navigate(target);
      });
      b.dataset.choice = value; b.dataset.afterText = ''; b.setAttribute('aria-pressed', state[current.choice] === value ? 'true' : 'false'); choices.append(b);
    });
    pageElement.append(choices);
  }
  if (current.end) {
    const end = element('div', 'end-actions');
    const replay = button('もういちど よむ', 'choice', () => { if (performance.now() - lastNavigation < 380) return; state = fresh(); save(); lastNavigation = performance.now(); render(); }); replay.dataset.afterText = ''; end.append(replay);
    const shelf = element('a', 'shelf-link', 'おはなしの ほんだなへ'); shelf.href = '../'; end.append(shelf); pageElement.append(end);
  }
  if (current.id === 'P01') pageElement.append(element('p', 'reading-hint', 'タップで全文を表示。もう一度で、つぎのページへ。'));
  beginText();
  $('reading').scrollTop = 0;
  $('reading').focus({ preventScroll: true });
  save();
}
$('next').addEventListener('click', next);
$('back').addEventListener('click', () => { const r = route(state), i = r.findIndex(p => p.id === state.page); if (i > 0) navigate(r[i - 1].id); });
pageElement.addEventListener('click', e => {
  if (e.target.closest('button,a') || e.detail > 1 || getSelection()?.toString()) return;
  if (!shown) { lastReveal = performance.now(); finishText(); return; }
  if (current.interaction || current.choice || current.end) return;
  next();
});
pageElement.addEventListener('keydown', e => { if (e.target === pageElement && ['Enter', ' '].includes(e.key)) { e.preventDefault(); if (!shown) finishText(); else if (!current.interaction) next(); } });
$('sound').addEventListener('click', async () => {
  sound = !sound;
  if (sound) { try { context ||= new (window.AudioContext || window.webkitAudioContext)(); await context.resume(); } catch { sound = false; } }
  else stopSounds();
  $('sound').textContent = sound ? '音 あり' : '音 なし'; $('sound').setAttribute('aria-pressed', String(sound)); if (sound) play();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stopSounds(); });
$('settings').addEventListener('click', () => { finishText(); if (!canSave) $('preferences').querySelector('p').textContent = '音がなくても、最後まで遊べます。このブラウザでは続きの保存ができません。'; $('preferences').showModal(); });
$('preferences').addEventListener('click', e => { if (e.target === $('preferences')) $('preferences').close(); });
for (const key of ['instant', 'large']) {
  $(key).checked = preferences[key] === true;
  $(key).addEventListener('change', () => { preferences[key] = $(key).checked; store(PREFS, preferences); document.documentElement.classList.toggle('large-type', !!preferences.large); if (preferences.instant) finishText(); });
}
document.documentElement.classList.toggle('large-type', !!preferences.large);
reduced.addEventListener('change', () => { if (reduced.matches) finishText(); });
render();

import cards from './cards.js';

const ROOT = document.getElementById('app');
const FREE = 12;
const STORE = 'predef-bingo-v1';
const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const ICONS = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 14 0m-6-6 6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 12-14 0m6 6-6-6 6-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/><path d="M18 12h.01"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11a9 9 0 1 1 2.5 6.2M3 4v7h7"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"/></svg>',
};

const allLines = [
  ...Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) => row * 5 + col)),
  ...Array.from({ length: 5 }, (_, col) => Array.from({ length: 5 }, (_, row) => row * 5 + col)),
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];
const defaultData = () => ({ checked: [FREE], name: '' });
let store;
try { store = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { store = {}; }
if (!store || typeof store !== 'object' || Array.isArray(store)) store = {};
let selected = getCardFromUrl();
let previousLineCount = 0;
let toastTimeout;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
function num(id) { return String(id).padStart(2, '0'); }
function getCardFromUrl() {
  const id = Number(new URLSearchParams(location.search).get('card'));
  return Number.isInteger(id) && id >= 1 && id <= cards.length ? id : null;
}
function linkFor(id) {
  const u = new URL(location.href);
  u.searchParams.set('card', String(id));
  u.hash = '';
  return u.toString();
}
function getData(id) {
  const item = store[id] || defaultData();
  const checked = [...new Set([FREE, ...(Array.isArray(item.checked) ? item.checked : [])])].filter(i => Number.isInteger(i) && i >= 0 && i <= 24);
  return { checked, name: typeof item.name === 'string' ? item.name.slice(0, 60) : '' };
}
function save(id, data) {
  store[id] = data;
  try { localStorage.setItem(STORE, JSON.stringify(store)); } catch { /* private/incognito mode: app remains usable */ }
}
function linesFor(checked) {
  const chosen = new Set(checked);
  return allLines.filter(line => line.every(i => chosen.has(i)));
}
function showToast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 3000);
}
async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    showToast(ok ? message : 'Neizdevās kopēt. Atver saiti un nokopē adresi pārlūkā.');
  }
}
function navigate(id) {
  selected = id;
  const u = new URL(location.href);
  if (id) u.searchParams.set('card', id);
  else u.searchParams.delete('card');
  history.pushState({}, '', `${u.pathname}${u.search}${u.hash}`);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function wordmark() {
  return `<span class="brand-logo" aria-hidden="true">${ICONS.check}</span><span class="brand-title">PREZENTĀCIJU <strong>BINGO<span class="period">.</span></strong></span>`;
}
function letterTiles(small = false) {
  return `<div class="letter-tiles ${small ? 'letter-tiles--small' : ''}" aria-hidden="true">${LETTERS.map((x, i) => `<span class="letter-tile letter-tile--${i}">${x}</span>`).join('')}</div>`;
}
function renderHome() {
  const last = Number(localStorage.getItem(`${STORE}-last`));
  const lastValid = Number.isInteger(last) && last >= 1 && last <= cards.length;
  ROOT.innerHTML = `
    <div class="site home">
      <header class="topbar wrap"><div class="brand">${wordmark()}</div><span class="topbar-right"><span class="topbar-dot"></span> PRIEKŠAIZSTĀVĒŠANA / 2026</span></header>
      <main>
        <section class="hero wrap">
          <div class="hero-copy"><div class="eyebrow"><span class="mini-square"></span> SPĒLE, KAMĒR CITI PREZENTĒ</div>
            <h1>Klausies.<br>Atzīmē.<br><em>BINGO!</em></h1>
            <p class="hero-desc">Prezentāciju klausīšanās kļuva interesantāka. Izvēlies savu kartīti, seko līdzi prezentācijām un savāc piecus lauciņus vienā līnijā.</p>
            <div class="hero-actions"><a class="btn btn-dark" href="#kartites">Izvēlēties kartīti ${ICONS.arrow}</a>${lastValid ? `<button class="btn btn-light" data-open="${last}">Turpināt #${num(last)} ${ICONS.arrow}</button>` : ''}</div>
            <div class="hero-stats"><span><b>13</b> unikālas kartītes</span><i></i><span><b>25</b> lauciņi katrā</span><i></i><span><b>5</b> pēc kārtas = uzvara</span></div>
          </div>
          <div class="hero-art" aria-label="Dekoratīvs BINGO paraugs">
            <div class="art-dots art-dots-top"></div>
            <div class="art-label">YOUR GAME CARD <span>↗</span></div>
            ${letterTiles()}
            <div class="art-pattern">${Array.from({ length: 25 }, (_, i) => `<div class="art-cell ${[1, 6, 11, 16, 21].includes(i) ? 'art-cell--picked' : ''} ${i === 12 ? 'art-cell--free' : ''}">${i === 12 ? '★' : [1, 6, 11, 16, 21].includes(i) ? ICONS.check : ['●', '✳', '–', '○'][i % 4]}</div>`).join('')}</div>
            <div class="art-footer"><span>GOOD LUCK, HAVE FUN.</span><span>13 / 13</span></div>
            <span class="floating-star">✳</span>
          </div>
        </section>
        <section class="steps-section"><div class="wrap steps-inner">
          <div class="section-label">KĀ TAS STRĀDĀ</div>
          <div class="steps-grid"><div><span class="step-number">01 /</span><h3>Izvēlies numuru</h3><p>Katram jaunietim sava kartīte no 01 līdz 13. Skolotājs var nosūtīt tiešo saiti.</p></div>
            <div><span class="step-number">02 /</span><h3>Atzīmē notikumus</h3><p>Spied uz lauciņa, kad tajā aprakstītais patiešām notiek prezentācijā.</p></div>
            <div><span class="step-number">03 /</span><h3>Savāc BINGO</h3><p>Pieci horizontāli, vertikāli vai diagonāli. Brīvā vieta vidū jau ir atzīmēta!</p></div></div>
        </div></section>
        <section class="cards-section wrap" id="kartites"><div class="cards-section-header"><div><div class="section-label">PIE TAVAS KARTĪTES</div><h2>Izvēlies savu numuru<span>.</span></h2><p>13 dažādas kombinācijas. Vienu kartīti ieteicams piešķirt vienam jaunietim.</p></div><button class="btn btn-outlined" id="copy-all">${ICONS.link} Kopēt visas 13 saites</button></div>
          <div class="pick-grid">${cards.map(card => { const d = getData(card.id); const done = d.checked.length - 1; return `<div class="pick-card"><span class="pick-card-meta">KARTĪTE / ${num(card.id)}</span><span class="pick-card-number">${num(card.id)}<span class="pick-asterisk">✳</span></span><div class="pick-card-bottom"><span class="pick-progress">${done ? `${done} / 24 atzīmēti` : 'Gatava spēlei'}</span><div class="pick-actions"><button class="pick-copy" data-copy="${card.id}" title="Kopēt kartītes saiti" aria-label="Kopēt kartītes ${num(card.id)} saiti">${ICONS.link}</button><button class="pick-open" data-open="${card.id}" aria-label="Atvērt kartīti ${num(card.id)}">${ICONS.arrow}</button></div></div></div>`; }).join('')}</div>
          <div class="helper-note"><span>ⓘ</span><p>Atzīmes tiek saglabātas konkrētajā pārlūkā. Spēlējot no cita telefona, progress netiek automātiski pārnests.</p></div>
        </section>
      </main>
      <footer class="footer wrap"><span>PREZENTĀCIJU BINGO © 2026</span><span>ATZĪMĒ TIKAI TO, KAS TIEŠĀM NOTIEK. ✳</span></footer>
    </div>`;
  document.querySelectorAll('[data-open]').forEach(el => el.addEventListener('click', () => navigate(Number(el.dataset.open))));
  document.querySelectorAll('[data-copy]').forEach(el => el.addEventListener('click', () => copyText(linkFor(Number(el.dataset.copy)), `Kartītes #${num(el.dataset.copy)} saite nokopēta!`)));
  document.querySelector('#copy-all').addEventListener('click', () => copyText(cards.map(card => `Kartīte ${num(card.id)}: ${linkFor(card.id)}`).join('\n'), 'Nokopētas visu 13 kartīšu saites!'));
}
function renderCard() {
  const card = cards[selected - 1];
  const data = getData(card.id);
  const lines = linesFor(data.checked);
  previousLineCount = lines.length;
  const winTiles = new Set(lines.flat());
  ROOT.innerHTML = `
    <div class="site game">
      <header class="topbar wrap"><button class="brand brand-button" id="go-home" aria-label="Atpakaļ uz kartīšu izvēli">${wordmark()}</button><div class="topbar-actions"><span class="live-marker"><i></i> SPĒLES REŽĪMS</span><button class="top-link" id="home-link">Visas kartītes ${ICONS.arrow}</button></div></header>
      <main class="game-wrap wrap">
        <div class="game-top"><button class="back-link" id="back">${ICONS.back} Atpakaļ pie kartītēm</button><span class="game-edition">PRIEKŠAIZSTĀVĒŠANA • 2026</span></div>
        <section class="game-heading"><div><div class="eyebrow"><span class="mini-square"></span> TAVA PERSONĪGĀ SPĒLES KARTĪTE</div><h1>Prezentāciju<br><em>BINGO!</em></h1><p>Klausies prezentācijas un atzīmē situācijas, ko pamani. Lai veicas!</p></div><div class="game-number"><small>KARTĪTE NR.</small><strong>${num(card.id)}</strong><span>NO 13</span></div></section>
        <div class="control-row"><label class="name-box"><span>SPĒLĒTĀJA VĀRDS <span class="optional">(NAV OBLIGĀTS)</span></span><input id="player-name" autocomplete="name" maxlength="60" placeholder="Ieraksti savu vārdu..." value="${escapeHtml(data.name)}"></label><div class="tool-buttons"><button class="btn-icon-text" id="share">${ICONS.link} <span>Kopēt saiti</span></button><button class="btn-icon-text" id="print">${ICONS.print} <span>Drukāt</span></button><button class="btn-icon-text" id="clear">${ICONS.reset} <span>Notīrīt</span></button></div></div>
        <div class="progress-panel"><div><span class="progress-eyebrow">TAVS PROGRESS</span><div class="progress-headline"><strong id="progress-number">${data.checked.length - 1}<span> / 24</span></strong><span id="progress-label">${lines.length ? `BINGO! ${lines.length} ${lines.length === 1 ? 'līnija' : 'līnijas'}` : 'Līdz uzvarai – pieci vienā līnijā'}</span></div></div><div class="progress-meter"><div id="progress-fill" style="width:${(data.checked.length - 1) / 24 * 100}%"></div></div></div>
        <div class="board-shell" id="board-shell"><div class="board-topline"><div><span class="board-dot"></span> GAME BOARD <span class="board-muted">/ TAP TO MARK</span></div><span>05 × 05</span></div><div class="board-letters">${LETTERS.map(l => `<span>${l}</span>`).join('')}</div><div class="board-grid" id="board" role="group" aria-label="BINGO kartīte ${num(card.id)}">${card.cells.map((label, i) => renderCell(label, i, data.checked, winTiles)).join('')}</div><div class="board-foot"><span><i class="legend-mark checked-legend"></i> Atzīmēts</span><span><i class="legend-mark free-legend"></i> Brīvā vieta</span><span><i class="legend-mark line-legend"></i> BINGO līnija</span></div></div>
        <div class="game-note"><span>${ICONS.sparkle}</span><div><strong>Spēles noteikumi</strong><p>Atzīmē lauciņu, kad tajā aprakstītais notiek jebkurā prezentācijā. Pieci lauciņi horizontāli, vertikāli vai diagonāli = BINGO. Brīvā vieta vidū jau ir atzīmēta! Neprovocē situācijas un, kad uzvari, parādi kartīti skolotājam.</p></div></div>
      </main><footer class="footer wrap"><span>PREZENTĀCIJU BINGO © 2026</span><span>TAVA KARTĪTE • #${num(card.id)}</span></footer>
    </div>
    <div class="victory" id="victory" hidden role="dialog" aria-modal="true" aria-labelledby="victory-heading"><div class="victory-content"><button class="victory-close" id="victory-close" aria-label="Aizvērt">×</button><div class="victory-star">✳</div><span class="victory-kicker">APSVEICAM!</span><h2 id="victory-heading">BINGO<span>!</span></h2><p id="victory-copy">Tev izdevās savākt piecas atzīmes vienā līnijā.</p><span class="victory-tag">PARĀDI KARTĪTI SKOLOTĀJAM</span><button class="btn btn-dark" id="victory-done">Atgriezties pie kartītes ${ICONS.arrow}</button></div></div>`;
  const goHome = () => navigate(null);
  ['go-home', 'home-link', 'back'].forEach(id => document.getElementById(id).addEventListener('click', goHome));
  document.getElementById('player-name').addEventListener('input', e => { const d = getData(selected); d.name = e.target.value; save(selected, d); });
  document.getElementById('share').addEventListener('click', () => copyText(linkFor(selected), `Kartītes #${num(selected)} saite nokopēta!`));
  document.getElementById('print').addEventListener('click', () => window.print());
  document.getElementById('clear').addEventListener('click', () => {
    if (window.confirm('Vai tiešām noņemt visas atzīmes šajā kartītē? Spēlētāja vārds paliks saglabāts.')) {
      const d = getData(selected); d.checked = [FREE]; save(selected, d); refreshBoard(); showToast('Kartītes atzīmes notīrītas.');
    }
  });
  document.querySelectorAll('.bingo-cell:not(.is-free)').forEach(button => button.addEventListener('click', () => toggleCell(Number(button.dataset.index))));
  document.getElementById('victory-close').addEventListener('click', hideVictory);
  document.getElementById('victory-done').addEventListener('click', hideVictory);
  document.getElementById('victory').addEventListener('click', e => { if (e.target.id === 'victory') hideVictory(); });
}
function renderCell(label, i, checked, winning) {
  const free = i === FREE;
  const done = checked.includes(i);
  return `<button type="button" class="bingo-cell ${free ? 'is-free' : ''} ${done ? 'is-checked' : ''} ${winning.has(i) ? 'is-winning' : ''}" data-index="${i}" ${free ? 'disabled' : ''} aria-pressed="${done}" aria-label="${escapeHtml(free ? 'Brīvā vieta. Atzīmēta automātiski' : label + (done ? ', atzīmēts' : ', nav atzīmēts'))}"><span class="cell-corner">${free ? '★' : num(i + 1)}</span><span class="cell-label">${escapeHtml(free ? 'BRĪVĀ VIETA' : label)}</span><span class="cell-check" aria-hidden="true">${done ? ICONS.check : ''}</span></button>`;
}
function toggleCell(index) {
  if (index === FREE) return;
  const data = getData(selected);
  if (data.checked.includes(index)) data.checked = data.checked.filter(i => i !== index);
  else data.checked.push(index);
  save(selected, data);
  refreshBoard();
}
function refreshBoard() {
  const data = getData(selected);
  const lines = linesFor(data.checked);
  const wins = new Set(lines.flat());
  const elements = document.querySelectorAll('.bingo-cell');
  elements.forEach((el, i) => {
    const done = data.checked.includes(i);
    el.classList.toggle('is-checked', done);
    el.classList.toggle('is-winning', wins.has(i));
    el.setAttribute('aria-pressed', String(done));
    el.setAttribute('aria-label', i === FREE ? 'Brīvā vieta. Atzīmēta automātiski' : `${cards[selected - 1].cells[i]}, ${done ? 'atzīmēts' : 'nav atzīmēts'}`);
    el.querySelector('.cell-check').innerHTML = done ? ICONS.check : '';
  });
  const count = data.checked.length - 1;
  document.querySelector('#progress-number').innerHTML = `${count}<span> / 24</span>`;
  document.querySelector('#progress-label').textContent = lines.length ? `BINGO! ${lines.length} ${lines.length === 1 ? 'līnija' : 'līnijas'}` : 'Līdz uzvarai – pieci vienā līnijā';
  document.querySelector('#progress-fill').style.width = `${count / 24 * 100}%`;
  if (lines.length > previousLineCount) revealVictory(data.name, lines.length);
  previousLineCount = lines.length;
}
function revealVictory(name, count) {
  const el = document.getElementById('victory');
  const nameText = name.trim() ? `${name.trim()}, ` : '';
  document.getElementById('victory-copy').textContent = `${nameText}tev ir ${count} ${count === 1 ? 'pilna BINGO līnija' : 'pilnas BINGO līnijas'}! Parādi rezultātu skolotājam.`;
  el.hidden = false;
  document.body.classList.add('modal-open');
  document.getElementById('victory-done').focus();
  fireConfetti();
}
function hideVictory() {
  document.getElementById('victory').hidden = true;
  document.body.classList.remove('modal-open');
}
function fireConfetti() {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  const palette = ['#ffc86f', '#25a188', '#f08a80', '#476c93', '#f7f2df'];
  for (let i = 0; i < 75; i++) {
    const piece = document.createElement('i');
    piece.style.setProperty('--x', `${Math.random() * 100}vw`);
    piece.style.setProperty('--speed', `${2.4 + Math.random() * 2.4}s`);
    piece.style.setProperty('--delay', `${Math.random() * .7}s`);
    piece.style.setProperty('--spin', `${(Math.random() - .5) * 950}deg`);
    piece.style.backgroundColor = palette[i % palette.length];
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 6500);
}
function render() {
  document.body.classList.remove('modal-open');
  if (selected) {
    try { localStorage.setItem(`${STORE}-last`, String(selected)); } catch {}
    renderCard();
    document.title = `Kartīte #${num(selected)} | Prezentāciju BINGO`;
  } else {
    renderHome();
    document.title = 'Prezentāciju BINGO | Izvēlies kartīti';
  }
}
window.addEventListener('popstate', () => { selected = getCardFromUrl(); render(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('victory') && !document.getElementById('victory').hidden) hideVictory(); });
render();

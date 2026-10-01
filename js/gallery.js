/* ============================================================
   画廊页：作品集卡墙（默认）/ 分类与收藏的作品流（兜底视图）
   - 全部 / 手绘 / 摄影 / 插画 / 涂鸦：筛的是「作品集」
   - 我的收藏 / 自定义分类：筛的是「单幅作品」
   + 搜索 / 排序 + Flip 平滑重排 + 聚光灯/倾斜悬停
   ============================================================ */

const G = window.gsap;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (G && window.Flip) G.registerPlugin(Flip);
if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

/* 作品集自带的四个分类；这四类之外（收藏 / 自定义分类）走作品流 */
const SET_CATS = ['手绘', '摄影', '插画', '涂鸦'];

let curCat = qs('cat') || '全部';
let curQ = qs('q') || '';

function worksMode() {
  return curCat === '__fav' || (curCat !== '全部' && !SET_CATS.includes(curCat));
}

/* ---------- 分类胶囊 ---------- */
(function () {
  const row = document.getElementById('chipRow');
  if (!row) return;
  if (curCat !== '__fav' && curCat !== '全部' && !getCats().includes(curCat)) curCat = '全部';
  const cats = ['全部', ...getCats(), '__fav'];
  row.innerHTML = cats.map(c => {
    const label = c === '__fav' ? '❤ 我的收藏' : esc(c);
    return `<button class="chip ${c === curCat ? 'active' : ''}" data-cat="${esc(c)}">${label}</button>`;
  }).join('');
  row.addEventListener('click', e => {
    const t = e.target.closest('.chip');
    if (t) setCat(t.dataset.cat);
  });
})();

function setCat(c) {
  curCat = c;
  document.querySelectorAll('#chipRow .chip').forEach(t =>
    t.classList.toggle('active', t.dataset.cat === c));
  applyFilters();
}

/* ---------- 过滤 + 渲染（Flip 平滑重排） ---------- */
function applyFilters() {
  curQ = document.getElementById('qInput').value.trim();
  const q = curQ.toLowerCase();
  const sort = document.getElementById('sortSel').value;
  const grid = document.getElementById('grid');
  grid.classList.toggle('sets', !worksMode());

  if (!worksMode()) {
    /* 作品集卡墙 */
    const list = getSets().map(s => {
      const ws = worksOfSet(s.id);
      return {
        s, ws, n: ws.length,
        cover: getWork(s.cover) || ws[0],
        likes: ws.reduce((n, w) => n + w.likes, 0),
        latest: ws.reduce((t, w) => (w.ts > t ? w.ts : t), ''),
      };
    }).filter(o =>
      (curCat === '全部' || o.s.cat === curCat) &&
      (!q || (o.s.name + ' ' + o.s.cat).toLowerCase().includes(q))
    ).sort((a, b) => sort === 'hot' ? b.likes - a.likes : (b.latest < a.latest ? -1 : 1));

    document.getElementById('countLine').textContent =
      `共 ${list.length} 个作品集 · ${list.reduce((n, o) => n + o.n, 0)} 幅作品` +
      (curCat !== '全部' ? ' · ' + curCat : '');

    const oldCards = [...grid.querySelectorAll('.set-card, .art-card')];
    const state = G && window.Flip ? Flip.getState(oldCards) : null;
    const isNew = firstRender;

    grid.innerHTML = list.map(o => `
      <a class="set-card" href="set.html?id=${o.s.id}" data-tilt>
        <div class="pic">
          <img src="${o.cover.src}" alt="${esc(o.s.name)}" loading="lazy">
          <span class="shade"></span>
          ${o.s.cat ? `<span class="sticker amber set-cat">${esc(o.s.cat)}</span>` : ''}
          <span class="set-count">${o.n} 幅</span>
        </div>
        <div class="info">
          <div class="t">${esc(o.s.name)}</div>
          <div class="meta">
            <span>朱涵书</span>
            <span class="likes">❤ ${o.likes}</span>
          </div>
        </div>
      </a>`).join('');

    if (!list.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <div class="big">( ´ ▽ ｀ )</div>
        <p>这里还空着，换个分类或关键词试试</p>
      </div>`;
    }
    flipIn(grid, state, oldCards, isNew);
    return;
  }

  /* 作品流（收藏 / 自定义分类） */
  let list = getWorks().filter(w => {
    if (curCat === '__fav') return isFav(w.id);
    if (w.cat !== curCat) return false;
    return true;
  }).filter(w => {
    if (!q) return true;
    return (w.title + w.author + w.tags.join(' ')).toLowerCase().includes(q);
  });
  list.sort((a, b) => sort === 'hot' ? b.likes - a.likes : (b.ts < a.ts ? -1 : 1));

  const label = curCat === '__fav' ? '我的收藏' : curCat;
  document.getElementById('countLine').textContent = `共 ${list.length} 幅作品 · ${label}`;

  const oldCards = [...grid.querySelectorAll('.set-card, .art-card')];
  const state = G && window.Flip ? Flip.getState(oldCards) : null;
  const isNew = firstRender;

  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="big">( ´ ▽ ｀ )</div>
      <p>${curCat === '__fav' ? '还没收藏作品，去作品集里挑几幅喜欢的' : '这里还空着，换个分类或关键词试试'}</p>
    </div>`;
    firstRender = false;
    return;
  }

  grid.innerHTML = list.map(w => `
    <a class="art-card" href="artwork.html?id=${w.id}" data-tilt>
      <div class="pic">
        <img src="${w.src}" alt="${esc(w.title)}" loading="lazy">
        ${w.layers.length ? `<span class="sticker amber layer-badge">+${w.layers.length} 层</span>` : ''}
      </div>
      <div class="info">
        <div class="t">${esc(w.title)}</div>
        <div class="meta">
          <span>${esc(w.author)}</span>
          <span class="tag">${esc(w.cat)}</span>
          <span class="likes">❤ ${w.likes}</span>
        </div>
      </div>
    </a>`).join('');

  flipIn(grid, state, oldCards, isNew);
}

let firstRender = true;

function flipIn(grid, state, oldCards, isNew) {
  const newCards = [...grid.querySelectorAll('.set-card, .art-card')];
  bindTilt(grid, newCards);
  if (G && window.Flip && state && !REDUCE && !isNew) {
    Flip.from(state, {
      duration: .55, ease: 'power2.inOut', stagger: .015,
      absolute: oldCards.length === newCards.length,
      onEnter: els => G.fromTo(els, { opacity: 0, scale: .86 }, { opacity: 1, scale: 1, duration: .4, ease: 'power2.out' }),
      onLeave: els => G.to(els, { opacity: 0, scale: .9, duration: .3, ease: 'power2.in' }),
    });
  } else if (G && !REDUCE && isNew) {
    G.from(newCards, {
      y: 34, opacity: 0, duration: .7, ease: 'power3.out', stagger: .04,
      scrollTrigger: { trigger: grid, start: 'top 90%', once: true },
    });
  }
  firstRender = false;
}

/* 悬停：3D 倾斜 + 内图缩放（transform 只走 GSAP，保证和 Flip 不打架） */
function bindTilt(grid, cards) {
  if (REDUCE) return;
  grid.onpointermove = e => {
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      if (G) G.to(card, { rotationY: dx * 8, rotationX: -dy * 6, transformPerspective: 900, duration: .4, ease: 'power2.out' });
    });
  };
  grid.onpointerleave = () => {
    cards.forEach(card => { if (G) G.to(card, { rotationY: 0, rotationX: 0, duration: .5, ease: 'power2.out' }); });
  };
}

/* ---------- 初始 ---------- */
document.getElementById('qInput').value = curQ;
applyFilters();
document.getElementById('qInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') applyFilters();
});
/* 边打边筛（220ms 防抖），回车仍可立即筛 */
let qTimer;
document.getElementById('qInput').addEventListener('input', () => {
  clearTimeout(qTimer);
  qTimer = setTimeout(applyFilters, 220);
});

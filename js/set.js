/* ============================================================
   作品集详情页：一集的全部作品陈列（点任意一幅 → 书本从那一页翻开）
   ============================================================ */

const G = window.gsap;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

const setId = qs('id');
const set = getSet(setId);
const grid = document.getElementById('setGrid');

if (!set) {
  document.getElementById('setName').textContent = '没找到这一集';
  document.getElementById('setMeta').textContent = '它可能被删掉了，回画廊看看别的吧。';
  document.getElementById('setOpen').style.display = 'none';
  document.querySelector('.set-hint').style.display = 'none';
  grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
    <div class="big">(・_・;)</div>
    <p>去 <a href="gallery.html">画廊</a> 逛逛别的作品集</p>
  </div>`;
} else {
  const ws = worksOfSet(set.id);
  const cover = getWork(set.cover) || ws[0];

  /* 头部：名字 / 分类 / 作者 · 幅数 · 时间范围 */
  document.title = set.name + ' · AI“涂鸦画廊”';
  document.getElementById('setName').textContent = set.name;
  const catEl = document.getElementById('setCat');
  if (set.cat) { catEl.textContent = set.cat; catEl.hidden = false; }
  const ms = [...new Set(ws.map(w => w.ts.slice(0, 7)))].sort().map(m => m.replace('-', '.'));
  document.getElementById('setMeta').textContent =
    `朱涵书 · 共 ${ws.length} 幅` + (ms.length ? ' · ' + (ms.length > 1 ? ms[0] + ' – ' + ms[ms.length - 1] : ms[0]) : '');
  document.getElementById('setOpen').href = 'artwork.html?id=' + cover.id;

  /* 作品网格 */
  grid.innerHTML = ws.map((w, i) => `
    <a class="art-card" href="artwork.html?id=${w.id}" data-tilt>
      <div class="pic">
        <img src="${w.src}" alt="${esc(w.title)}" loading="${i < 8 ? 'eager' : 'lazy'}">
        <span class="w-no">${String(i + 1).padStart(2, '0')} / ${ws.length}</span>
        ${w.layers.length ? `<span class="sticker amber layer-badge">+${w.layers.length} 层</span>` : ''}
      </div>
      <div class="info">
        <div class="t">${esc(w.title === '未上传' ? '第 ' + (i + 1) + ' 幅' : w.title)}</div>
        <div class="meta">
          <span>${esc(w.author)}</span>
          <span class="likes">❤ ${w.likes}</span>
        </div>
      </div>
    </a>`).join('');

  /* 上一集 / 下一集 */
  const sets = getSets();
  const idx = sets.findIndex(s => s.id === set.id);
  const prev = sets[(idx - 1 + sets.length) % sets.length];
  const next = sets[(idx + 1) % sets.length];
  document.getElementById('setPager').innerHTML = `
    <a class="sp-l" href="set.html?id=${prev.id}"><span class="sp-k">PREV · 上一集</span><span class="sp-v">← ${esc(prev.name)}</span></a>
    <a class="sp-r" href="set.html?id=${next.id}"><span class="sp-k">NEXT · 下一集</span><span class="sp-v">${esc(next.name)} →</span></a>`;

  /* 入场：卡片依次浮起 */
  if (G && !REDUCE) {
    G.from(grid.querySelectorAll('.art-card'), {
      y: 30, opacity: 0, duration: .65, ease: 'power3.out', stagger: .035,
      scrollTrigger: { trigger: grid, start: 'top 92%', once: true },
    });
  }
}

/* 悬停：轻微倾斜 */
if (G && !REDUCE) {
  const cards = [...grid.querySelectorAll('.art-card')];
  grid.onpointermove = e => {
    cards.forEach(card => {
      const r = card.getBoundingClientRect();
      if (e.clientX < r.left - 80 || e.clientX > r.right + 80) return;
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      G.to(card, { rotationY: dx * 8, rotationX: -dy * 6, transformPerspective: 900, duration: .4, ease: 'power2.out' });
    });
  };
  grid.onpointerleave = () => {
    cards.forEach(card => G.to(card, { rotationY: 0, rotationX: 0, duration: .5, ease: 'power2.out' }));
  };
}

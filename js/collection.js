/* ============================================================
   收藏夹 + 拼贴画布：收藏列表 / 拖拽摆放 / 缩放 / 布局保存
   ============================================================ */

const collageBox = document.getElementById('collageCanvas');
let collage = getCollage();
let zTop = 100;

function favWorks() {
  return getFavs().map(getWork).filter(Boolean);
}

/* ---------- 收藏列表 ---------- */
function renderFavList() {
  const grid = document.getElementById('favGrid');
  const list = favWorks();
  if (!list.length) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
      <div class="big">( ´ ▽ ｀ )</div>
      <p>还没收藏作品。<a href="gallery.html" style="color:var(--amber)">去画廊逛逛 →</a></p>
    </div>`;
    return;
  }
  grid.innerHTML = list.map(w => `
    <div class="fav-card">
      <a href="artwork.html?id=${w.id}">
        <div class="pic"><img src="${w.src}" alt="${esc(w.title)}" loading="lazy"></div>
        <div class="info">
          <div class="t">${esc(w.title)}</div>
          <div class="meta">${esc(w.author)} · ❤ ${w.likes}</div>
        </div>
      </a>
      <div class="ops">
        <button class="btn small" onclick="addToCollage('${w.id}')">加入拼贴</button>
        <button class="btn-ghost small" onclick="unfav('${w.id}')">取消收藏</button>
      </div>
    </div>`).join('');
}

function unfav(id) {
  toggleFav(id);
  /* 收藏移除了，拼贴里也撤掉 */
  collage.items = collage.items.filter(it => it.id !== id);
  saveCollage(collage);
  renderAll();
  toast('已取消收藏');
}

/* ---------- 素材条：内置素材（人人可用）+ 我的收藏 ---------- */
function renderPalette() {
  const mats = document.getElementById('paletteMats');
  mats.innerHTML = getMaterials().map(m => `
      <div class="p-item" onclick="addToCollage('${m.id}')" title="素材">
        <img src="${m.src}" alt="">
        <div class="plus">＋</div>
      </div>`).join('');

  const p = document.getElementById('palette');
  const list = favWorks();
  p.innerHTML = list.length
    ? list.map(w => `
      <div class="p-item" onclick="addToCollage('${w.id}')" title="${esc(w.title)}">
        <img src="${w.src}" alt="${esc(w.title)}">
        <div class="plus">＋</div>
      </div>`).join('')
    : '<p class="palette-hint">收藏几幅作品，这里就会出现你的素材。</p>';
}

/* ---------- 拼贴画布 ---------- */
function addToCollage(id) {
  if (!getMaterial(id) && !getFavs().includes(id)) return toast('先收藏才能加入拼贴');
  if (collage.items.some(it => it.id === id)) return toast('这个已经在画布上了');
  collage.items.push({
    id,
    x: 0.2 + Math.random() * 0.5,
    y: 0.15 + Math.random() * 0.4,
    s: 1,
    z: ++zTop,
  });
  saveCollage(collage);
  renderCollage();
  toast('已加入画布，拖动摆放吧');
}

function renderCollage() {
  collageBox.innerHTML = '';
  /* 素材一直保留；作品得还在收藏里 */
  collage.items = collage.items.filter(it => {
    const a = resolveArt(it.id);
    return a && (getMaterial(it.id) || getFavs().includes(it.id));
  });
  collage.items.forEach(it => {
    const a = resolveArt(it.id);
    if (!a) return;
    const el = document.createElement('div');
    el.className = 'col-item';
    el.style.left = (it.x * 100) + '%';
    el.style.top = (it.y * 100) + '%';
    el.style.zIndex = it.z;
    const label = a.title || '素材';
    el.innerHTML = `
      <button class="del" title="移出画布">✕</button>
      <img src="${a.src}" alt="${esc(label)}" style="--r:${a.ratio};--s:${it.s}">`;
    collageBox.appendChild(el);
    bindItem(el, it, a);
  });
  if (!collage.items.length) {
    collageBox.innerHTML = `<div class="empty" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
      <div><div class="big">🖼</div><p>画布空着 —— 点下方素材加进来</p></div></div>`;
  }
}

function bindItem(el, it, w) {
  const del = el.querySelector('.del');
  del.addEventListener('click', e => {
    e.stopPropagation();
    collage.items = collage.items.filter(x => x.id !== it.id);
    saveCollage(collage);
    renderCollage();
  });

  /* 拖动 */
  el.addEventListener('pointerdown', e => {
    if (e.target === del) return;
    e.preventDefault();
    it.z = ++zTop;
    el.style.zIndex = it.z;
    const rect = collageBox.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offX = e.clientX - elRect.left;
    const offY = e.clientY - elRect.top;
    el.setPointerCapture(e.pointerId);
    const move = ev => {
      const x = ev.clientX - rect.left - offX;
      const y = ev.clientY - rect.top - offY;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };
    const up = () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      const er = el.getBoundingClientRect();
      it.x = Math.min(1, Math.max(0, (er.left - rect.left) / rect.width));
      it.y = Math.min(1, Math.max(0, (er.top - rect.top) / rect.height));
      saveCollage(collage);
      /* 转回百分比定位 */
      el.style.left = (it.x * 100) + '%';
      el.style.top = (it.y * 100) + '%';
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });

  /* 滚轮缩放 */
  el.addEventListener('wheel', e => {
    e.preventDefault();
    it.s = Math.min(2.6, Math.max(0.35, it.s + (e.deltaY < 0 ? 0.1 : -0.1)));
    el.querySelector('img').style.setProperty('--s', it.s);
    saveCollage(collage);
  }, { passive: false });
}

function saveLayout() {
  saveCollage(collage);
  toast('布局已保存（下次打开还在）');
}

function clearLayout() {
  collage.items = [];
  saveCollage(collage);
  renderCollage();
  toast('画布已清空');
}

function renderAll() {
  renderFavList();
  renderPalette();
  renderCollage();
}

renderAll();

/* ============================================================
   作品页：3D 书本翻页浏览「这一集」的全部作品 + 图层/点赞/收藏/批注/涂鸦
   书页 = 封面 + 每幅作品一张纸；翻页走 GSAP rotateY 折页
   一本书 = 一个作品集（打开的是当前作品所在的那一集）
   ============================================================ */

/* 图标内联（file:// 下 Chromium 拦 CSS 里的 svg 引用，data: 放行） */
const ICO_ERASER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2IiBmaWxsPSJjdXJyZW50Q29sb3IiPjxwYXRoIGQ9Ik0yMjUsODAuNCwxODMuNiwzOWEyNCwyNCwwLDAsMC0zMy45NCwwTDMxLDE1Ny42NmEyNCwyNCwwLDAsMCwwLDMzLjk0bDMwLjA2LDMwLjA2QTgsOCwwLDAsMCw2Ni43NCwyMjRIMjE2YTgsOCwwLDAsMCwwLTE2aC04NC43TDIyNSwxMTQuMzRBMjQsMjQsMCwwLDAsMjI1LDgwLjRaTTEwOC42OCwyMDhINzAuMDVMNDIuMzMsMTgwLjI4YTgsOCwwLDAsMSwwLTExLjMxTDk2LDExNS4zMSwxNDguNjksMTY4Wm0xMDUtMTA1TDE2MCwxNTYuNjksMTA3LjMxLDEwNCwxNjEsNTAuMzRhOCw4LDAsMCwxLDExLjMyLDBsNDEuMzgsNDEuMzhhOCw4LDAsMCwxLDAsMTEuMzFaIi8+PC9zdmc+';
const ICO_IMAGES = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2IiBmaWxsPSJjdXJyZW50Q29sb3IiPjxwYXRoIGQ9Ik0yMTYsNDBINzJBMTYsMTYsMCwwLDAsNTYsNTZWNzJINDBBMTYsMTYsMCwwLDAsMjQsODhWMjAwYTE2LDE2LDAsMCwwLDE2LDE2SDE4NGExNiwxNiwwLDAsMCwxNi0xNlYxODRoMTZhMTYsMTYsMCwwLDAsMTYtMTZWNTZBMTYsMTYsMCwwLDAsMjE2LDQwWk03Miw1NkgyMTZ2NjIuNzVsLTEwLjA3LTEwLjA2YTE2LDE2LDAsMCwwLTIyLjYzLDBsLTIwLDIwLTQ0LTQ0YTE2LDE2LDAsMCwwLTIyLjYyLDBMNzIsMTA5LjM3Wk0xODQsMjAwSDQwVjg4SDU2djgwYTE2LDE2LDAsMCwwLDE2LDE2SDE4NFptMzItMzJINzJWMTMybDM2LTM2LDQ5LjY2LDQ5LjY2YTgsOCwwLDAsMCwxMS4zMSwwTDE5NC42MywxMjAsMjE2LDE0MS4zOFYxNjhaTTE2MCw4NGExMiwxMiwwLDEsMSwxMiwxMkExMiwxMiwwLDAsMSwxNjAsODRaIi8+PC9zdmc+';

const G = window.gsap;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const target = getWork(qs('id')) || getWorks()[0];
const SETID = target ? (target.set || (isUserWork(target) ? 'new' : null)) : null;
const SET = SETID ? getSet(SETID) : null;
let SET_WORKS = SETID ? worksOfSet(SETID) : [];
if (!SET_WORKS.length && target) SET_WORKS = [target];
const wantId = target ? target.id : '';
let startIdx = SET_WORKS.findIndex(w => w.id === wantId);
if (startIdx < 0) startIdx = 0;

/* 书页下标：0 = 封面，1..N = 第 i 幅作品 */
let cur = startIdx + 1;
const N = SET_WORKS.length;
const flipped = new Array(N + 1).fill(false); /* sheet i 是否已翻过去 */

const book = document.getElementById('book');
const stage = document.getElementById('bookStage');

/* 顶栏返回链接指回这一集；书名跟着这一集 */
const backLink = document.getElementById('backLink');
if (backLink) backLink.href = SET ? 'set.html?id=' + SET.id : 'gallery.html';
const setName = SET ? SET.name : '大家的新作';
if (target) document.title = setName + ' · AI“涂鸦画廊”';
/* 没有名字的页面（P1、IMG_1234…）在书里按「第 N 幅」称呼 */
function dispName(w, idx) {
  return w.title === '未上传' ? '第 ' + idx + ' 幅' : w.title;
}

/* ---------- 建书 ---------- */
function pageHTML(w, i) {
  const layers = w.layers.filter(l => l.visible)
    .map(l => `<img src="${l.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(l.svg) : l.dataUrl}" alt="${esc(l.author)} 的图层">`)
    .join('');
  return `
    <div class="page" id="page${i}">
      <div class="mat" data-ratio="${w.ratio}"><img class="base" src="${w.src}" alt="${esc(dispName(w, i))}"><div class="layers">${layers}</div></div>
      <div class="cap"><div class="t">${esc(dispName(w, i))}</div><div class="m">${esc(w.author)} · ${esc(w.cat)}</div></div>
      <div class="page-no">${i}</div>
    </div>`;
}

/* 页面内按作品比例装裱（mat 与作品同比例，图层才能 1:1 对齐） */
function fitBox(ratio, areaW, areaH) {
  let w = areaW, h = w / ratio;
  if (h > areaH) { h = areaH; w = h * ratio; }
  return { w: Math.round(w), h: Math.round(h) };
}

book.innerHTML = `
  <div class="sheet cover" id="sheet0">
    <div class="face front">
      <div class="c-en">MUR DE GRAFFITI</div>
      <div class="c-t"${setName.length > 7 ? ' style="font-size:clamp(24px,3.4vw,34px)"' : ''}>${esc(setName)}<br>作品集</div>
      <div class="c-sub">${N} 幅 · 每一页都欢迎你再添一笔</div>
    </div>
    <div class="face back"></div>
  </div>` +
  SET_WORKS.map((w, i) => `
    <div class="sheet" id="sheet${i + 1}">
      <div class="face front">${pageHTML(w, i + 1)}</div>
      <div class="face back"></div>
    </div>`).join('');

/* ---------- 书体尺寸 + 每页装裱 ---------- */
function sizeBook() {
  const rect = stage.getBoundingClientRect();
  /* 高度受舞台高约束，宽度受舞台宽约束（手机上一列时书不超出屏宽，两侧留出翻页键） */
  const h = Math.max(340, Math.min(820, rect.height * 0.94, (rect.width - 72) / 0.72));
  const w = h * 0.72;
  stage.style.setProperty('--bw', w + 'px');
  stage.style.setProperty('--bh', h + 'px');
  /* 每页 mat 按作品比例装裱：横图在竖页里上下留白，竖图左右留白 */
  for (let i = 1; i <= N; i++) {
    const page = document.getElementById('page' + i);
    if (!page) continue;
    const mat = page.querySelector('.mat');
    const r = parseFloat(mat.dataset.ratio) || 3 / 4;
    const avW = w * 0.82;                 /* 左右 9% 页边距 */
    const avH = h * 0.74;                 /* 上方 7% + 下方图注/页码 */
    const b = fitBox(r, avW, avH);
    mat.style.width = b.w + 'px';
    mat.style.height = b.h + 'px';
  }
}
sizeBook();
window.addEventListener('resize', sizeBook);

/* ---------- 层级与翻页状态 ---------- */
function layZ() {
  for (let i = 0; i <= N; i++) {
    const s = document.getElementById('sheet' + i);
    s.style.zIndex = flipped[i] ? i + 1 : (N - i) + 10;
  }
}

function setFlipped(i, v) {
  flipped[i] = v;
  const s = document.getElementById('sheet' + i);
  s.style.transform = `rotateY(${v ? -180 : 0}deg)`;
  layZ();
}

/* 翻一张纸（dir: 1 向后翻 / -1 翻回来），返回 GSAP tween */
function flipSheet(i, dir, dur) {
  const s = document.getElementById('sheet' + i);
  const from = flipped[i] ? -180 : 0;
  flipped[i] = dir === 1;
  layZ();
  s.classList.add('flipping');
  const t = G.to(s, {
    rotationY: dir === 1 ? -180 : 0,
    duration: dur || 1.05,
    ease: 'power2.inOut',
    onComplete: () => s.classList.remove('flipping'),
  });
  return t;
}

/* ---------- 翻页控制 ---------- */
let busy = false;

function flipNext() {
  if (busy || cur >= N) return;
  busy = true;
  flipSheet(cur, 1).eventCallback('onComplete', () => { busy = false; cur++; refreshUI(); });
}
function flipPrev() {
  if (busy || cur <= 1) return;
  busy = true;
  flipSheet(cur - 1, -1).eventCallback('onComplete', () => { busy = false; cur--; refreshUI(); });
}

/* 跳页：整书瞬间重置（带短暂淡出，避免生硬） */
function jumpTo(i) {
  if (i === cur || busy || i < 1 || i > N) return;
  if (REDUCE || !G) {
    for (let k = 0; k <= N; k++) setFlipped(k, k < i);
    cur = i; refreshUI();
    return;
  }
  busy = true;
  const tl = G.timeline({
    onComplete: () => {
      for (let k = 0; k <= N; k++) setFlipped(k, k < i);
      cur = i; refreshUI(); busy = false;
    },
  });
  tl.to(book, { opacity: 0, scale: .96, duration: .28, ease: 'power2.in' })
    .set(book, { opacity: 1, scale: 1 });
}

/* 打开即停在目标页：不做任何自动翻页，翻页完全交给用户（按钮/键盘/书签） */
function initBook() {
  for (let k = 0; k < cur; k++) setFlipped(k, true);
  refreshUI();
}

/* ---------- 当前页信息 ---------- */
function curWork() { return SET_WORKS[cur - 1]; }

function refreshUI() {
  const w = curWork();
  document.getElementById('curTitle').textContent =
    w ? (w.title === '未上传' ? setName + ' · 第 ' + cur + ' 幅' : w.title) : '';
  document.getElementById('curMeta').textContent =
    w ? `${w.cat} · ❤ ${w.likes} · 第 ${cur} / ${N} 幅` : '';
  document.getElementById('btnPrev').disabled = cur <= 1;
  document.getElementById('btnNext').disabled = cur >= N;
  document.querySelectorAll('#bookStrip button').forEach(b => b.classList.toggle('on', +b.dataset.i === cur));
  if (w) renderPanel(w);
}

/* ---------- 信息面板 ---------- */
function renderPanel(w) {
  const no = SET_WORKS.indexOf(w) + 1;
  document.getElementById('artTitle').textContent = dispName(w, no);
  document.getElementById('authorAvatar').textContent = w.author.charAt(0);
  document.getElementById('authorName').textContent = w.author;
  document.getElementById('artTime').textContent = w.ts + ' · 第 ' + no + ' 幅 / ' + N;
  document.getElementById('tagRow').innerHTML = w.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('');

  const liked = isLiked(w.id);
  document.getElementById('likeCount').textContent = w.likes + (liked ? 1 : 0);
  document.getElementById('likeBtn').classList.toggle('liked', liked);
  const fav = isFav(w.id);
  document.getElementById('favBtn').classList.toggle('liked', fav);
  document.getElementById('favIcon').style.setProperty('--ico', `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2IiBmaWxsPSJjdXJyZW50Q29sb3IiPjxwYXRoIGQ9Ik0xODQsMzJINzJBMTYsMTYsMCwwLDAsNTYsNDhWMjI0YTgsOCwwLDAsMCwxMi4yNCw2Ljc4TDEyOCwxOTMuNDNsNTkuNzcsMzcuMzVBOCw4LDAsMCwwLDIwMCwyMjRWNDhBMTYsMTYsMCwwLDAsMTg0LDMyWm0wLDE3Ny41Ny01MS43Ny0zMi4zNWE4LDgsMCwwLDAtOC40OCwwTDcyLDIwOS41N1Y0OEgxODRaIi8+PC9zdmc+')`);
  document.getElementById('favText').textContent = fav ? '已收藏' : '收藏';

  /* 删除入口只给自己发布的作品（示例/他人作品不可删） */
  const ownRow = document.getElementById('ownRow');
  ownRow.hidden = !isUserWork(w);
  const delBtn = document.getElementById('delWorkBtn');
  delBtn.textContent = '删除这幅作品';
  delBtn.classList.remove('danger');
  delete delBtn.dataset.arm;

  renderLayers(w);
  renderComments(w);
}

/* 删除自己发布的作品：两段式确认；删完回「大家的新作」，最后一幅删掉就回画廊 */
function askDelWork(btn) {
  if (!btn.dataset.arm) {
    btn.dataset.arm = '1';
    btn.textContent = '确认删除？';
    btn.classList.add('danger');
    return;
  }
  if (!removeWork(curWork().id)) return;
  toast('已删除这幅作品');
  setTimeout(() => {
    location.href = worksOfSet('new').length ? 'set.html?id=new' : 'gallery.html';
  }, 700);
}

function renderLayers(w) {
  const box = document.getElementById('layerList');
  if (!w.layers.length) {
    box.innerHTML = '<div class="layer-empty">还没有二创图层。点上面「画一笔」，你就是第一层。</div>';
    return;
  }
  box.innerHTML = w.layers.map(l => {
    const off = !l.visible;
    const del = canRemoveLayer(l)
      ? `<button class="lr-btn lr-del" onclick="askDelLayer('${l.id}', this)">删除</button>` : '';
    return `
    <div class="layer-row ${off ? 'off' : ''}">
      <div class="lr-top">
        <button class="eye" onclick="toggleLayerVis('${l.id}')" title="开关图层">
          <span class="ico" style="--ico:url('${off ? ICO_ERASER : ICO_IMAGES}')"></span>
        </button>
        <span class="lr-who">${esc(l.author)}</span>
        <span class="lr-when">${timeAgo(l.ts)}</span>
        <button class="lr-btn ${isLayerLiked(l.id) ? 'liked' : ''}" onclick="likeLayer('${l.id}')">❤ ${layerLikeCount(w, l)}</button>
        <button class="lr-btn" onclick="toggleLayerCmts('${l.id}')">批注</button>
        ${del}
      </div>
      <div class="layer-cmts" id="lcmts-${l.id}">
        ${l.comments.map(c => `<div class="c-item"><b>${esc(c.u)}</b>：${esc(c.t)}</div>`).join('')}
        <div class="c-add">
          <input id="lcin-${l.id}" placeholder="给这层写批注">
          <button class="btn small" onclick="sendLayerComment('${l.id}')">发</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderComments(w) {
  document.getElementById('commentList').innerHTML = w.comments.length
    ? w.comments.map(c => `<div class="c-item"><b>${esc(c.u)}</b><div class="ct">${esc(c.t)}</div><div class="when">${timeAgo(c.ts)}</div></div>`).join('')
    : '<div class="layer-empty">还没有批注，说点什么。</div>';
}

/* ---------- 面板互动 ---------- */
function toggleLayerVis(id) {
  const w = curWork();
  toggleLayerVisible(w.id, id);
  syncPageLayers();
  renderLayers(w);
}
function syncPageLayers() {
  const w = curWork();
  const page = document.getElementById('page' + cur);
  page.querySelector('.layers').innerHTML = w.layers.filter(l => l.visible)
    .map(l => `<img src="${l.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(l.svg) : l.dataUrl}" alt="">`).join('');
}
function likeLayer(id) {
  toggleLayerLike(curWork().id, id);
  renderLayers(curWork());
}
function toggleLayerCmts(id) {
  document.getElementById('lcmts-' + id).classList.toggle('open');
}
function sendLayerComment(id) {
  const input = document.getElementById('lcin-' + id);
  const text = input.value.trim();
  if (!text) return toast('写点内容再发');
  addLayerComment(curWork().id, id, text, getUser().name);
  input.value = '';
  renderLayers(curWork());
}
/* 删除自己画的图层：两段式确认，书页上的图层同步消失 */
function askDelLayer(id, btn) {
  if (!btn.dataset.arm) {
    btn.dataset.arm = '1';
    btn.textContent = '确认删除？';
    btn.classList.add('armed');
    return;
  }
  if (!removeLayer(curWork().id, id)) return;
  syncPageLayers();
  renderLayers(curWork());
  toast('已删除这一层');
}
function doLike(e) {
  if (!getUser()) return mustLogin();
  const w = curWork();
  const r = toggleLike(w.id);
  document.getElementById('likeCount').textContent = r.count;
  document.getElementById('likeBtn').classList.toggle('liked', r.liked);
  if (r.liked) heartBurst(e.clientX, e.clientY);
  document.getElementById('curMeta').textContent = `${w.cat} · ❤ ${w.likes}`;
}
function doFav() {
  if (!getUser()) return mustLogin();
  const w = curWork();
  const r = toggleFav(w.id);
  document.getElementById('favBtn').classList.toggle('liked', r.fav);
  document.getElementById('favText').textContent = r.fav ? '已收藏' : '收藏';
  toast(r.fav ? '已加入收藏' : '已取消收藏');
}
function sendComment() {
  if (!getUser()) return mustLogin();
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text) return toast('写点内容再发');
  addComment(curWork().id, text, getUser().name);
  input.value = '';
  renderComments(curWork());
}

/* 按住看原图（隐藏所有图层） */
function setCompare(on) {
  document.getElementById('page' + cur).classList.toggle('hide-layers', on);
}

/* ---------- 缩略图条 ---------- */
(function () {
  const strip = document.getElementById('bookStrip');
  const cov = document.createElement('button');
  cov.dataset.i = 0;
  cov.innerHTML = '<span class="cov">封面</span>';
  cov.onclick = () => jumpTo(1);
  strip.appendChild(cov);
  SET_WORKS.forEach((w, i) => {
    const b = document.createElement('button');
    b.dataset.i = i + 1;
    b.innerHTML = `<img src="${w.src}" alt="${esc(w.title)}" loading="lazy">`;
    b.onclick = () => jumpTo(i + 1);
    strip.appendChild(b);
  });
})();

/* ---------- 键盘 / 点击翻页 ---------- */
document.addEventListener('keydown', e => {
  if (overlay.classList.contains('open')) {
    if (e.key === 'Escape') {
      if (!palPop.hidden) closePal(); else closeDraw();   /* Esc 先收色板，再退出画布 */
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) redoStroke(); else undoStroke();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redoStroke(); return; }
    return;
  }
  if (e.key === 'ArrowRight') flipNext();
  if (e.key === 'ArrowLeft') flipPrev();
});
stage.addEventListener('click', e => {
  if (e.target.closest('.book-ctrl')) return;
  const r = book.getBoundingClientRect();
  if (e.clientX > r.left + r.width / 2) flipNext(); else flipPrev();
});

/* 书本轻微跟随鼠标（不干扰翻页） */
if (!REDUCE && G) {
  const rx = G.quickTo(book, 'rotationX', { duration: .8, ease: 'power2.out' });
  const ry = G.quickTo(book, 'rotationY', { duration: .8, ease: 'power2.out' });
  stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    const base = -13; /* 静态摆放角 */
    ry(base + ((e.clientX - r.left) / r.width - .5) * 12);
    rx(5 + ((e.clientY - r.top) / r.height - .5) * -8);
  });
  stage.addEventListener('pointerleave', () => { ry(-13); rx(5); });
}

/* ============================================================
   全屏涂鸦画布
   原图打底 + 透明画布；7 种画笔（铅笔/马克笔/蜡笔/喷漆/荧光笔/星光/橡皮）、
   40 色大色板 + 自定义取色、粗细滑杆（每支笔记住各自粗细）、撤销/重做；
   颗粒类画笔用「种子随机」重放——撤销重做后的画面和画的时候逐点一致
   ============================================================ */
const overlay = document.getElementById('drawOverlay');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
const drawBox = document.getElementById('drawBox');
const brushCursor = document.getElementById('brushCursor');

/* 已完成的笔画落在离屏画布上，正在画的一笔整体重放：
   半透明画笔（马克笔/荧光笔）不会在笔段接缝处叠出深色斑点 */
const off = document.createElement('canvas');
const offCtx = off.getContext('2d');

const BRUSHES = {
  pencil:    { name: '铅笔',   size: 4 },
  marker:    { name: '马克笔', size: 14 },
  crayon:    { name: '蜡笔',   size: 12 },
  spray:     { name: '喷漆',   size: 26 },
  highlight: { name: '荧光笔', size: 24 },
  sparkle:   { name: '星光',   size: 14 },
  eraser:    { name: '橡皮',   size: 20 },
};

/* 大色板：灰阶 / 红粉 / 橙黄棕 / 绿青 / 蓝紫 五组（含 v5 主色） */
const PALETTE = [
  '#FFFFFF', '#F3D1CA', '#C9C0D4', '#8E86A3', '#4A4463', '#262040', '#171327', '#000000',
  '#FFE3EA', '#FF9DB8', '#FF6FA5', '#E82E4F', '#C2183C', '#A8507E', '#7C1F3A', '#4E1122',
  '#FFF3C4', '#FFE066', '#F5A93B', '#FF8B3D', '#E39B6B', '#B4744A', '#7A4A2B', '#4A2B14',
  '#DCF7C4', '#9BE06E', '#46C168', '#1E9E6A', '#0E6E52', '#23E8FF', '#2BB3D9', '#14607F',
  '#DCE4FF', '#9AB7FF', '#4C7DFF', '#2E4FE8', '#9A7FBC', '#6E5AA2', '#3A2F6E', '#221A45',
];

let strokes = [];              /* 已完成的笔画 */
let history = [[]], hi = 0;    /* 撤销/重做快照：每落一笔存一张，空画布是第 0 张 */
let curStroke = null;          /* 正在画的一笔 */
let drawing = false;
let brushSizes = {};           /* 每支笔记住自己的粗细 */
let lastPaint = 'pencil';      /* 选了橡皮再点颜色时切回的笔 */
let pen = { brush: 'pencil', color: '#E82E4F', size: BRUSHES.pencil.size };

/* 种子随机（mulberry32）：同一笔重放多少次，颗粒落点都一样 */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* 喷漆的一撮雾点 */
function sprayDot(c, rnd, x, y, R, n) {
  for (let k = 0; k < n; k++) {
    const ang = rnd() * 6.28318, rr = Math.sqrt(rnd()) * R;
    c.beginPath();
    c.arc(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, .5 + rnd() * 1.5, 0, 7);
    c.fill();
  }
}

/* 把一笔画到任意 2D 上下文（离屏重建 / 实时重放 / 提交共用同一套画法） */
function renderStroke(c, s) {
  const pts = s.pts;
  c.save();
  if (s.brush === 'eraser') c.globalCompositeOperation = 'destination-out';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  if (s.brush === 'spray') {
    /* 喷漆：沿笔迹甩出细雾点 */
    const rnd = seeded(s.seed);
    const R = Math.max(7, s.size * .85);
    c.fillStyle = s.color;
    c.globalAlpha = .2;
    if (pts.length === 1) sprayDot(c, rnd, pts[0].x, pts[0].y, R, 34);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(2, Math.min(60, Math.round(d / 1.1) + 3));
      for (let k = 0; k < n; k++) {
        sprayDot(c, rnd, a.x + (b.x - a.x) * rnd(), a.y + (b.y - a.y) * rnd(), R, 1);
      }
    }
  } else if (s.brush === 'crayon') {
    /* 蜡笔：带缝隙的颗粒涂鸦 */
    const rnd = seeded(s.seed);
    const r0 = Math.max(1.6, s.size * .38);
    c.fillStyle = s.color;
    c.globalAlpha = .34;
    if (pts.length === 1) {
      for (let k = 0; k < 18; k++) {
        const ang = rnd() * 6.28318, rr = Math.sqrt(rnd()) * s.size * .5;
        c.beginPath(); c.arc(pts[0].x + Math.cos(ang) * rr, pts[0].y + Math.sin(ang) * rr, r0 * (.5 + rnd() * .6), 0, 7); c.fill();
      }
    }
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.min(500, Math.ceil(d / 1.2)));
      for (let k = 0; k < n; k++) {
        const u = rnd(), jx = (rnd() - .5) * s.size * .55, jy = (rnd() - .5) * s.size * .55;
        const rad = r0 * (.4 + rnd() * .55), skip = rnd() < .18;
        if (skip) continue;
        c.beginPath(); c.arc(a.x + (b.x - a.x) * u + jx, a.y + (b.y - a.y) * u + jy, rad, 0, 7); c.fill();
      }
    }
  } else if (s.brush === 'sparkle') {
    /* 星光：沿笔迹撒四角小星星 */
    const rnd = seeded(s.seed);
    c.fillStyle = s.color;
    const step = Math.max(9, s.size * 1.5);
    const star = (x, y) => {
      const L = s.size * (.55 + rnd() * .8), rot = rnd() * 6.28318, al = .6 + rnd() * .4;
      const k = L * .2;
      c.globalAlpha = al;
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      c.beginPath();
      c.moveTo(0, -L); c.lineTo(k, -k); c.lineTo(L, 0); c.lineTo(k, k);
      c.lineTo(0, L); c.lineTo(-k, k); c.lineTo(-L, 0); c.lineTo(-k, -k);
      c.closePath();
      c.fill();
      c.restore();
    };
    star(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.min(6, Math.round(d / step)));
      for (let k = 1; k <= n; k++) {
        const u = k / n;
        star(a.x + (b.x - a.x) * u + (rnd() - .5) * step, a.y + (b.y - a.y) * u + (rnd() - .5) * step);
      }
    }
  } else {
    /* 铅笔 / 马克笔 / 荧光笔 / 橡皮：整条路径一次成笔（一笔之内自交处不叠色） */
    c.globalAlpha = s.brush === 'marker' ? .5 : s.brush === 'highlight' ? .3 : 1;
    c.strokeStyle = s.color;
    c.fillStyle = s.color;
    c.lineWidth = s.size;
    if (pts.length === 1) {
      c.beginPath(); c.arc(pts[0].x, pts[0].y, Math.max(1, s.size / 2), 0, 7); c.fill();
    } else {
      c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
      c.stroke();
    }
  }
  c.restore();
}

function drawLive() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(off, 0, 0);
  if (curStroke) renderStroke(ctx, curStroke);
}
let liveRaf = 0;
function scheduleLive() {
  if (liveRaf) return;
  liveRaf = requestAnimationFrame(() => { liveRaf = 0; drawLive(); });
}
function rebuild() {
  offCtx.clearRect(0, 0, off.width, off.height);
  strokes.forEach(s => renderStroke(offCtx, s));
  drawLive();
}

function openDraw() {
  if (!getUser()) return mustLogin();
  const w = curWork();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  closePal();

  /* 弹窗可用区域 → 按作品比例定尺寸 → 原图与透明画布同尺寸叠放 */
  const { w: dw, h: dh } = fitBox(w.ratio, window.innerWidth * 0.92, window.innerHeight * 0.7);
  drawBox.style.width = dw + 'px';
  drawBox.style.height = dh + 'px';
  canvas.width = off.width = dw;
  canvas.height = off.height = dh;
  canvas.style.width = dw + 'px';
  canvas.style.height = dh + 'px';

  document.getElementById('drawBaseImg').src = w.src;
  document.getElementById('drawLayers').innerHTML = w.layers.filter(l => l.visible)
    .map(l => `<img src="${l.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(l.svg) : l.dataUrl}" alt="">`).join('');

  strokes = [];
  history = [[]]; hi = 0;
  curStroke = null; drawing = false;
  brushCursor.hidden = true;
  syncUndoUI();
  rebuild();
}
function closeDraw() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  closePal();
  brushCursor.hidden = true;
}

/* ---------- 指针事件：画 + 笔尖指示环 ---------- */
function evPt(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
}
function moveCursor(e) {
  const p = evPt(e);
  const d = Math.max(6, pen.size);
  brushCursor.style.width = d + 'px';
  brushCursor.style.height = d + 'px';
  brushCursor.style.left = p.x + 'px';
  brushCursor.style.top = p.y + 'px';
  brushCursor.hidden = false;
  brushCursor.classList.toggle('erase', pen.brush === 'eraser');
}
canvas.addEventListener('pointerdown', e => {
  if (curStroke) return;
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  drawing = true;
  curStroke = { brush: pen.brush, color: pen.color, size: pen.size, seed: (Math.random() * 2147483647) | 0, pts: [evPt(e)] };
  scheduleLive();
});
canvas.addEventListener('pointermove', e => {
  moveCursor(e);
  if (!drawing || !curStroke) return;
  curStroke.pts.push(evPt(e));
  scheduleLive();
});
function endStroke(e) {
  if (!drawing || !curStroke) return;
  drawing = false;
  strokes.push(curStroke);
  renderStroke(offCtx, curStroke);
  curStroke = null;
  pushHistory();
  drawLive();
  const r = canvas.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) brushCursor.hidden = true;
}
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('pointerleave', () => { if (!drawing) brushCursor.hidden = true; });

/* ---------- 撤销 / 重做 / 清空 ---------- */
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
function syncUndoUI() {
  undoBtn.disabled = hi <= 0;
  redoBtn.disabled = hi >= history.length - 1;
}
function pushHistory() {
  history = history.slice(0, hi + 1);
  history.push(strokes.slice());
  if (history.length > 60) history.shift();
  hi = history.length - 1;
  syncUndoUI();
}
function undoStroke() {
  if (drawing || hi <= 0) return;
  hi--;
  strokes = history[hi].slice();
  rebuild(); syncUndoUI();
}
function redoStroke() {
  if (drawing || hi >= history.length - 1) return;
  hi++;
  strokes = history[hi].slice();
  rebuild(); syncUndoUI();
}
function clearCanvas() {
  if (drawing || !strokes.length) return;
  strokes = [];
  pushHistory();     /* 清空也进历史，撤销/重做能找回来 */
  rebuild();
}

/* ---------- 画笔 / 色板 / 粗细 工具栏 ---------- */
const brushRow = document.getElementById('brushRow');
const colorBtn = document.getElementById('colorBtn');
const colorDot = document.getElementById('colorDot');
const palPop = document.getElementById('palettePop');
const palCurDot = document.getElementById('palCurDot');
const palCurHex = document.getElementById('palCurHex');
const customColor = document.getElementById('customColor');
const sizeRange = document.getElementById('sizeRange');
const sizeVal = document.getElementById('sizeVal');
const brushDot = document.getElementById('brushDot');

function openPal() {
  palPop.hidden = false;
  colorBtn.setAttribute('aria-expanded', 'true');
  /* 默认以颜色按钮为中心展开；手机窄屏上往屏内收边，别探出屏幕 */
  const wrap = colorBtn.closest('.pal-wrap').getBoundingClientRect();
  const pw = palPop.offsetWidth;
  const cx = wrap.left + wrap.width / 2;
  const left = Math.min(Math.max(cx - pw / 2, 8), Math.max(8, window.innerWidth - pw - 8));
  palPop.style.left = (left - wrap.left) + 'px';
  palPop.style.transform = 'none';
}
function closePal() {
  palPop.hidden = true;
  colorBtn.setAttribute('aria-expanded', 'false');
  palPop.style.left = '50%';
  palPop.style.transform = 'translateX(-50%)';
}

function setColor(c) {
  pen.color = c;
  colorDot.style.background = c;
  palCurDot.style.background = c;
  palCurHex.textContent = String(c).toUpperCase();
  if (/^#[0-9a-f]{6}$/i.test(c)) customColor.value = c;
  document.querySelectorAll('#palGrid .swatch').forEach(s => s.classList.toggle('on', s.dataset.c === c));
  if (pen.brush === 'eraser') selectBrush(lastPaint);   /* 点颜色即从橡皮切回画笔 */
  updateBrushDot();
}
function updateBrushDot() {
  const d = Math.max(5, Math.min(38, pen.size));
  brushDot.style.width = d + 'px';
  brushDot.style.height = d + 'px';
  brushDot.style.border = 'none';
  brushDot.style.opacity = '1';
  if (pen.brush === 'eraser') {
    brushDot.style.background = 'transparent';
    brushDot.style.border = '2px solid #9A7FBC';
  } else if (pen.brush === 'spray') {
    brushDot.style.background = `radial-gradient(circle, ${pen.color}, transparent 70%)`;
  } else if (pen.brush === 'highlight') {
    brushDot.style.background = pen.color;
    brushDot.style.opacity = '.45';
  } else if (pen.brush === 'marker') {
    brushDot.style.background = pen.color;
    brushDot.style.opacity = '.6';
  } else {
    brushDot.style.background = pen.color;
  }
}
function selectBrush(key) {
  if (pen.brush === key) return;
  brushSizes[pen.brush] = pen.size;       /* 记住这支笔自己的粗细 */
  pen.brush = key;
  if (key !== 'eraser') lastPaint = key;
  pen.size = brushSizes[key] || BRUSHES[key].size;
  sizeRange.value = pen.size;
  sizeVal.textContent = pen.size;
  document.querySelectorAll('#brushRow .brush-chip').forEach(c => c.classList.toggle('on', c.dataset.brush === key));
  if (key === 'eraser') closePal();
  updateBrushDot();
}

brushRow.innerHTML = Object.keys(BRUSHES).map(k =>
  `<button class="brush-chip ${k === pen.brush ? 'on' : ''}" data-brush="${k}" title="${BRUSHES[k].name}">${BRUSHES[k].name}</button>`).join('');
brushRow.addEventListener('click', e => {
  const b = e.target.closest('.brush-chip');
  if (b) selectBrush(b.dataset.brush);
});
document.getElementById('palGrid').innerHTML = PALETTE.map(c =>
  `<button class="swatch ${c === pen.color ? 'on' : ''}" style="background:${c}" data-c="${c}" aria-label="${c}" title="${c}"></button>`).join('');
document.getElementById('palGrid').addEventListener('click', e => {
  const b = e.target.closest('.swatch');
  if (!b) return;
  setColor(b.dataset.c);
  closePal();
});
customColor.addEventListener('input', () => setColor(customColor.value));
colorBtn.addEventListener('click', () => (palPop.hidden ? openPal() : closePal()));
window.addEventListener('resize', () => closePal());   /* 尺寸变了先收起，下次展开重新收边 */
overlay.addEventListener('pointerdown', e => {   /* 点画布等别处收起色板 */
  if (!palPop.hidden && !e.target.closest('.pal-wrap')) closePal();
});
sizeRange.addEventListener('input', () => {
  pen.size = +sizeRange.value;
  brushSizes[pen.brush] = pen.size;
  sizeVal.textContent = sizeRange.value;
  updateBrushDot();
});
updateBrushDot();

function saveDoodle() {
  if (!strokes.length) return toast('先画几笔');
  const w = curWork();
  addLayer(w.id, { author: getUser().name, ts: today(), kind: 'doodle', dataUrl: canvas.toDataURL('image/png') });
  closeDraw();
  syncPageLayers();
  renderLayers(w);
  renderPanel(w);
  toast('已存为新图层，作者可以看到你的一笔');
}

/* ---------- 启动 ---------- */
initBook();
document.getElementById('btnPrev').addEventListener('click', flipPrev);
document.getElementById('btnNext').addEventListener('click', flipNext);

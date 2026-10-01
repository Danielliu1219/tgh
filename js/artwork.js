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

  renderLayers(w);
  renderComments(w);
}

function renderLayers(w) {
  const box = document.getElementById('layerList');
  if (!w.layers.length) {
    box.innerHTML = '<div class="layer-empty">还没有二创图层。点上面「画一笔」，你就是第一层。</div>';
    return;
  }
  box.innerHTML = w.layers.map(l => {
    const off = !l.visible;
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
  if (document.getElementById('drawOverlay').classList.contains('open')) {
    if (e.key === 'Escape') closeDraw();
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
   ============================================================ */
const overlay = document.getElementById('drawOverlay');
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let strokes = [];
let pen = { color: '#E82E4F', size: 6, erase: false };
let drawing = false, lastPt = null;

const DOODLE_COLORS = ['#F3D1CA', '#E82E4F', '#A8507E', '#9A7FBC', '#6E5AA2', '#171327'];

function openDraw() {
  if (!getUser()) return mustLogin();
  const w = curWork();
  overlay.classList.add('open');

  /* 弹窗可用区域 → 按作品比例定尺寸 → 原图与透明画布同尺寸叠放 */
  const { w: dw, h: dh } = fitBox(w.ratio, window.innerWidth * 0.92, window.innerHeight * 0.7);
  const box = document.getElementById('drawBox');
  box.style.width = dw + 'px';
  box.style.height = dh + 'px';
  canvas.width = dw;
  canvas.height = dh;
  canvas.style.width = dw + 'px';
  canvas.style.height = dh + 'px';

  document.getElementById('drawBaseImg').src = w.src;
  document.getElementById('drawLayers').innerHTML = w.layers.filter(l => l.visible)
    .map(l => `<img src="${l.svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(l.svg) : l.dataUrl}" alt="">`).join('');

  strokes = [];
  redraw();
  document.body.style.overflow = 'hidden';
}
function closeDraw() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(s => {
    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    s.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  });
  ctx.globalCompositeOperation = 'source-over';
}

canvas.addEventListener('pointerdown', e => {
  drawing = true;
  lastPt = { x: e.offsetX, y: e.offsetY };
  strokes.push({ ...pen, pts: [lastPt] });
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!drawing) return;
  const p = { x: e.offsetX, y: e.offsetY };
  strokes[strokes.length - 1].pts.push(p);
  ctx.globalCompositeOperation = pen.erase ? 'destination-out' : 'source-over';
  ctx.strokeStyle = pen.color;
  ctx.lineWidth = pen.size;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lastPt.x, lastPt.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  lastPt = p;
});
canvas.addEventListener('pointerup', () => { drawing = false; });

(function () {
  const box = document.getElementById('swatches');
  box.innerHTML = DOODLE_COLORS.map(c =>
    `<button class="swatch ${c === pen.color ? 'on' : ''}" style="background:${c}" data-c="${c}" aria-label="颜色"></button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('.swatch');
    if (!b) return;
    pen.color = b.dataset.c;
    pen.erase = false;
    box.querySelectorAll('.swatch').forEach(s => s.classList.toggle('on', s === b));
    document.getElementById('undoBtn').textContent = '撤销';
  });
  const range = document.getElementById('sizeRange');
  const sizeVal = document.getElementById('sizeVal');
  range.addEventListener('input', () => {
    pen.size = +range.value;
    sizeVal.textContent = range.value;
  });
  /* 橡皮擦 = 撤销按钮临时切换 */
  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    pen.erase = true;
    document.getElementById('undoBtn').textContent = '橡皮';
  });
})();

function undoStroke() {
  strokes.pop();
  redraw();
}
function clearCanvas() {
  strokes = [];
  redraw();
}
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

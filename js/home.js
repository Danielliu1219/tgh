/* ============================================================
   首页：整屏同人志封面海报（主作品/大标题/信息/印章 CTA/胶片条）
        + 右上角双螺旋塔（缓缓上升、无限循环；新手教程里放大展示，结束后平移缩小落位）
        + 新手教程（第一次进门：虚化首页 → 玩法三招 → 螺旋预览 → 开始）
   动效全部 GSAP；支持减弱动效降级；pagehide 时清理监听
   ============================================================ */

/* 包一层 IIFE：index.html 同页还加载 gate.js，避免顶层 const 撞名 */
(function () {
const G = window.gsap;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (G && window.ScrollTrigger) G.registerPlugin(ScrollTrigger);

const SETS = getSets();
const NSET = SETS.length;
const coverOf = s => getWork(s.cover) || worksOfSet(s.id)[0];
/* 一集的时间范围：2026.07 – 2026.09（同月则只显示一个） */
function monthRange(works) {
  const ms = [...new Set(works.map(w => w.ts.slice(0, 7)))].sort();
  const f = m => m.replace('-', '.');
  return ms.length > 1 ? f(ms[0]) + ' – ' + f(ms[ms.length - 1]) : f(ms[0]);
}

/* ============================================================
   hero 海报：主作品 + 构图大标题 + 信息 + 印章 CTA + 胶片条
   ============================================================ */
(function () {
  const hero = document.getElementById('hero');
  const heroMain = document.getElementById('heroMain');
  const stage = document.getElementById('heroStage');
  if (!hero || !heroMain || !stage) return;

  const heroTitle = document.getElementById('heroTitle');
  const heroMeta = document.getElementById('heroMeta');
  const heroCta = document.getElementById('heroCta');
  const heroArt = document.getElementById('heroArt');
  const heroImg = document.getElementById('heroImg');
  const mast = document.querySelector('.hero-masthead');
  const sh1 = stage.querySelector('.ha-sh.s1');
  const sh2 = stage.querySelector('.ha-sh.s2');
  const film = document.getElementById('heroFilm');
  const curtain = document.getElementById('heroCurtain');
  const prevBtn = document.getElementById('heroPrev');
  const nextBtn = document.getElementById('heroNext');
  const $ = id => document.getElementById(id);

  /* 初始作品集：文创设计（找不到就从头开始） */
  let curHero = Math.max(0, SETS.findIndex(s => s.id === 's1'));

  /* 主标题逐字拆分（入场用）；副行不拆，保持整体 */
  if (G && window.SplitText) {
    const split = new SplitText('#heroTitle .t-line', { type: 'chars' });
    split.chars.forEach(c => c.classList.add('char')); /* 3.13 不再自动加 class */
  }
  const chars = heroTitle.querySelectorAll('.char');

  /* 主作品按自身比例定版面（竖版=海报，横版=横式 key visual） */
  function plateDims(w) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const r = w.ratio;
    let pw, ph;
    const land = r >= .9;
    /* 手机（≤760 与 CSS 断点同步）：海报居中放进 ~74vw，不再用桌面版留白裁剪 */
    if (vw <= 760) {
      pw = Math.min(vw * .74, vh * .42 * r);
      ph = pw / r;
      stage.style.setProperty('--pw', Math.round(pw) + 'px');
      stage.style.setProperty('--ph', Math.round(ph) + 'px');
      stage.classList.toggle('landscape', land);
      return;
    }
    if (land) {
      pw = Math.min(vw * .42, 620);
      ph = pw / r;
      if (ph > vh * .5) { ph = vh * .5; pw = ph * r; }
    } else {
      ph = Math.min(vh * .62, 640);
      pw = ph * r;
      const maxW = Math.min(vw * .34, 480);
      if (pw > maxW) { pw = maxW; ph = pw / r; }
    }
    /* 底边裁剪：海报上沿在标题正下方（CSS 同款公式），下沿止于胶片条上方
       （胶片条占底部 88px + 16px 间隙），「再添一笔」印章和胶片条互不重叠 */
    const ht = vw <= 1100 ? vw * .115 : Math.min(152, Math.max(88, vw * .10));
    const titleBottom = 92 + ht * 1.02 + 14;
    const avail = vh - titleBottom - 106;
    if (avail > 0 && ph > avail) { ph = avail; pw = ph * r; }
    /* 右沿别探进右上角的双螺旋塔（塔 ≥1251px 才显示；left/right/width 取值与
       index.html 里 .hero-stage / .hero-spiral 的 clamp 一一同源，改一处要同步） */
    if (vw > 1250) {
      const towerLeft = vw - Math.min(84, Math.max(28, vw * .045)) - Math.min(360, Math.max(280, vw * .24)) - 14;
      const stageLeft = Math.min(650, Math.max(470, vw * .41));
      if (stageLeft + pw > towerLeft) { pw = Math.max(240, towerLeft - stageLeft); ph = pw / r; }
    } else if (!land) {
      /* 塔不显示的中段宽度：海报 + 贴角「再添一笔」印章整体留在屏内，防小窗横向滚动。
         112 = 印章右缘相对海报右沿的伸出量（宽 162 − 左移 50）；stageLeft 与 CSS 同源 */
      const stageLeft = vw <= 1100 ? vw * .54 : Math.min(650, Math.max(470, vw * .41));
      if (stageLeft + pw + 112 > vw - 8) { pw = Math.max(180, vw - 8 - stageLeft - 112); ph = pw / r; }
    }
    stage.style.setProperty('--pw', Math.round(pw) + 'px');
    stage.style.setProperty('--ph', Math.round(ph) + 'px');
    stage.classList.toggle('landscape', land);
  }

  /* 按当前作品集刷新封面海报上的全部真实数据 */
  function renderHero(i) {
    const s = SETS[i];
    const ws = worksOfSet(s.id);
    const cover = coverOf(s);
    curHero = i;
    const href = 'artwork.html?id=' + cover.id;
    heroArt.href = href;
    heroArt.setAttribute('aria-label', '翻开《' + s.name + '》');
    heroCta.href = href;
    heroImg.src = cover.src;
    heroImg.alt = s.name;
    /* 首页封面只放原图——作品上的二创图层（如 w101 的示例爱心）只在作品页里展示 */
    $('heroName').textContent = s.name;
    $('heroAuthor').textContent = '朱涵书';
    $('heroDate').textContent = '共 ' + ws.length + ' 幅 · ' + monthRange(ws);
    $('heroLikes').textContent = ws.reduce((n, w) => n + w.likes, 0);
    $('heroIssue').textContent = String(i + 1).padStart(2, '0');
    $('heroTotal').textContent = '/ ' + String(NSET).padStart(2, '0');
    $('heroCat').textContent = s.cat || '新作';
    $('heroCoverBadge').textContent = cover.title === '未上传' ? '本集封面' : '本集封面 · ' + cover.title;
    const open = $('heroOpen');
    open.href = 'set.html?id=' + s.id;
    open.querySelector('.open-n').textContent = ws.length;
    plateDims(cover);
    film.querySelectorAll('.hf-th').forEach((b, k) => b.classList.toggle('on', k === i));
    const active = film.querySelector('.hf-th.on');
    const track = film.querySelector('.hf-track');
    /* 只横滑胶片条本身——scrollIntoView 会连带滚动整页（手机纵向流下会跳页） */
    if (active && track) {
      track.scrollTo({
        left: active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2,
        behavior: REDUCE ? 'auto' : 'smooth',
      });
    }
  }

  /* 胶片条：每个作品集的封面（点选切换主海报） */
  film.innerHTML = SETS.map((s, i) => {
    const c = coverOf(s);
    return `<button class="hf-th" data-i="${i}" aria-label="${esc(s.name)}"><img src="${c.src}" alt="" loading="eager"><span class="hf-lab">${esc(s.short)}</span></button>`;
  }).join('');
  film.addEventListener('click', e => {
    const b = e.target.closest('.hf-th');
    if (!b) return;
    const to = +b.dataset.i;
    heroSwitch(to, to > curHero ? 1 : -1);
  });

  /* 上下幅：键盘 ← → 与翻页按钮（首尾循环） */
  prevBtn.addEventListener('click', () => heroSwitch(curHero - 1, -1));
  nextBtn.addEventListener('click', () => heroSwitch(curHero + 1, 1));
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowLeft') heroSwitch(curHero - 1, -1);
    if (e.key === 'ArrowRight') heroSwitch(curHero + 1, 1);
  });

  /* 切换动画（0.6-1s）：先抽走、换内容、再斜向落回；动效期间挂锁 */
  let busy = false;
  let animating = false;
  let pending = null; /* 入场/切换动画期间点了下一集，收尾后补切，不让点击落空 */
  function flushPending() {
    if (!pending) return;
    const p = pending;
    pending = null;
    heroSwitch(p[0], p[1]);
  }
  function heroSwitch(to, dir) {
    if (busy || animating) { pending = [to, dir]; return; }
    let t = to;
    if (t < 0) t = NSET - 1;
    if (t >= NSET) t = 0;
    if (t === curHero) return;
    busy = true;
    const im = new Image();
    im.onload = () => playSwitch(t, dir);
    im.onerror = () => playSwitch(t, dir);
    im.src = coverOf(SETS[t]).src;
  }
  /* 二次元闪光：切换作品时在主作品中心爆一记（js/fx.js 画布） */
  function burstAtStage() {
    if (!window.Fx) return;
    const h = hero.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    window.Fx.burst(s.left - h.left + s.width / 2, s.top - h.top + s.height / 2,
      { color: 'scarlet', size: Math.min(190, s.width * .34) });
  }
  function playSwitch(to, dir) {
    renderHero(to);
    if (REDUCE || !G) { busy = false; flushPending(); return; }
    animating = true;
    burstAtStage();
    const tl = G.timeline({ onComplete: () => { busy = false; animating = false; flushPending(); } });
    tl.to(stage, { y: -48, rotation: -5 * dir, opacity: 0, duration: .3, ease: 'power2.in' })
      .fromTo(stage, { y: 96, rotation: 4 * dir }, { y: 0, rotation: 0, opacity: 1, duration: .52, ease: 'power3.out' })
      .fromTo(heroMeta, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .3, ease: 'power2.out' }, '-=.28');
  }

  /* 入场 timeline（1.2-1.8s）：幕布揭开 → 主作品进入 → 标题分层 → 信息依次 → CTA 印章最后落位 */
  function heroIntro() {
    if (REDUCE || !G) { if (curtain) curtain.style.display = 'none'; return; } /* 幕布降级隐藏 */
    animating = true;
    const vh = window.innerHeight;
    const tl = G.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => { animating = false; if (curtain) curtain.remove(); flushPending(); },
    });
    tl.to(curtain, { yPercent: -101, duration: .9, ease: 'power2.inOut' }, 0)
      .fromTo(stage, { y: vh * .55, rotation: 5 }, { y: 0, rotation: 0, duration: 1.05, ease: 'power4.out' }, .2);
    if (chars.length) {
      tl.from(chars, { yPercent: 116, duration: .9, ease: 'power4.out', stagger: .05 }, .3);
    }
    tl.from('.t-sub', { y: 24, opacity: 0, duration: .65 }, .85)
      .from(mast, { opacity: 0, duration: .7 }, .9)
      .from('.hero-meta > *', { y: 18, opacity: 0, duration: .5, stagger: .07 }, .95)
      .from(heroCta, { scale: 1.7, rotation: -10, opacity: 0, duration: .45, ease: 'back.out(1.7)' }, 1.05)
      .from('.hero-pager', { y: 14, opacity: 0, duration: .4 }, 1.15)
      .from('.hero-film', { y: 44, opacity: 0, duration: .55 }, 1.2);
  }

  /* 鼠标视差：主作品 6-14px、前景标题略快、背景印刷字略慢、套色阴影反向微移 */
  if (!REDUCE && G) {
    const q = {
      stX: G.quickTo(stage, 'x', { duration: .7, ease: 'power2.out' }),
      stY: G.quickTo(stage, 'y', { duration: .7, ease: 'power2.out' }),
      tiX: G.quickTo(heroTitle, 'x', { duration: .45, ease: 'power2.out' }),
      tiY: G.quickTo(heroTitle, 'y', { duration: .45, ease: 'power2.out' }),
      maX: G.quickTo(mast, 'x', { duration: .95, ease: 'power2.out' }),
      maY: G.quickTo(mast, 'y', { duration: .95, ease: 'power2.out' }),
      s1X: G.quickTo(sh1, 'x', { duration: .4, ease: 'power2.out' }),
      s1Y: G.quickTo(sh1, 'y', { duration: .4, ease: 'power2.out' }),
      s2X: G.quickTo(sh2, 'x', { duration: .4, ease: 'power2.out' }),
      s2Y: G.quickTo(sh2, 'y', { duration: .4, ease: 'power2.out' }),
    };
    const move = e => {
      if (animating) return;
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5;
      const ny = (e.clientY - r.top) / r.height - .5;
      q.stX(nx * 14); q.stY(ny * 10);
      q.tiX(nx * 17); q.tiY(ny * 11);
      q.maX(nx * 6); q.maY(-ny * 8);
      q.s1X(-nx * 3.5); q.s1Y(-ny * 3.5);
      q.s2X(-nx * 5); q.s2Y(-ny * 5);
    };
    const rest = () => {
      q.stX(0); q.stY(0); q.tiX(0); q.tiY(0);
      q.maX(0); q.maY(0); q.s1X(0); q.s1Y(0); q.s2X(0); q.s2Y(0);
    };
    hero.addEventListener('pointermove', move);
    hero.addEventListener('pointerleave', rest);
    /* 生命周期清理：离页杀 tween、卸监听 */
    window.addEventListener('pagehide', () => {
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', rest);
      const targets = [stage, heroTitle, mast, sh1, sh2, heroMain];
      G.killTweensOf(targets);
    }, { once: true });

    /* 滚出 hero：整组海报随滚动上移淡出 */
    G.to(heroMain, {
      y: -70, opacity: .35,
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  /* 窗口变化时按当前封面重排版面 */
  window.addEventListener('resize', () => {
    if (!busy) plateDims(coverOf(SETS[curHero]));
  });

  renderHero(curHero);

  if (!document.getElementById('gate')) heroIntro();
  else document.addEventListener('gateOpen', heroIntro, { once: true });
})();

/* ============================================================
   迷你螺旋（hero 右上角）：挑出的代表作盘成一座「三股螺旋塔」
   每三张围成一环（相隔 120°）、环环相扣往上长，每环比下一环多转一点
   → 三条螺旋缠绕着缓缓上升，到顶不断线地循环回来（无限延伸）；
   同环与跨环的卡片互不重叠，越靠上下边缘越淡
   新手教程时整体「借」到教程卡片里放大展示（只看不点），
   结束后 FLIP 平移缩小回右上角
   ============================================================ */
(function () {
  const host = document.getElementById('heroSpiral');
  const ring = document.getElementById('spiral');
  if (!host || !ring) return;

  const SPIRAL = getSpiralWorks();
  /* 卡面文字：没有名字的页面用作品集名顶上，别一排「未上传」 */
  function dispTitle(w) {
    if (w.title !== '未上传') return w.title;
    const s = w.set && getSet(w.set);
    return s ? s.name : '未上传';
  }

  const cards = SPIRAL.map((w, i) => {
    const a = document.createElement('a');
    a.className = 'orbit-card';
    a.href = 'artwork.html?id=' + w.id;
    a.setAttribute('aria-label', dispTitle(w));
    a.style.setProperty('--i', i);
    a.style.setProperty('--r', w.ratio);
    a.innerHTML = `
      <div class="frame">
        <img src="${w.src}" alt="${esc(dispTitle(w))}" loading="eager">
        <div class="cap">
          <span class="t">${esc(dispTitle(w))}</span>
          <span class="n">❤ ${w.likes}</span>
        </div>
      </div>`;
    return a;
  });
  /* 塔身氛围插画：星星/爱心/太阳/铅笔/闪光等涂鸦小元素挂在中段一圈的固定位置——
     随教程借还一起飞；Z 轴放在塔身内侧（作品卡在 translateZ(R)，插画在 0.45~0.66R），
     作品卡始终压在上层。内层 .doodle 做 bling 闪烁（CSS 动画，减弱动效时静止） */
  const DOODLES = [
    { a: 22.5,  z: .55, l: -36, s: 42, c: 'cream', b: 5.2, svg: '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/>' },
    { a: 67.5,  z: .62, l: 22,  s: 46, c: 'warm',  b: 6.5, svg: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.2-5.9 3.2 1.2-6.5L2.5 9.4l6.6-.9z"/>' },
    { a: 112.5, z: .45, l: -58, s: 54, c: 'lav',   b: 6.8, svg: '<path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M3.5 16.5c3.5-7 5.5 6.5 9 0s5.5-7 8-1"/>' },
    { a: 157.5, z: .6,  l: 40,  s: 40, c: 'warm',  b: 5.8, svg: '<path d="M12 20.5S5.4 16.4 3.3 12.5C2 10.4 3.4 7 6 7c1.9 0 3.2 1 6 3.8C14.8 8 16.1 7 18 7c2.6 0 4 3.4 2.7 5.5-2.1 3.9-8.7 8-8.7 8z"/>' },
    { a: 202.5, z: .5,  l: 54,  s: 48, c: 'cream', b: 6.2, svg: '<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z"/>' },
    { a: 247.5, z: .66, l: -26, s: 52, c: 'lav',   b: 7,   svg: '<circle cx="12" cy="12" r="4.2" fill="currentColor"/><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></g>' },
    { a: 292.5, z: .52, l: -70, s: 34, c: 'lav',   b: 5.4, svg: '<path d="M5 11h14v2H5zm6-6h2v14h-2z"/>' },
    { a: 337.5, z: .58, l: 60,  s: 36, c: 'cream', b: 5,   svg: '<path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/>' },
  ];
  const doodles = DOODLES.map((o, i) => {
    const el = document.createElement('span');
    el.className = 'doodle-3d';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<span class="doodle ${o.c}" style="--db:${o.b}s;--dd:${-i * 1.3}s"><svg viewBox="0 0 24 24">${o.svg}</svg></span>`;
    ring.appendChild(el);
    return { el, ...o };
  });
  /* 塔架：环内三张首尾相连成三角箍，环间同股相连成三条螺旋轨——
     一座三股螺旋塔的骨架一眼可辨（细、淡，由 place() 每帧摆位） */
  const PER_RING = 3;   /* 每环几张卡 = 几条螺旋 */
  /* 环与环之间的垂直间隙（px）。取 30 不是拍脑袋：塔带 7° 前倾 + 1400 透视下，
     侧区两张相隔 ~29° 的相邻环卡片，上下缘各被「近端放大」斜切 8~16px、中心距
     还被收缩 ~13px（实测 6 个鼠标位 × 5 帧峰值需 14px），12px 会被咬穿；
     30 = 12 + 14 + 余量 */
  const GAP = 30;
  const SPEED = 30;     /* 上升速度 px/s（缓缓流动） */
  const pairs = [];
  for (let r = 0; r * PER_RING < cards.length; r++) {
    const idx = [];
    for (let j = 0; j < PER_RING && r * PER_RING + j < cards.length; j++) idx.push(r * PER_RING + j);
    if (idx.length === PER_RING) {
      for (let j = 0; j < PER_RING; j++) pairs.push([idx[j], idx[(j + 1) % PER_RING]]);
    } else if (idx.length > 1) {
      pairs.push([idx[0], idx[1]]);   /* 不成环的零头：只连一条 */
    }
    for (const i0 of idx) if (i0 + PER_RING < cards.length) pairs.push([i0, i0 + PER_RING]);
  }
  const rungs = pairs.map(([a, b]) => {
    const el = document.createElement('span');
    el.className = 'rung-3d';
    el.setAttribute('aria-hidden', 'true');
    ring.appendChild(el);
    return { el, a, b };
  });
  cards.forEach(c => ring.appendChild(c));

  /* 中心柔光挂在容器上（氛围底光，不进环） */
  [host, document.getElementById('tourSpiral')].forEach(el => {
    if (!el || el.querySelector('.spiral-glow')) return;
    const glow = document.createElement('div');
    glow.className = 'spiral-glow';
    el.appendChild(glow);
  });

  /* 塔参数：卡宽/半径随容器缩放（窄屏隐藏时用固定基准）。密度全靠「环」堆：
     每 PER_RING 张围一环往上叠、每环比下一环多转一点 → 三条螺旋缠绕上升；
     同环三张同高相隔 120°、跨环任意两张隔着一个 GAP——互不重叠由结构保证 */
  let cw = 96;        /* 卡宽 */
  let R = 92;         /* 螺旋半径 */
  let L = 1;          /* 塔的一整个循环高度 */
  let flow = 0;       /* 已上升的距离 */
  const geo = [];     /* 每张卡所在环在塔上的起点 */
  const pos = [];     /* 每张卡当前帧的位置（塔架两端点要用） */
  const RAD = Math.PI / 180, DEG = 180 / Math.PI;

  /* 摆一帧：卡片沿螺旋带上升，越过顶端从底端接回来（无限循环）；
     越靠上下边缘越淡（看不到头的延伸），背面略暗、越远越小（透视自带） */
  function place() {
    const h = host.clientHeight || 430;
    const half = h / 2;
    for (let i = 0; i < cards.length; i++) {
      const g = geo[i];
      if (!g) continue;
      const p = ((g.s0 - flow) % L + L) % L;   /* 滚到塔上的新位置 */
      const y = p - L / 2;                      /* 相对塔中心的高度 */
      /* 环内槽位错开 120°，整体随高度缓缓转（每环比下一环多转 360/环数）→ 三股螺旋 */
      const ang = (p / L) * 360 + (i % PER_RING) * (360 / PER_RING);
      const edge = Math.max(0, Math.min(1, (half + 36 - Math.abs(y)) / 64));
      const depth = .72 + .28 * (Math.cos(ang * RAD) + 1) / 2;
      const op = edge * edge * depth;
      /* 已全透明的卡钳在塔边待命（此时 op 早已是 0）：不然塔会把这些卡
         铺到 ±L/2，transform 撑进滚动溢出、页面多出几屏空白 */
      const yt = Math.max(-(half + 95), Math.min(half + 95, y));
      pos[i] = { y: yt, ang, edge };
      const card = cards[i];
      card.style.transform =
        `rotateY(${ang.toFixed(2)}deg) translateZ(${R.toFixed(1)}px) translateY(${yt.toFixed(1)}px)`;
      card.style.opacity = op.toFixed(3);
      /* 完全淡出的卡不再吃鼠标事件，免得在空白处悬停/误点 */
      card.style.visibility = op < .03 ? 'hidden' : '';
    }
    /* 塔架：两端点都在圆柱面上，两点定一根杆（细、淡，不抢作品）。
       长度用 scaleX 表达（每帧改 width 会触发布局），±13px 收口藏进卡面 */
    for (const r of rungs) {
      const a = pos[r.a], b = pos[r.b];
      if (!a || !b) continue;
      const x1 = R * Math.sin(a.ang * RAD), z1 = R * Math.cos(a.ang * RAD);
      const x2 = R * Math.sin(b.ang * RAD), z2 = R * Math.cos(b.ang * RAD);
      const dx = x2 - x1, dy = b.y - a.y, dz = z2 - z1;
      const l = Math.hypot(dx, dy, dz) || 1;
      const rho = Math.asin(Math.max(-1, Math.min(1, dy / l))) * DEG;
      const yaw = Math.atan2(-dz, dx) * DEG;
      const s = Math.max(30, l - 26) / (2 * R + 44);
      r.el.style.transform =
        `translate3d(${((x1 + x2) / 2).toFixed(1)}px, ${((a.y + b.y) / 2).toFixed(1)}px, ${((z1 + z2) / 2).toFixed(1)}px)` +
        ` rotateY(${yaw.toFixed(2)}deg) rotateZ(${rho.toFixed(2)}deg) scaleX(${s.toFixed(3)})`;
      const edge = Math.min(a.edge, b.edge);
      const depth = .72 + .28 * (Math.cos((a.ang + b.ang) / 2 * RAD) + 1) / 2;
      const op = edge * edge * depth * .55;
      r.el.style.opacity = op.toFixed(3);
      r.el.style.visibility = op < .03 ? 'hidden' : '';
    }
  }

  function layout() {
    const w = host.clientWidth || 320, h = host.clientHeight || 430;
    cw = Math.max(72, Math.min(88, Math.min(w * 0.27, h * 0.22)));
    R = Math.max(62, Math.min(88, w * 0.24));
    /* 环高 = 环内最高那张卡；环距取相邻两环的高者 + GAP，跨环任意两张卡
       （哪怕都转到正面）也隔着 GAP——互不重叠由结构保证 */
    geo.length = 0;
    const ringH = [];
    for (let i = 0; i < cards.length; i += PER_RING) {
      let hhMax = 0;
      for (let j = 0; j < PER_RING && i + j < cards.length; j++) {
        const hh = cw / SPIRAL[i + j].ratio;
        hhMax = Math.max(hhMax, hh);
        const c = cards[i + j];
        c.style.setProperty('--cw', cw + 'px');
        c.style.marginLeft = -(cw / 2) + 'px';
        c.style.marginTop = -(hh / 2) + 'px';
      }
      ringH.push(hhMax);
    }
    let s = 0;
    for (let r = 0; r < ringH.length; r++) {
      for (let j = 0; j < PER_RING && r * PER_RING + j < cards.length; j++) geo.push({ s0: s });
      /* 末环的「下一环」是环 0——塔是循环的，接缝和环内其它间隔一样要按两环
         的高者留距；写死 0 会让接缝缩成半个间距，环 12 的短卡贴到环 0 的高卡上 */
      s += Math.max(ringH[r], ringH[(r + 1) % ringH.length]) + GAP;
    }
    L = s;
    /* 插画挂在中段一圈的固定位置（塔身内侧，作品卡压在上层），随 bling 闪烁 */
    doodles.forEach(o => {
      o.el.style.width = o.s + 'px';
      o.el.style.height = o.s + 'px';
      o.el.style.marginLeft = -(o.s / 2) + 'px';
      o.el.style.marginTop = -(o.s / 2) + 'px';
      o.el.style.transform =
        `rotateY(${o.a}deg) translateZ(${(R * o.z).toFixed(0)}px) translateY(${(o.l * h / 430).toFixed(0)}px)`;
    });
    /* 横档按最大长度定宽，实际长度靠 scaleX 缩放 */
    const w0 = 2 * R + 44;
    rungs.forEach(r => {
      r.el.style.width = w0 + 'px';
      r.el.style.marginLeft = -(w0 / 2) + 'px';
    });
    place();
  }
  layout();
  flow = L / 2;   /* 开场让第一张代表作先露脸 */
  place();
  window.addEventListener('resize', layout);

  /* 保险：Chromium 偶发不画 preserve-3d 首帧（部分卡悬停才补出来），挂载后强制一次重绘 */
  if (!REDUCE && G) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      host.style.opacity = '0.999';
      requestAnimationFrame(() => { host.style.opacity = ''; });
    }));
  }

  /* 教程「借出/还回」：FLIP——把整个螺旋搬到教程卡片里放大展示，结束后缩小落回右上角。
     借还都用两容器中心点差 + 缩放补偿，视觉无缝。
     REDUCE 下无动画直接搬，教程里的螺旋预览仍然可见（静态） */
  const tourSpiral = document.getElementById('tourSpiral');

  function spiralToTour() {
    if (!tourSpiral) return;
    if (REDUCE || !G) { tourSpiral.appendChild(ring); return; }
    const from = host.getBoundingClientRect();
    tourSpiral.appendChild(ring);
    const to = tourSpiral.getBoundingClientRect();
    const sc = Math.min(to.width / from.width, to.height / from.height);
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    G.set(ring, { x: dx, y: dy, scale: sc });
    G.to(ring, { x: 0, y: 0, scale: sc, duration: .75, ease: 'power3.inOut' });
  }

  function spiralBackToHero(done) {
    if (REDUCE || !G) { host.appendChild(ring); if (done) done(); return; }
    const from = tourSpiral.getBoundingClientRect();
    host.appendChild(ring);
    const to = host.getBoundingClientRect();
    const sc = Math.min(to.width / from.width, to.height / from.height);
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    G.set(ring, { x: dx, y: dy, scale: sc });
    G.to(ring, {
      x: 0, y: 0, scale: 1, duration: .85, ease: 'power3.inOut',
      onComplete: () => { G.set(ring, { clearProps: 'x,y,scale' }); if (done) done(); },
    });
  }

  /* 教程借还的动作挂到 window，供教程 IIFE 调用 */
  window.spiralToTour = spiralToTour;
  window.spiralBackToHero = spiralBackToHero;

  /* 塔身整体微前倾：从上往下看一点，柱体更立体（REDUCE 静态时同样保留这个姿态） */
  if (G) G.set(ring, { rotationX: -7 });

  if (REDUCE || !G) return; /* 减弱动效：只摆前面那一帧静态塔身 */

  /* 无限上升：ticker 每帧推进 flow（tween 做不出「流动 + 循环」的无缝感）。
     deltaTime 封顶 50ms：切回前台时不会攒出一大跳 */
  const tick = (t, dtMs) => {
    flow = (flow + SPEED * Math.min(.05, (dtMs || 16) / 1000)) % L;
    place();
  };
  G.ticker.add(tick);

  /* 鼠标环视 */
  const rx = G.quickTo(host, 'rotationX', { duration: 1.1, ease: 'power2.out' });
  const ry = G.quickTo(host, 'rotationY', { duration: 1.1, ease: 'power2.out' });
  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect();
    rx(((e.clientY - r.top) / r.height - .5) * 9);
    ry(((e.clientX - r.left) / r.width - .5) * 13);
  });
  host.addEventListener('pointerleave', () => { rx(0); ry(0); });

  /* 悬停：浮起/发光/压暗都作用在内层 .frame 上，卡片自身的位置永远由 place() 的
     螺旋公式决定——鼠标移开后 quickTo 平滑回到原位，塔的结构不会被破坏 */
  const hovers = cards.map(card => ({
    card,
    frame: card.querySelector('.frame'),
  }));
  hovers.forEach(h => {
    h.z = G.quickTo(h.frame, 'z', { duration: .5, ease: 'power2.out' });
    h.s = G.quickTo(h.frame, 'scale', { duration: .5, ease: 'power2.out' });
  });
  cards.forEach((card, i) => {
    card.addEventListener('pointerenter', () => {
      hovers[i].z(56); hovers[i].s(1.13);
      card.classList.add('lit');
      hovers.forEach((h, k) => { if (k !== i) { h.card.classList.add('dim'); h.s(.94); } });
    });
    card.addEventListener('pointerleave', () => {
      hovers[i].z(0); hovers[i].s(1);
      card.classList.remove('lit');
      hovers.forEach((h, k) => { if (k !== i) { h.card.classList.remove('dim'); h.s(1); } });
    });
  });

  window.addEventListener('pagehide', () => {
    G.ticker.remove(tick);
    G.killTweensOf([ring, host, ...cards, ...hovers.map(h => h.frame)]);
  }, { once: true });
})();

/* ============================================================
   新手教程：第一次进门时显示（虚化首页 + 两张卡片）
   第一步：玩法三招；第二步：螺旋预览（借出放大的迷你螺旋）
   「让我们开始吧」/「跳过」→ 螺旋落回右上角，虚化解除，记下已看过
   ============================================================ */
(function () {
  const TOUR_KEY = 'tgh_tour_' + DATA_VER;
  const tour = document.getElementById('tour');
  if (!tour) return;
  const step1 = document.getElementById('tourStep1');
  const step2 = document.getElementById('tourStep2');

  function showTour() {
    if (localStorage.getItem(TOUR_KEY)) return false;
    document.body.classList.add('tour-on');
    tour.hidden = false;
    if (!REDUCE && G) {
      G.from('.tour-card', { y: 26, scale: .96, opacity: 0, duration: .55, ease: 'power3.out' });
    }
    return true;
  }

  /* 两步之间的切换：新步上浮淡入，同时螺旋借出/还回 */
  function toStep2() {
    step1.hidden = true;
    step2.hidden = false;
    if (!REDUCE && G) {
      G.fromTo(step2, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
    }
    if (window.spiralToTour) window.spiralToTour();
  }
  function toStep1() {
    step2.hidden = true;
    step1.hidden = false;
    if (!REDUCE && G) {
      G.fromTo(step1, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
    }
    if (window.spiralBackToHero) window.spiralBackToHero();
  }

  function finishTour() {
    localStorage.setItem(TOUR_KEY, '1');
    document.body.classList.remove('tour-on');
    if (window.spiralBackToHero) window.spiralBackToHero();
    if (!REDUCE && G) {
      G.to(tour, {
        opacity: 0, duration: .32, ease: 'power2.in',
        onComplete: () => { tour.hidden = true; G.set(tour, { opacity: 1 }); },
      });
    } else {
      tour.hidden = true;
    }
  }

  document.getElementById('tourNext').addEventListener('click', toStep2);
  document.getElementById('tourBack').addEventListener('click', toStep1);
  document.getElementById('tourStart').addEventListener('click', finishTour);
  document.getElementById('tourSkip').addEventListener('click', finishTour);

  /* 开门进厅的同时检查是否第一次来 */
  const open = () => {
    if (showTour() && location.hash === '#t2') toStep2(); /* 验证用：直接跳到第二步看螺旋 */
  };
  if (!document.getElementById('gate')) open();
  else document.addEventListener('gateOpen', open);
})();
})();

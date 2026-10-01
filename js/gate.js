/* ============================================================
   登录门（首页第一屏）：登录/注册/游客，GSAP 开门进入展厅
   规则：未登录 → 必现登录门；?login=1 → 强制显示；?intro=1 且已登录 → 欢迎卡
   视觉：参考画作印在双开门上的海报（登录卡在左、画在右），鼠标 3D 倾斜，
        开门时画从中缝裂开向两侧旋转，深底淡出让首页入场透出来
   ============================================================ */

const G = window.gsap;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

(function () {
  const gate = document.getElementById('gate');
  if (!gate) return;

  const u = getUser();
  const wantLogin = qs('login') === '1';
  const wantIntro = qs('intro') === '1';

  /* 已登录且不是主动要看的 → 不开门 */
  if (u && !wantLogin && !wantIntro) {
    gate.remove();
    return;
  }
  /* 已登录但要看开场 → 欢迎卡 */
  if (u && wantIntro && !wantLogin) {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('welcomeCard').style.display = 'block';
    document.getElementById('welcomeName').textContent = u.name;
  }

  /* 入场：深底装饰浮现 → 海报门浮现 → 标题逐字 + 卡片升起 */
  if (!REDUCE && G) {
    G.from('.gate-back', { opacity: 0, duration: 1 }, 0);
    G.from('.gate-bg', { opacity: 0, duration: 1.2 }, .1);
    G.from('.gate-doors', { opacity: 0, y: 40, duration: 1, ease: 'power3.out' }, .2);
    if (window.SplitText) {
      const split = new SplitText('#gateTitle', { type: 'chars' });
      split.chars.forEach(c => c.classList.add('char')); /* 3.13 不再自动加 class */
      G.from(split.chars, {
        y: 90, opacity: 0, rotateX: -50,
        duration: 1.15, ease: 'power4.out', stagger: 0.055, delay: .45,
      });
    }
    G.from('.gate-en, .gate-sub, .gate-hint', {
      y: 26, opacity: 0, duration: .9, ease: 'power3.out', stagger: .12, delay: .55,
    });
    G.from('.gate-card', {
      y: 44, opacity: 0, duration: 1, ease: 'power3.out', delay: .85,
    });
  }

  /* 鼠标 3D 倾斜：整扇海报门随鼠标微微转动，深底印刷字反向平移（持续动效） */
  if (!REDUCE && G) {
    const doors = document.getElementById('gateDoors');
    const outline = gate.querySelector('.gate-outline');
    const rY = G.quickTo(doors, 'rotationY', { duration: .8, ease: 'power2.out' });
    const rX = G.quickTo(doors, 'rotationX', { duration: .8, ease: 'power2.out' });
    const oX = outline ? G.quickTo(outline, 'x', { duration: 1.1, ease: 'power2.out' }) : null;
    const move = e => {
      if (opening) return;
      const nx = e.clientX / window.innerWidth - .5;
      const ny = e.clientY / window.innerHeight - .5;
      rY(nx * 5);
      rX(-ny * 3);
      if (oX) oX(nx * 4);
    };
    const rest = () => { rY(0); rX(0); if (oX) oX(0); };
    gate.addEventListener('pointermove', move);
    gate.addEventListener('pointerleave', rest);
    window.addEventListener('pagehide', () => {
      gate.removeEventListener('pointermove', move);
      gate.removeEventListener('pointerleave', rest);
      G.killTweensOf([doors, outline]);
    }, { once: true });
  }
})();

let gateMode = 'login';
let opening = false;

function gateTab(m) {
  gateMode = m;
  document.getElementById('tabLogin').classList.toggle('active', m === 'login');
  document.getElementById('tabReg').classList.toggle('active', m === 'reg');
  document.getElementById('rowName').style.display = m === 'reg' ? '' : 'none';
  document.getElementById('rowPass2').style.display = m === 'reg' ? '' : 'none';
  document.getElementById('submitBtn').textContent = m === 'login' ? '登 录' : '注 册';
}

function finishGate() {
  const back = qs('back');
  if (back) { location.href = decodeURIComponent(back); return; }
  window.openGate();
}

/* GSAP 开门：中缝裂开向两侧旋转 → 深底淡出 → 提前通知首页开始入场 → 摘门 */
window.openGate = function () {
  const gate = document.getElementById('gate');
  if (!gate || opening) return;
  opening = true;
  const done = () => gate.remove();
  if (REDUCE || !G) { done(); document.dispatchEvent(new CustomEvent('gateOpen')); return; }

  /* 开门瞬间：海报中缝爆一记猩红闪光（二次元爆发特效） */
  if (window.Fx) {
    const r = gate.getBoundingClientRect();
    window.Fx.burst(r.width / 2, r.height / 2, { color: 'scarlet', size: 170 });
  }

  const tl = G.timeline({ onComplete: done });
  tl.to('.gate-content', { opacity: 0, y: -40, duration: .3, ease: 'power2.in' }, 0)
    .to('.gate-fx', { opacity: 0, duration: .4 }, .05)
    /* 首页入场与开门并行：门还没完全打开，幕布已在后面升起 */
    .add(() => document.dispatchEvent(new CustomEvent('gateOpen')), .18)
    .fromTo('#doorL', { xPercent: 0, rotationY: 0 },
      { xPercent: -104, rotationY: -92, duration: 1, ease: 'power3.inOut' }, .16)
    .fromTo('#doorR', { xPercent: 0, rotationY: 0 },
      { xPercent: 104, rotationY: 92, duration: 1, ease: 'power3.inOut' }, .16)
    .to('.gate-bg', { opacity: 0, duration: .5, ease: 'power1.in' }, .5)
    .to('.gate-back', { opacity: 0, duration: .6, ease: 'power1.in' }, .55);
};

function gateSubmit() {
  const pass = document.getElementById('fPass').value;

  if (gateMode === 'reg') {
    const name = document.getElementById('fName').value.trim();
    const pass2 = document.getElementById('fPass2').value;
    if (!name) return toast('起个昵称');
    if (!pass || !pass2) return toast('密码随便填一个就行');
    if (pass !== pass2) return toast('两次密码不一样');
    setUser({ name, ts: today() });
    toast('注册成功，欢迎上墙');
  } else {
    if (!pass) return toast('密码随便填一个就行');
    const name = document.getElementById('fName').value.trim();
    setUser({ name: name || '神秘涂鸦客', ts: today() });
    toast('欢迎回来');
  }
  setTimeout(finishGate, 450);
}

function guestIn() {
  setUser({ name: '路过的涂鸦客', ts: today() });
  toast('游客模式：点赞收藏都能玩');
  setTimeout(finishGate, 450);
}

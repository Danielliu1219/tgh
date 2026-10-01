/* ============================================================
   公共层：顶栏 / 页脚 / 提示 / 工具函数
   ============================================================ */

/* HTML 转义 */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* URL 参数 */
function qs(name) {
  return new URLSearchParams(location.search).get(name) || '';
}

/* 顶部提示 */
let toastTimer = null;
function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* 需要登录的操作：回首页登录门并记住回跳地址 */
function needLogin() {
  const back = encodeURIComponent(location.pathname.split('/').pop() + location.search);
  location.href = 'index.html?login=1&back=' + back;
}
function mustLogin(action) {
  if (!getUser()) {
    toast('先登录，才能' + action + '～');
    setTimeout(needLogin, 600);
    return false;
  }
  return true;
}

/* 顶栏 */
function renderNav(active) {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const u = getUser();
  const links = [
    { href: 'index.html', label: '首页', key: 'home' },
    { href: 'gallery.html', label: '画廊', key: 'gallery' },
    { href: 'upload.html', label: '发布作品', key: 'upload' },
    { href: 'collection.html', label: '收藏夹 · 拼贴', key: 'collection' },
  ];
  nav.innerHTML = `
  <div class="site-nav">
    <div class="nav-inner">
      <a class="logo" href="index.html">
        <span class="logo-cn">涂鸦画廊</span>
        <span class="logo-en">MUR DE GRAFFITI</span>
      </a>
      <nav class="nav-links">
        ${links.map(l => `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`).join('')}
      </nav>
      <div class="nav-user">
        ${u
          ? `<span class="avatar">${esc(u.name[0])}</span><span class="uname">${esc(u.name)}</span>
             <a class="link" href="javascript:void(0)" onclick="logout(); toast('已退出登录'); renderNav();">退出</a>`
          : `<a class="btn small" href="index.html?login=1">登录 / 注册</a>`}
      </div>
    </div>
  </div>`;
}

/* 页脚 */
function renderFooter() {
  const f = document.getElementById('site-footer');
  if (!f) return;
  f.innerHTML = `
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="logo"><span class="logo-cn">涂鸦画廊</span><span class="logo-en">MUR DE GRAFFITI</span></div>
        <p>上传到“涂鸦墙”的作品和素材默认开放共享与二创；图层创作建立在原作品之上，原作品始终完整保留、署名清晰。整站定位：艺术交流、创意互鉴。</p>
      </div>
      <div class="footer-links">
        <div>
          <h4>Explore</h4>
          <a href="gallery.html">逛画廊</a>
          <a href="gallery.html?sort=hot">最热作品</a>
          <a href="upload.html">发布作品</a>
        </div>
        <div>
          <h4>Create</h4>
          <a href="collection.html">我的收藏夹</a>
          <a href="collection.html#collage">拼贴画布</a>
        </div>
        <div>
          <h4>About</h4>
          <a href="javascript:void(0)" onclick="showIntroAgain()">再看开场动画</a>
          <a href="javascript:void(0)" onclick="showTourAgain()">再看新手教程</a>
          <a href="javascript:void(0)" onclick="resetData(); toast('已恢复初始数据'); setTimeout(()=>location.reload(), 700)">重置演示数据</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      AI“涂鸦画廊”（Mur de graffiti）· 课程实践作品
    </div>
  </footer>`;
}

/* 重新播放开场动画 */
function showIntroAgain() {
  location.href = 'index.html?intro=1';
}

/* 重新看新手教程：清标记回首页（登录门不会再弹，教程重新走一遍） */
function showTourAgain() {
  localStorage.removeItem('tgh_tour_' + DATA_VER);
  location.href = 'index.html';
}

/* 点赞时的小爱心爆开（暖色系） */
function heartBurst(x, y) {
  const emojis = ['💛', '🧡', '❤️', '💗'];
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('span');
    s.className = 'heart-burst';
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    s.style.setProperty('--dy', (-40 - Math.random() * 90) + 'px');
    s.style.setProperty('--rot', (Math.random() * 120 - 60) + 'deg');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

/* 页面加载公共部分 */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('site-nav');
  const footer = document.getElementById('site-footer');
  if (nav) renderNav(nav.dataset.active || '');
  if (footer) renderFooter();
});

/* 页面切换转场：站内链接先整页淡出，再跳转（新页 main 上浮淡入，见 common.css）。
   跳过：锚点 / javascript: / 下载 / 新窗口 / 修饰键点击 / 减弱动效 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (a.hasAttribute('download')) return;
    if (a.target && a.target !== '_self') return;
    if (document.documentElement.classList.contains('leaving')) return;
    e.preventDefault();
    document.documentElement.classList.add('leaving');
    setTimeout(() => { location.href = href; }, 230);
  });
})();

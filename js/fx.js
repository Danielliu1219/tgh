/* ============================================================
   持续氛围特效（canvas）：漂浮墨尘 + 二次元闪光爆发
   - 登录门与首页 hero 各挂一个 <canvas class="fx-layer">
   - window.Fx.burst(x, y, opts)：放射尖星 + 冲击环 + 飞散粒子（作品切换/开门时用）
   - 墨尘缓慢上飘 + 摆动；星光随机闪现；颜色只从 v5 色板取（纸/薰衣草/猩红）
   - 页面隐藏时暂停 rAF；canvas 被移除（开门后）自动停止；减弱动效下整个模块不启动
   ============================================================ */

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvases = document.querySelectorAll('canvas.fx-layer');
  if (!canvases.length) return;

  const PALETTE = {
    paper: [243, 209, 202],
    lav: [154, 127, 188],
    scarlet: [232, 46, 79],
    rose: [168, 80, 126],
  };
  const TAU = Math.PI * 2;
  const rgb = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';

  /* 四角星路径：外尖 s，内凹 s*0.32（模块级，火焰/闪光/爆发共用） */
  function starPath(s) {
    const pts = [];
    for (let k = 0; k < 8; k++) {
      const r = k % 2 ? s * 0.32 : s;
      const a = -Math.PI / 2 + k * Math.PI / 4;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }
  function fillStar(ctx, x, y, s, rot, alpha, color) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const pts = starPath(s);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < 8; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function newLayer(canvas) {
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    let W = 0, H = 0, running = true, raf = 0, last = 0;
    const motes = [], flashes = [], bursts = [];
    let nextFlash = 1.6 + Math.random() * 2.4;

    function resize() {
      const r = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    /* 漂浮墨尘：纸色/薰衣草小点，缓慢上飘 + 左右摆动 */
    function spawnMote(initial) {
      motes.push({
        x: Math.random() * W, y: initial ? Math.random() * H : H + 8,
        r: .8 + Math.random() * 1.7,
        c: Math.random() < .55 ? PALETTE.paper : PALETTE.lav,
        a: .1 + Math.random() * .22,
        vy: 10 + Math.random() * 22,
        sway: 8 + Math.random() * 22, freq: .4 + Math.random() * .8,
        t0: Math.random() * TAU,
      });
    }
    for (let i = 0, n = Math.max(14, Math.round(W / 110)); i < n; i++) spawnMote(true);

    /* 随机星光：出现→放大→消失（未指定颜色时从色板随机，避免 rgb(undefined)） */
    function spawnFlash(x, y, c) {
      c = c || (Math.random() < .6 ? PALETTE.paper : PALETTE.lav);
      flashes.push({
        x, y, c, t: 0, T: 1 + Math.random() * .9,
        s: 10 + Math.random() * 22, rot: Math.random() * TAU,
      });
    }

    /* 爆发：放射尖星双层错角 + 冲击环 + 飞散小星（二次元爆炸感，短促） */
    function burst(x, y, opts) {
      opts = opts || {};
      const R = opts.size || 130;
      bursts.push({ x, y, t: 0, T: .85, R, c: opts.color || 'scarlet' });
      for (let i = 0; i < 9; i++) {
        const ang = Math.random() * TAU;
        const sp = 90 + Math.random() * 250;
        flashes.push({
          x, y, t: 0, T: .55 + Math.random() * .5,
          s: 6 + Math.random() * 14, rot: 0,
          c: Math.random() < .55 ? PALETTE.scarlet : PALETTE.paper,
          fly: { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 70 },
        });
      }
    }

    function draw(ts) {
      const dt = Math.min(ts - last, 50) / 1000;
      last = ts;
      ctx.clearRect(0, 0, W, H);

      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.y -= m.vy * dt;
        m.x += Math.sin(ts / 1000 * m.freq + m.t0) * m.sway * dt;
        if (m.y < -10) { motes.splice(i, 1); spawnMote(false); continue; }
        ctx.globalAlpha = m.a;
        ctx.fillStyle = rgb(m.c);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
      }

      nextFlash -= dt;
      if (nextFlash <= 0) {
        spawnFlash(30 + Math.random() * (W - 60), 30 + Math.random() * (H - 60));
        nextFlash = 2.2 + Math.random() * 3.2;
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.t += dt;
        const k = f.t / f.T;
        if (k >= 1) { flashes.splice(i, 1); continue; }
        if (f.fly) {
          f.x += f.fly.vx * dt; f.y += f.fly.vy * dt;
          f.fly.vy += 520 * dt;
        }
        const sc = Math.sin(k * Math.PI);
        const e = 1 - k * k;
        fillStar(ctx, f.x, f.y, f.s * (0.5 + e * 0.6), f.rot, .5 * sc, rgb(f.c));
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.t += dt;
        const k = b.t / b.T;
        if (k >= 1) { bursts.splice(i, 1); continue; }
        const e = k < .3 ? k / .3 : 1 - (k - .3) / .7;   /* 快放慢收 */
        const col = PALETTE[b.c];
        const col2 = b.c === 'scarlet' ? PALETTE.paper : PALETTE.scarlet;
        fillStar(ctx, b.x, b.y, b.R * e, k * .4, (1 - k) * .85, rgb(col));
        fillStar(ctx, b.x, b.y, b.R * e * .55, k * .4 + .45, (1 - k) * .6, rgb(col2));
        ctx.globalAlpha = (1 - k) * .4;
        ctx.strokeStyle = rgb(col);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, 12 + b.R * e * .9, 0, TAU); ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    function loop(ts) {
      if (!running) return;
      if (!canvas.isConnected) { running = false; return; }  /* 开门后 gate 被移除，自动停 */
      draw(ts);
      raf = requestAnimationFrame(loop);
    }
    last = performance.now();
    raf = requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running = false; cancelAnimationFrame(raf); }
      else if (!running && canvas.isConnected) {
        running = true; last = performance.now(); raf = requestAnimationFrame(loop);
      }
    });

    return { resize, burst };
  }

  const layers = Array.from(canvases, newLayer);
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => layers.forEach(l => l.resize()), 150);
  });

  /* 对外接口：坐标相对 canvas 所在容器 */
  window.Fx = {
    burst(x, y, opts) { layers.forEach(l => l.burst(x, y, opts)); },
  };
})();

/* ============================================================
   数据层：内置作品数据 + localStorage 读写
   作品按「作品集」组织：7 个内置作品集（+ 发布作品的「大家的新作」），
   每集有封面代表作；所有互动存在浏览器里，刷新不清空；
   要恢复初始数据可在控制台执行 resetData()
   ============================================================ */

const DATA_VER = 'v5';   /* v5：作品集改版（7 集 207 幅），旧本地数据整体作废重建 */

/* ---------- 预置示例图层（SVG，凑热闹用的二创） ---------- */

function svgSun() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
  <g stroke='#9A7FBC' stroke-width='12' stroke-linecap='round'>
    <line x1='400' y1='150' x2='400' y2='82'/><line x1='400' y1='310' x2='400' y2='378'/>
    <line x1='320' y1='230' x2='252' y2='230'/><line x1='480' y1='230' x2='548' y2='230'/>
    <line x1='343' y1='173' x2='295' y2='125'/><line x1='457' y1='173' x2='505' y2='125'/>
    <line x1='343' y1='287' x2='295' y2='335'/><line x1='457' y1='287' x2='505' y2='335'/>
  </g>
  <circle cx='400' cy='230' r='72' fill='#E82E4F'/>
  <circle cx='400' cy='230' r='72' fill='none' stroke='#171327' stroke-width='9'/>
  <circle cx='378' cy='212' r='6' fill='#171327'/><circle cx='422' cy='212' r='6' fill='#171327'/>
  <path d='M370 252 Q400 282 430 252' fill='none' stroke='#171327' stroke-width='8' stroke-linecap='round'/>
  <g transform='rotate(-7 400 396)'>
    <rect x='236' y='352' width='328' height='86' rx='12' fill='#A8507E' stroke='#171327' stroke-width='8'/>
    <text x='400' y='414' font-family='KaiTi,STKaiti,serif' font-size='58' fill='#F3D1CA' text-anchor='middle'>去海边！</text>
  </g>
</svg>`;
}

function svgStar() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'>
  <g transform='rotate(-6 610 140)'>
    <path d='M610 60 L640 125 L712 135 L658 185 L671 256 L610 224 L549 256 L562 185 L508 135 L580 125 Z'
      fill='#E82E4F' stroke='#171327' stroke-width='10' stroke-linejoin='round'/>
    <path d='M600 150 L618 183 L654 188 L629 214 L635 250 L600 232 L565 250 L571 214 L546 188 L582 183 Z'
      fill='#F3D1CA'/>
  </g>
  <g stroke='#9A7FBC' stroke-width='8' stroke-linecap='round'>
    <path d='M120 120 l16 26 l30 2 l-23 19 l7 29 l-30 -18 l-30 18 l7 -29 l-23 -19 l30 -2 Z' fill='none'/>
    <path d='M690 330 l12 19 l22 1 l-17 14 l5 21 l-22 -13 l-22 13 l5 -21 l-17 -14 l22 -1 Z' fill='none'/>
  </g>
</svg>`;
}

/* ---------- 作品集（7 集，每集挑一幅代表作当封面） ---------- */

const SEED_SETS = [
  { id: 's1', name: '文创设计', short: '文创设计', cat: '手绘', cover: 'w101' },
  { id: 's2', name: 'metal phantom 漫画', short: 'metal phantom', cat: '手绘', cover: 'w201' },
  { id: 's3', name: '晚祷 漫画', short: '晚祷', cat: '手绘', cover: 'w301' },
  { id: 's4', name: '插画', short: '插画', cat: '插画', cover: 'w401' },
  { id: 's5', name: '涂鸦', short: '涂鸦', cat: '涂鸦', cover: 'w501' },
  { id: 's6', name: 'Q版人物', short: 'Q版人物', cat: '插画', cover: 'w601' },
  { id: 's7', name: '摄影', short: '摄影', cat: '摄影', cover: 'w701' },
];

/* 发布的作品不属于任何一集，动态挂进「大家的新作」 */
const NEW_SET = { id: 'new', name: '大家的新作', short: '大家的新作', cat: '', cover: '' };

/* 螺旋环上挑出来的代表作（每集 4~8 幅） */
const SPIRAL_IDS = [
  'w101', 'w106', 'w104', 'w105', 'w108', 'w201', 'w207', 'w211', 'w220', 'w230', 'w239', 'w301', 'w302', 'w304', 'w306', 'w401', 'w407', 'w411', 'w425', 'w427', 'w408', 'w501', 'w513', 'w503', 'w504', 'w515', 'w609', 'w601', 'w607', 'w602', 'w705', 'w710', 'w716', 'w719', 'w750', 'w753', 'w701', 'w775',
];

/* 拼贴画布的内置素材 */
const MATERIALS = [
  { id: 'm01', src: 'assets/materials/m01.png', ratio: 1.5007 },
  { id: 'm02', src: 'assets/materials/m02.png', ratio: 0.7045 },
  { id: 'm03', src: 'assets/materials/m03.png', ratio: 0.6914 },
  { id: 'm04', src: 'assets/materials/m04.png', ratio: 0.7336 },
  { id: 'm05', src: 'assets/materials/m05.png', ratio: 0.7836 },
  { id: 'm06', src: 'assets/materials/m06.png', ratio: 0.6872 },
  { id: 'm07', src: 'assets/materials/m07.png', ratio: 0.7413 },
  { id: 'm08', src: 'assets/materials/m08.png', ratio: 0.7755 },
  { id: 'm09', src: 'assets/materials/m09.png', ratio: 0.7905 },
  { id: 'm10', src: 'assets/materials/m10.png', ratio: 0.6568 },
  { id: 'm11', src: 'assets/materials/m11.png', ratio: 0.7418 },
  { id: 'm12', src: 'assets/materials/m12.png', ratio: 0.6055 },
  { id: 'm13', src: 'assets/materials/m13.png', ratio: 0.7636 },
];

/* ---------- 207 幅作品（标题/作者为占位，可随时改） ---------- */

const SEED_WORKS = [
  { id: 'w101', src: 'assets/art/w101.jpg', title: '设计1', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 229, ratio: 0.7064, ts: '2026-07-01',
    layers: [], comments: [ { u: '野火', t: '颜色太配了', ts: '2026-09-19' } ] },
  { id: 'w102', src: 'assets/art/w102.jpg', title: '设计2', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 168, ratio: 0.7057, ts: '2026-09-21',
    layers: [], comments: [] },
  { id: 'w103', src: 'assets/art/w103.jpg', title: '设计3', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 221, ratio: 0.7064, ts: '2026-09-14',
    layers: [], comments: [] },
  { id: 'w104', src: 'assets/art/w104.jpg', title: '设计4', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 274, ratio: 0.7064, ts: '2026-09-07',
    layers: [], comments: [] },
  { id: 'w105', src: 'assets/art/w105.jpg', title: '设计5', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 65, ratio: 0.7064, ts: '2026-08-31',
    layers: [], comments: [] },
  { id: 'w106', src: 'assets/art/w106.jpg', title: 'ACG1', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 118, ratio: 1.4156, ts: '2026-08-24',
    layers: [], comments: [] },
  { id: 'w107', src: 'assets/art/w107.jpg', title: 'ACG2', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 171, ratio: 1.0, ts: '2026-08-17',
    layers: [], comments: [] },
  { id: 'w108', src: 'assets/art/w108.jpg', title: '社团周票根', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 224, ratio: 1.7766, ts: '2026-08-10',
    layers: [], comments: [] },
  { id: 'w109', src: 'assets/art/w109.png', title: '班徽logo', author: '朱涵书', cat: '手绘', set: 's1',
    tags: ['文创设计'], likes: 277, ratio: 1.0, ts: '2026-08-03',
    layers: [], comments: [] },
  { id: 'w201', src: 'assets/art/w201.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 290, ratio: 0.7146, ts: '2026-07-27',
    layers: [], comments: [] },
  { id: 'w202', src: 'assets/art/w202.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 265, ratio: 0.7146, ts: '2026-07-20',
    layers: [], comments: [] },
  { id: 'w203', src: 'assets/art/w203.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 56, ratio: 0.7146, ts: '2026-07-13',
    layers: [], comments: [] },
  { id: 'w204', src: 'assets/art/w204.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 109, ratio: 0.7146, ts: '2026-07-06',
    layers: [], comments: [] },
  { id: 'w205', src: 'assets/art/w205.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 162, ratio: 0.7146, ts: '2026-09-26',
    layers: [], comments: [] },
  { id: 'w206', src: 'assets/art/w206.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 215, ratio: 0.7146, ts: '2026-09-19',
    layers: [], comments: [] },
  { id: 'w207', src: 'assets/art/w207.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 268, ratio: 0.7146, ts: '2026-09-12',
    layers: [], comments: [] },
  { id: 'w208', src: 'assets/art/w208.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 59, ratio: 0.7146, ts: '2026-09-05',
    layers: [], comments: [] },
  { id: 'w209', src: 'assets/art/w209.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 112, ratio: 0.7146, ts: '2026-08-29',
    layers: [], comments: [] },
  { id: 'w210', src: 'assets/art/w210.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 165, ratio: 0.7146, ts: '2026-08-22',
    layers: [], comments: [] },
  { id: 'w211', src: 'assets/art/w211.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 218, ratio: 0.7146, ts: '2026-08-15',
    layers: [], comments: [] },
  { id: 'w212', src: 'assets/art/w212.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 271, ratio: 0.7146, ts: '2026-08-08',
    layers: [], comments: [] },
  { id: 'w213', src: 'assets/art/w213.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 62, ratio: 0.7146, ts: '2026-08-01',
    layers: [], comments: [] },
  { id: 'w214', src: 'assets/art/w214.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 115, ratio: 0.7146, ts: '2026-07-25',
    layers: [], comments: [] },
  { id: 'w215', src: 'assets/art/w215.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 168, ratio: 0.7146, ts: '2026-07-18',
    layers: [], comments: [] },
  { id: 'w216', src: 'assets/art/w216.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 221, ratio: 0.7146, ts: '2026-07-11',
    layers: [], comments: [] },
  { id: 'w217', src: 'assets/art/w217.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 274, ratio: 0.7146, ts: '2026-07-04',
    layers: [], comments: [] },
  { id: 'w218', src: 'assets/art/w218.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 65, ratio: 0.7146, ts: '2026-09-24',
    layers: [], comments: [] },
  { id: 'w219', src: 'assets/art/w219.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 118, ratio: 0.7146, ts: '2026-09-17',
    layers: [], comments: [] },
  { id: 'w220', src: 'assets/art/w220.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 171, ratio: 0.7146, ts: '2026-09-10',
    layers: [], comments: [] },
  { id: 'w221', src: 'assets/art/w221.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 224, ratio: 0.7146, ts: '2026-09-03',
    layers: [], comments: [] },
  { id: 'w222', src: 'assets/art/w222.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 277, ratio: 0.7146, ts: '2026-08-27',
    layers: [], comments: [] },
  { id: 'w223', src: 'assets/art/w223.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 68, ratio: 0.7146, ts: '2026-08-20',
    layers: [], comments: [] },
  { id: 'w224', src: 'assets/art/w224.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 121, ratio: 0.7146, ts: '2026-08-13',
    layers: [], comments: [] },
  { id: 'w225', src: 'assets/art/w225.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 174, ratio: 0.7146, ts: '2026-08-06',
    layers: [], comments: [] },
  { id: 'w226', src: 'assets/art/w226.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 227, ratio: 0.7146, ts: '2026-07-30',
    layers: [], comments: [] },
  { id: 'w227', src: 'assets/art/w227.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 18, ratio: 0.7146, ts: '2026-07-23',
    layers: [], comments: [] },
  { id: 'w228', src: 'assets/art/w228.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 71, ratio: 0.7146, ts: '2026-07-16',
    layers: [], comments: [] },
  { id: 'w229', src: 'assets/art/w229.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 124, ratio: 0.7146, ts: '2026-07-09',
    layers: [], comments: [] },
  { id: 'w230', src: 'assets/art/w230.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 177, ratio: 0.7146, ts: '2026-07-02',
    layers: [], comments: [] },
  { id: 'w231', src: 'assets/art/w231.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 230, ratio: 0.7146, ts: '2026-09-22',
    layers: [], comments: [] },
  { id: 'w232', src: 'assets/art/w232.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 21, ratio: 0.7146, ts: '2026-09-15',
    layers: [], comments: [] },
  { id: 'w233', src: 'assets/art/w233.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 74, ratio: 0.7146, ts: '2026-09-08',
    layers: [], comments: [] },
  { id: 'w234', src: 'assets/art/w234.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 127, ratio: 0.7146, ts: '2026-09-01',
    layers: [], comments: [] },
  { id: 'w235', src: 'assets/art/w235.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 180, ratio: 0.7146, ts: '2026-08-25',
    layers: [], comments: [] },
  { id: 'w236', src: 'assets/art/w236.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 233, ratio: 0.7146, ts: '2026-08-18',
    layers: [], comments: [] },
  { id: 'w237', src: 'assets/art/w237.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 24, ratio: 0.7146, ts: '2026-08-11',
    layers: [], comments: [] },
  { id: 'w238', src: 'assets/art/w238.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 77, ratio: 0.7146, ts: '2026-08-04',
    layers: [], comments: [] },
  { id: 'w239', src: 'assets/art/w239.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 130, ratio: 0.7085, ts: '2026-07-28',
    layers: [], comments: [] },
  { id: 'w240', src: 'assets/art/w240.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 183, ratio: 0.7085, ts: '2026-07-21',
    layers: [], comments: [] },
  { id: 'w241', src: 'assets/art/w241.png', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 236, ratio: 0.7146, ts: '2026-07-14',
    layers: [], comments: [] },
  { id: 'w242', src: 'assets/art/w242.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's2',
    tags: ['metal phantom 漫画'], likes: 27, ratio: 0.7146, ts: '2026-07-07',
    layers: [], comments: [] },
  { id: 'w301', src: 'assets/art/w301.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 211, ratio: 0.7146, ts: '2026-09-27',
    layers: [], comments: [] },
  { id: 'w302', src: 'assets/art/w302.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 100, ratio: 0.7146, ts: '2026-09-20',
    layers: [], comments: [] },
  { id: 'w303', src: 'assets/art/w303.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 153, ratio: 0.7146, ts: '2026-09-13',
    layers: [], comments: [] },
  { id: 'w304', src: 'assets/art/w304.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 206, ratio: 0.7146, ts: '2026-09-06',
    layers: [], comments: [] },
  { id: 'w305', src: 'assets/art/w305.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 259, ratio: 0.7146, ts: '2026-08-30',
    layers: [], comments: [] },
  { id: 'w306', src: 'assets/art/w306.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 50, ratio: 0.7146, ts: '2026-08-23',
    layers: [], comments: [] },
  { id: 'w307', src: 'assets/art/w307.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 103, ratio: 0.7146, ts: '2026-08-16',
    layers: [], comments: [] },
  { id: 'w308', src: 'assets/art/w308.jpg', title: '未上传', author: '朱涵书', cat: '手绘', set: 's3',
    tags: ['晚祷 漫画'], likes: 156, ratio: 0.7146, ts: '2026-08-09',
    layers: [], comments: [] },
  { id: 'w401', src: 'assets/art/w401.jpg', title: 'misu', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 272, ratio: 0.7064, ts: '2026-08-02',
    layers: [], comments: [] },
  { id: 'w402', src: 'assets/art/w402.jpg', title: 'fireflake', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 197, ratio: 1.4846, ts: '2026-07-26',
    layers: [], comments: [] },
  { id: 'w403', src: 'assets/art/w403.jpg', title: 'oc10', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 250, ratio: 0.5629, ts: '2026-07-19',
    layers: [], comments: [] },
  { id: 'w404', src: 'assets/art/w404.png', title: 'Oscar', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 41, ratio: 0.7057, ts: '2026-07-12',
    layers: [], comments: [] },
  { id: 'w405', src: 'assets/art/w405.jpg', title: 'paradoxlive', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 94, ratio: 1.0, ts: '2026-07-05',
    layers: [], comments: [] },
  { id: 'w406', src: 'assets/art/w406.jpg', title: 'Texas', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 147, ratio: 0.715, ts: '2026-09-25',
    layers: [], comments: [] },
  { id: 'w407', src: 'assets/art/w407.png', title: '倾听我声', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 200, ratio: 0.7271, ts: '2026-09-18',
    layers: [], comments: [] },
  { id: 'w408', src: 'assets/art/w408.jpg', title: '大天使的衣袍', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 253, ratio: 0.7071, ts: '2026-09-11',
    layers: [], comments: [] },
  { id: 'w409', src: 'assets/art/w409.jpg', title: '宇津木', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 44, ratio: 0.7057, ts: '2026-09-04',
    layers: [], comments: [] },
  { id: 'w410', src: 'assets/art/w410.jpg', title: '宝生永梦', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 97, ratio: 0.7064, ts: '2026-08-28',
    layers: [], comments: [] },
  { id: 'w411', src: 'assets/art/w411.jpg', title: '小熊4', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 150, ratio: 1.0998, ts: '2026-08-21',
    layers: [], comments: [] },
  { id: 'w412', src: 'assets/art/w412.jpg', title: '小熊6', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 203, ratio: 0.75, ts: '2026-08-14',
    layers: [], comments: [] },
  { id: 'w413', src: 'assets/art/w413.jpg', title: '小熊7', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 256, ratio: 0.7214, ts: '2026-08-07',
    layers: [], comments: [] },
  { id: 'w414', src: 'assets/art/w414.jpg', title: '小熊8', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 47, ratio: 0.75, ts: '2026-07-31',
    layers: [], comments: [] },
  { id: 'w415', src: 'assets/art/w415.jpg', title: '海内欺1', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 100, ratio: 0.685, ts: '2026-07-24',
    layers: [], comments: [] },
  { id: 'w416', src: 'assets/art/w416.jpg', title: '海内欺2', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 153, ratio: 0.7, ts: '2026-07-17',
    layers: [], comments: [] },
  { id: 'w417', src: 'assets/art/w417.jpg', title: '海内欺3', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 206, ratio: 0.7436, ts: '2026-07-10',
    layers: [], comments: [] },
  { id: 'w418', src: 'assets/art/w418.jpg', title: '海内欺4', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 259, ratio: 0.5707, ts: '2026-07-03',
    layers: [], comments: [] },
  { id: 'w419', src: 'assets/art/w419.png', title: '海内欺5', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 50, ratio: 1.649, ts: '2026-09-23',
    layers: [], comments: [] },
  { id: 'w420', src: 'assets/art/w420.jpg', title: '熊蝶', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 103, ratio: 1.5005, ts: '2026-09-16',
    layers: [], comments: [] },
  { id: 'w421', src: 'assets/art/w421.jpg', title: '砉蝶2', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 156, ratio: 1.0, ts: '2026-09-09',
    layers: [], comments: [] },
  { id: 'w422', src: 'assets/art/w422.jpg', title: '砉蝶3', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 209, ratio: 1.0, ts: '2026-09-02',
    layers: [], comments: [] },
  { id: 'w423', src: 'assets/art/w423.jpg', title: '英雄欺人2', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 262, ratio: 0.6193, ts: '2026-08-26',
    layers: [], comments: [] },
  { id: 'w424', src: 'assets/art/w424.jpg', title: '英雄欺人3', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 53, ratio: 0.6836, ts: '2026-08-19',
    layers: [], comments: [] },
  { id: 'w425', src: 'assets/art/w425.jpg', title: '英雄欺人4', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 106, ratio: 1.7766, ts: '2026-08-12',
    layers: [], comments: [] },
  { id: 'w426', src: 'assets/art/w426.jpg', title: '英雄欺人', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 159, ratio: 0.7071, ts: '2026-08-05',
    layers: [], comments: [] },
  { id: 'w427', src: 'assets/art/w427.jpg', title: '键垩', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 212, ratio: 0.7507, ts: '2026-07-29',
    layers: [], comments: [] },
  { id: 'w428', src: 'assets/art/w428.jpg', title: '鸟亲', author: '朱涵书', cat: '插画', set: 's4',
    tags: ['插画'], likes: 265, ratio: 0.7078, ts: '2026-07-22',
    layers: [], comments: [] },
  { id: 'w501', src: 'assets/art/w501.jpg', title: '失忆投捕', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 193, ratio: 0.7071, ts: '2026-07-15',
    layers: [], comments: [] },
  { id: 'w502', src: 'assets/art/w502.jpg', title: 'jamil', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 32, ratio: 0.6886, ts: '2026-07-08',
    layers: [], comments: [] },
  { id: 'w503', src: 'assets/art/w503.jpg', title: 'Noah', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 85, ratio: 1.0, ts: '2026-07-01',
    layers: [], comments: [] },
  { id: 'w504', src: 'assets/art/w504.jpg', title: 'oc1', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 138, ratio: 1.5086, ts: '2026-09-21',
    layers: [], comments: [] },
  { id: 'w505', src: 'assets/art/w505.jpg', title: 'oc2', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 191, ratio: 0.6914, ts: '2026-09-14',
    layers: [], comments: [] },
  { id: 'w506', src: 'assets/art/w506.jpg', title: 'oc3', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 244, ratio: 0.7057, ts: '2026-09-07',
    layers: [], comments: [] },
  { id: 'w507', src: 'assets/art/w507.jpg', title: 'oc4', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 35, ratio: 0.6843, ts: '2026-08-31',
    layers: [], comments: [] },
  { id: 'w508', src: 'assets/art/w508.jpg', title: 'sd', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 88, ratio: 0.6671, ts: '2026-08-24',
    layers: [], comments: [] },
  { id: 'w509', src: 'assets/art/w509.jpg', title: 'tomoya', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 141, ratio: 0.7071, ts: '2026-08-17',
    layers: [], comments: [] },
  { id: 'w510', src: 'assets/art/w510.jpg', title: 'victor', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 194, ratio: 0.7071, ts: '2026-08-10',
    layers: [], comments: [] },
  { id: 'w511', src: 'assets/art/w511.jpg', title: '小熊2', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 247, ratio: 1.0, ts: '2026-08-03',
    layers: [], comments: [] },
  { id: 'w512', src: 'assets/art/w512.jpg', title: '小熊3', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 38, ratio: 1.0, ts: '2026-07-27',
    layers: [], comments: [] },
  { id: 'w513', src: 'assets/art/w513.jpg', title: '砉蝶1', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 91, ratio: 1.0, ts: '2026-07-20',
    layers: [], comments: [] },
  { id: 'w514', src: 'assets/art/w514.jpg', title: '砉蝶4', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 144, ratio: 1.0, ts: '2026-07-13',
    layers: [], comments: [] },
  { id: 'w515', src: 'assets/art/w515.jpg', title: '胞', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 197, ratio: 1.7814, ts: '2026-07-06',
    layers: [], comments: [] },
  { id: 'w516', src: 'assets/art/w516.jpg', title: '谷雨', author: '朱涵书', cat: '涂鸦', set: 's5',
    tags: ['涂鸦'], likes: 250, ratio: 0.7071, ts: '2026-09-26',
    layers: [], comments: [] },
  { id: 'w601', src: 'assets/art/w601.jpg', title: '芙宁娜', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 254, ratio: 1.0, ts: '2026-09-19',
    layers: [], comments: [] },
  { id: 'w602', src: 'assets/art/w602.jpg', title: '小熊5', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 129, ratio: 1.0, ts: '2026-09-12',
    layers: [], comments: [] },
  { id: 'w603', src: 'assets/art/w603.jpg', title: '小熊', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 182, ratio: 1.0, ts: '2026-09-05',
    layers: [], comments: [] },
  { id: 'w604', src: 'assets/art/w604.jpg', title: '小苹果', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 235, ratio: 1.0, ts: '2026-08-29',
    layers: [], comments: [] },
  { id: 'w605', src: 'assets/art/w605.jpg', title: '桥姬', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 26, ratio: 1.3283, ts: '2026-08-22',
    layers: [], comments: [] },
  { id: 'w606', src: 'assets/art/w606.jpg', title: '水母1', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 79, ratio: 1.0, ts: '2026-08-15',
    layers: [], comments: [] },
  { id: 'w607', src: 'assets/art/w607.jpg', title: '水母2', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 132, ratio: 1.0, ts: '2026-08-08',
    layers: [], comments: [] },
  { id: 'w608', src: 'assets/art/w608.jpg', title: '水母3', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 185, ratio: 1.0, ts: '2026-08-01',
    layers: [], comments: [] },
  { id: 'w609', src: 'assets/art/w609.jpg', title: '黑键2', author: '朱涵书', cat: '插画', set: 's6',
    tags: ['Q版人物'], likes: 238, ratio: 1.0, ts: '2026-07-25',
    layers: [], comments: [] },
  { id: 'w701', src: 'assets/art/w701.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 175, ratio: 1.5005, ts: '2026-07-18',
    layers: [ { id: 'l1', author: '盐汽水', ts: '2026-09-20', svg: svgSun(), visible: true, likes: 45, comments: [ { u: '泡泡糖', t: '哈哈谢谢，太阳我收下了', ts: '2026-09-20' } ] }, { id: 'l2', author: '泡泡糖', ts: '2026-09-21', svg: svgStar(), visible: true, likes: 12, comments: [] } ], comments: [ { u: 'Momo', t: '这个构图绝了', ts: '2026-09-20' }, { u: '汽水盖', t: '图层玩法好有意思', ts: '2026-09-21' } ] },
  { id: 'w702', src: 'assets/art/w702.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 226, ratio: 1.5005, ts: '2026-07-11',
    layers: [], comments: [] },
  { id: 'w703', src: 'assets/art/w703.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 279, ratio: 1.5005, ts: '2026-07-04',
    layers: [], comments: [] },
  { id: 'w704', src: 'assets/art/w704.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 70, ratio: 1.5005, ts: '2026-09-24',
    layers: [], comments: [] },
  { id: 'w705', src: 'assets/art/w705.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 123, ratio: 1.5005, ts: '2026-09-17',
    layers: [], comments: [] },
  { id: 'w706', src: 'assets/art/w706.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 176, ratio: 1.5005, ts: '2026-09-10',
    layers: [], comments: [] },
  { id: 'w707', src: 'assets/art/w707.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 229, ratio: 1.5005, ts: '2026-09-03',
    layers: [], comments: [] },
  { id: 'w708', src: 'assets/art/w708.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 20, ratio: 1.5005, ts: '2026-08-27',
    layers: [], comments: [] },
  { id: 'w709', src: 'assets/art/w709.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 73, ratio: 1.5005, ts: '2026-08-20',
    layers: [], comments: [] },
  { id: 'w710', src: 'assets/art/w710.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 126, ratio: 1.5005, ts: '2026-08-13',
    layers: [], comments: [] },
  { id: 'w711', src: 'assets/art/w711.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 179, ratio: 1.5005, ts: '2026-08-06',
    layers: [], comments: [] },
  { id: 'w712', src: 'assets/art/w712.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 232, ratio: 1.5005, ts: '2026-07-30',
    layers: [], comments: [] },
  { id: 'w713', src: 'assets/art/w713.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 23, ratio: 1.5005, ts: '2026-07-23',
    layers: [], comments: [] },
  { id: 'w714', src: 'assets/art/w714.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 76, ratio: 1.5005, ts: '2026-07-16',
    layers: [], comments: [] },
  { id: 'w715', src: 'assets/art/w715.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 129, ratio: 1.5005, ts: '2026-07-09',
    layers: [], comments: [] },
  { id: 'w716', src: 'assets/art/w716.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 182, ratio: 1.5005, ts: '2026-07-02',
    layers: [], comments: [] },
  { id: 'w717', src: 'assets/art/w717.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 235, ratio: 1.5005, ts: '2026-09-22',
    layers: [], comments: [] },
  { id: 'w718', src: 'assets/art/w718.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 26, ratio: 1.5005, ts: '2026-09-15',
    layers: [], comments: [] },
  { id: 'w719', src: 'assets/art/w719.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 79, ratio: 1.5005, ts: '2026-09-08',
    layers: [], comments: [] },
  { id: 'w720', src: 'assets/art/w720.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 132, ratio: 1.5005, ts: '2026-09-01',
    layers: [], comments: [] },
  { id: 'w721', src: 'assets/art/w721.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 185, ratio: 1.5005, ts: '2026-08-25',
    layers: [], comments: [] },
  { id: 'w722', src: 'assets/art/w722.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 238, ratio: 1.5005, ts: '2026-08-18',
    layers: [], comments: [] },
  { id: 'w723', src: 'assets/art/w723.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 29, ratio: 1.5005, ts: '2026-08-11',
    layers: [], comments: [] },
  { id: 'w724', src: 'assets/art/w724.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 82, ratio: 0.6664, ts: '2026-08-04',
    layers: [], comments: [] },
  { id: 'w725', src: 'assets/art/w725.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 135, ratio: 1.5005, ts: '2026-07-28',
    layers: [], comments: [] },
  { id: 'w726', src: 'assets/art/w726.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 188, ratio: 1.5005, ts: '2026-07-21',
    layers: [], comments: [] },
  { id: 'w727', src: 'assets/art/w727.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 241, ratio: 1.5005, ts: '2026-07-14',
    layers: [], comments: [] },
  { id: 'w728', src: 'assets/art/w728.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 32, ratio: 1.5005, ts: '2026-07-07',
    layers: [], comments: [] },
  { id: 'w729', src: 'assets/art/w729.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 85, ratio: 1.5005, ts: '2026-09-27',
    layers: [], comments: [] },
  { id: 'w730', src: 'assets/art/w730.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 138, ratio: 1.5005, ts: '2026-09-20',
    layers: [], comments: [] },
  { id: 'w731', src: 'assets/art/w731.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 191, ratio: 1.5005, ts: '2026-09-13',
    layers: [], comments: [] },
  { id: 'w732', src: 'assets/art/w732.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 244, ratio: 1.5005, ts: '2026-09-06',
    layers: [], comments: [] },
  { id: 'w733', src: 'assets/art/w733.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 35, ratio: 1.5005, ts: '2026-08-30',
    layers: [], comments: [] },
  { id: 'w734', src: 'assets/art/w734.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 88, ratio: 1.5005, ts: '2026-08-23',
    layers: [], comments: [] },
  { id: 'w735', src: 'assets/art/w735.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 141, ratio: 1.5005, ts: '2026-08-16',
    layers: [], comments: [] },
  { id: 'w736', src: 'assets/art/w736.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 194, ratio: 1.5005, ts: '2026-08-09',
    layers: [], comments: [] },
  { id: 'w737', src: 'assets/art/w737.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 247, ratio: 1.5005, ts: '2026-08-02',
    layers: [], comments: [] },
  { id: 'w738', src: 'assets/art/w738.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 38, ratio: 1.5005, ts: '2026-07-26',
    layers: [], comments: [] },
  { id: 'w739', src: 'assets/art/w739.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 91, ratio: 1.5005, ts: '2026-07-19',
    layers: [], comments: [] },
  { id: 'w740', src: 'assets/art/w740.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 144, ratio: 1.5005, ts: '2026-07-12',
    layers: [], comments: [] },
  { id: 'w741', src: 'assets/art/w741.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 197, ratio: 1.5005, ts: '2026-07-05',
    layers: [], comments: [] },
  { id: 'w742', src: 'assets/art/w742.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 250, ratio: 1.5005, ts: '2026-09-25',
    layers: [], comments: [] },
  { id: 'w743', src: 'assets/art/w743.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 41, ratio: 1.5005, ts: '2026-09-18',
    layers: [], comments: [] },
  { id: 'w744', src: 'assets/art/w744.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 94, ratio: 1.5005, ts: '2026-09-11',
    layers: [], comments: [] },
  { id: 'w745', src: 'assets/art/w745.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 147, ratio: 1.5005, ts: '2026-09-04',
    layers: [], comments: [] },
  { id: 'w746', src: 'assets/art/w746.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 200, ratio: 1.5005, ts: '2026-08-28',
    layers: [], comments: [] },
  { id: 'w747', src: 'assets/art/w747.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 253, ratio: 1.5005, ts: '2026-08-21',
    layers: [], comments: [] },
  { id: 'w748', src: 'assets/art/w748.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 44, ratio: 1.5005, ts: '2026-08-14',
    layers: [], comments: [] },
  { id: 'w749', src: 'assets/art/w749.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 97, ratio: 1.5005, ts: '2026-08-07',
    layers: [], comments: [] },
  { id: 'w750', src: 'assets/art/w750.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 150, ratio: 0.6664, ts: '2026-07-31',
    layers: [], comments: [] },
  { id: 'w751', src: 'assets/art/w751.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 203, ratio: 1.5005, ts: '2026-07-24',
    layers: [], comments: [] },
  { id: 'w752', src: 'assets/art/w752.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 256, ratio: 0.6664, ts: '2026-07-17',
    layers: [], comments: [] },
  { id: 'w753', src: 'assets/art/w753.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 47, ratio: 1.5005, ts: '2026-07-10',
    layers: [], comments: [] },
  { id: 'w754', src: 'assets/art/w754.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 100, ratio: 1.5005, ts: '2026-07-03',
    layers: [], comments: [] },
  { id: 'w755', src: 'assets/art/w755.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 153, ratio: 1.5005, ts: '2026-09-23',
    layers: [], comments: [] },
  { id: 'w756', src: 'assets/art/w756.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 206, ratio: 1.5005, ts: '2026-09-16',
    layers: [], comments: [] },
  { id: 'w757', src: 'assets/art/w757.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 259, ratio: 1.5005, ts: '2026-09-09',
    layers: [], comments: [] },
  { id: 'w758', src: 'assets/art/w758.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 50, ratio: 1.5005, ts: '2026-09-02',
    layers: [], comments: [] },
  { id: 'w759', src: 'assets/art/w759.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 103, ratio: 1.5005, ts: '2026-08-26',
    layers: [], comments: [] },
  { id: 'w760', src: 'assets/art/w760.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 156, ratio: 1.5005, ts: '2026-08-19',
    layers: [], comments: [] },
  { id: 'w761', src: 'assets/art/w761.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 209, ratio: 1.5005, ts: '2026-08-12',
    layers: [], comments: [] },
  { id: 'w762', src: 'assets/art/w762.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 262, ratio: 1.5005, ts: '2026-08-05',
    layers: [], comments: [] },
  { id: 'w763', src: 'assets/art/w763.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 53, ratio: 1.5005, ts: '2026-07-29',
    layers: [], comments: [] },
  { id: 'w764', src: 'assets/art/w764.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 106, ratio: 0.6664, ts: '2026-07-22',
    layers: [], comments: [] },
  { id: 'w765', src: 'assets/art/w765.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 159, ratio: 0.6664, ts: '2026-07-15',
    layers: [], comments: [] },
  { id: 'w766', src: 'assets/art/w766.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 212, ratio: 0.6664, ts: '2026-07-08',
    layers: [], comments: [] },
  { id: 'w767', src: 'assets/art/w767.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 265, ratio: 1.5005, ts: '2026-07-01',
    layers: [], comments: [] },
  { id: 'w768', src: 'assets/art/w768.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 56, ratio: 1.5005, ts: '2026-09-21',
    layers: [], comments: [] },
  { id: 'w769', src: 'assets/art/w769.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 109, ratio: 1.5005, ts: '2026-09-14',
    layers: [], comments: [] },
  { id: 'w770', src: 'assets/art/w770.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 162, ratio: 1.5005, ts: '2026-09-07',
    layers: [], comments: [] },
  { id: 'w771', src: 'assets/art/w771.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 215, ratio: 1.5005, ts: '2026-08-31',
    layers: [], comments: [] },
  { id: 'w772', src: 'assets/art/w772.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 268, ratio: 1.5005, ts: '2026-08-24',
    layers: [], comments: [] },
  { id: 'w773', src: 'assets/art/w773.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 59, ratio: 1.5005, ts: '2026-08-17',
    layers: [], comments: [] },
  { id: 'w774', src: 'assets/art/w774.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 112, ratio: 1.5005, ts: '2026-08-10',
    layers: [], comments: [] },
  { id: 'w775', src: 'assets/art/w775.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 165, ratio: 1.5005, ts: '2026-08-03',
    layers: [], comments: [] },
  { id: 'w776', src: 'assets/art/w776.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 218, ratio: 1.5005, ts: '2026-07-27',
    layers: [], comments: [] },
  { id: 'w777', src: 'assets/art/w777.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 271, ratio: 1.5005, ts: '2026-07-20',
    layers: [], comments: [] },
  { id: 'w778', src: 'assets/art/w778.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 62, ratio: 1.5005, ts: '2026-07-13',
    layers: [], comments: [] },
  { id: 'w779', src: 'assets/art/w779.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 115, ratio: 1.5005, ts: '2026-07-06',
    layers: [], comments: [] },
  { id: 'w780', src: 'assets/art/w780.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 168, ratio: 1.5005, ts: '2026-09-26',
    layers: [], comments: [] },
  { id: 'w781', src: 'assets/art/w781.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 221, ratio: 1.5005, ts: '2026-09-19',
    layers: [], comments: [] },
  { id: 'w782', src: 'assets/art/w782.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 274, ratio: 1.5005, ts: '2026-09-12',
    layers: [], comments: [] },
  { id: 'w783', src: 'assets/art/w783.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 65, ratio: 1.5005, ts: '2026-09-05',
    layers: [], comments: [] },
  { id: 'w784', src: 'assets/art/w784.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 118, ratio: 1.5005, ts: '2026-08-29',
    layers: [], comments: [] },
  { id: 'w785', src: 'assets/art/w785.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 171, ratio: 0.6664, ts: '2026-08-22',
    layers: [], comments: [] },
  { id: 'w786', src: 'assets/art/w786.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 224, ratio: 1.5005, ts: '2026-08-15',
    layers: [], comments: [] },
  { id: 'w787', src: 'assets/art/w787.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 277, ratio: 1.5005, ts: '2026-08-08',
    layers: [], comments: [] },
  { id: 'w788', src: 'assets/art/w788.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 68, ratio: 1.5005, ts: '2026-08-01',
    layers: [], comments: [] },
  { id: 'w789', src: 'assets/art/w789.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 121, ratio: 0.6664, ts: '2026-07-25',
    layers: [], comments: [] },
  { id: 'w790', src: 'assets/art/w790.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 174, ratio: 1.5005, ts: '2026-07-18',
    layers: [], comments: [] },
  { id: 'w791', src: 'assets/art/w791.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 227, ratio: 1.5005, ts: '2026-07-11',
    layers: [], comments: [] },
  { id: 'w792', src: 'assets/art/w792.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 18, ratio: 1.5005, ts: '2026-07-04',
    layers: [], comments: [] },
  { id: 'w793', src: 'assets/art/w793.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 71, ratio: 1.5005, ts: '2026-09-24',
    layers: [], comments: [] },
  { id: 'w794', src: 'assets/art/w794.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 124, ratio: 1.5005, ts: '2026-09-17',
    layers: [], comments: [] },
  { id: 'w795', src: 'assets/art/w795.jpg', title: '未上传', author: '朱涵书', cat: '摄影', set: 's7',
    tags: ['摄影'], likes: 177, ratio: 1.5005, ts: '2026-09-10',
    layers: [], comments: [] },
];

const CATS = ['手绘', '摄影', '插画', '涂鸦'];

/* 自定义分类：发布时新增（存 localStorage），画廊分类图卡同步显示 */
function getCats() {
  const extra = read(K.cats, []).filter(c => c && !CATS.includes(c));
  return CATS.concat(extra);
}
function addCat(name) {
  const extra = read(K.cats, []);
  if (!CATS.includes(name) && !extra.includes(name)) {
    extra.push(name);
    write(K.cats, extra);
  }
}

/* ---------- localStorage 读写 ---------- */

const K = {
  works: 'tgh_works_' + DATA_VER,
  user: 'tgh_user_' + DATA_VER,
  favs: 'tgh_favs_' + DATA_VER,
  likes: 'tgh_likes_' + DATA_VER,
  collage: 'tgh_collage_' + DATA_VER,
  cats: 'tgh_cats_' + DATA_VER,   /* 自定义分类，resetData 一并清 */
};

function read(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) { return fallback; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch (e) { console.warn('localStorage 写入失败（可能已满）', e); }
}

let worksCache = null;
function getWorks() {
  if (!worksCache) {
    worksCache = read(K.works, null);
    if (!worksCache || !Array.isArray(worksCache) || worksCache.length === 0) {
      worksCache = JSON.parse(JSON.stringify(SEED_WORKS)); // 深拷贝种子
      write(K.works, worksCache);
    } else if (dropOldSampleLayer(worksCache)) {
      write(K.works, worksCache);
    }
  }
  return worksCache;
}
/* 旧示例图层清理：w101 上预置的「好看！」爱心（2026-10-02 按要求删除），
   已访问过的浏览器 localStorage 里还留着，读到就顺手清掉 */
function dropOldSampleLayer(list) {
  let changed = false;
  list.forEach(w => {
    if (!w.layers || !w.layers.length) return;
    const keep = w.layers.filter(l => !(l.svg && l.svg.indexOf('好看') !== -1));
    if (keep.length !== w.layers.length) { w.layers = keep; changed = true; }
  });
  return changed;
}
function saveWorks() { write(K.works, worksCache); }

function getWork(id) { return getWorks().find(w => w.id === id) || null; }

/* ---------- 作品集读取 ---------- */

function isUserWork(w) { return /^u/.test(String(w.id)); }

function getSets() {
  const sets = SEED_SETS.slice();
  const mine = getWorks().filter(isUserWork);
  if (mine.length) {
    sets.push({ id: NEW_SET.id, name: NEW_SET.name, short: NEW_SET.short, cat: NEW_SET.cat,
                cover: mine[0].id, count: mine.length });
  }
  return sets;
}
function getSet(id) { return getSets().find(s => s.id === id) || null; }
function worksOfSet(id) {
  const list = getWorks();
  if (id === 'new') return list.filter(isUserWork);
  return list.filter(w => w.set === id);
}

/* 螺旋环：挑出的代表作 + 后来发布的作品 */
function getSpiralWorks() {
  const all = getWorks();
  const byId = {};
  all.forEach(w => { byId[w.id] = w; });
  const list = SPIRAL_IDS.map(id => byId[id]).filter(Boolean);
  return list.concat(all.filter(isUserWork));
}

/* 拼贴素材 */
function getMaterials() { return MATERIALS; }
function getMaterial(id) { return MATERIALS.find(m => m.id === id) || null; }
/* 拼贴画布里的元素：可能是作品，也可能是素材 */
function resolveArt(id) { return getWork(id) || getMaterial(id); }

/* 点赞：返回 {liked, count} */
function toggleLike(id) {
  const likes = read(K.likes, []);
  const i = likes.indexOf(id);
  const liked = i === -1;
  if (liked) likes.push(id); else likes.splice(i, 1);
  write(K.likes, likes);
  return { liked, count: getWork(id).likes + (liked ? 1 : 0) };
}
function isLiked(id) { return read(K.likes, []).includes(id); }

/* 收藏 */
function toggleFav(id) {
  const favs = read(K.favs, []);
  const i = favs.indexOf(id);
  const fav = i === -1;
  if (fav) favs.push(id); else favs.splice(i, 1);
  write(K.favs, favs);
  return { fav, favs };
}
function getFavs() { return read(K.favs, []); }
function isFav(id) { return getFavs().includes(id); }

/* 图层 */
function addLayer(workId, layer) {
  const w = getWork(workId);
  if (!w) return null;
  layer.id = 'l' + Date.now();
  layer.likes = 0;
  layer.comments = [];
  layer.visible = true;
  w.layers.push(layer);
  saveWorks();
  return layer;
}
function toggleLayerVisible(workId, layerId) {
  const w = getWork(workId);
  const l = w.layers.find(x => x.id === layerId);
  if (l) { l.visible = !l.visible; saveWorks(); }
  return l;
}
/* 图层删除：只能删「自己画的」——本机画笔画出来的层（dataUrl）或作者名对得上的层；
   预置示例图层是别人的二创，不给删 */
function canRemoveLayer(l) {
  if (!l) return false;
  if (l.dataUrl) return true;
  const u = getUser();
  return !!(u && l.author === u.name);
}
function removeLayer(workId, layerId) {
  const w = getWork(workId);
  if (!w) return null;
  const l = w.layers.find(x => x.id === layerId);
  if (!l || !canRemoveLayer(l)) return null;
  w.layers = w.layers.filter(x => x.id !== layerId);
  saveWorks();
  dropLayerLike(layerId);
  return l;
}
function toggleLayerLike(workId, layerId) {
  const key = 'tgh_layerlikes_' + DATA_VER;
  const map = read(key, {});
  map[layerId] = map[layerId] ? 0 : 1;
  write(key, map);
  return map[layerId] === 1;
}
function isLayerLiked(layerId) {
  return !!read('tgh_layerlikes_' + DATA_VER, {})[layerId];
}
function dropLayerLike(layerId) {
  const key = 'tgh_layerlikes_' + DATA_VER;
  const map = read(key, {});
  if (layerId in map) { delete map[layerId]; write(key, map); }
}
function layerLikeCount(w, l) { return l.likes + (isLayerLiked(l.id) ? 1 : 0); }

/* 批注 */
function addComment(workId, text, u) {
  const w = getWork(workId);
  w.comments.push({ u, t: text, ts: today() });
  saveWorks();
}
function addLayerComment(workId, layerId, text, u) {
  const w = getWork(workId);
  const l = w.layers.find(x => x.id === layerId);
  if (l) { l.comments.push({ u, t: text, ts: today() }); saveWorks(); }
}

/* 发帖 */
function addWork(work) {
  work.id = 'u' + Date.now();
  work.ts = today();
  work.likes = 0;
  work.layers = [];
  work.comments = [];
  getWorks().unshift(work);
  saveWorks();
  return work;
}

/* 删除自己发布的作品（u 开头）：收藏、点赞、拼贴画布里的引用一并清掉 */
function removeWork(id) {
  const list = getWorks();
  const i = list.findIndex(w => w.id === id);
  if (i === -1 || !isUserWork(list[i])) return false;
  const w = list.splice(i, 1)[0];
  saveWorks();
  write(K.likes, read(K.likes, []).filter(x => x !== id));
  write(K.favs, read(K.favs, []).filter(x => x !== id));
  const col = getCollage();
  if (col.items.some(it => it.id === id)) {
    col.items = col.items.filter(it => it.id !== id);
    saveCollage(col);
  }
  (w.layers || []).forEach(l => dropLayerLike(l.id));
  return true;
}

/* 用户 */
function getUser() { return read(K.user, null); }
function setUser(u) { write(K.user, u); }
function logout() { localStorage.removeItem(K.user); }

/* 拼贴画布 */
function getCollage() { return read(K.collage, { items: [] }); }
function saveCollage(c) { write(K.collage, c); }

/* 工具 */
function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function timeAgo(ts) {
  if (!ts) return '';
  const t = new Date(ts).getTime();
  const diff = Date.now() - t;
  const day = 86400000;
  if (diff < 3600000) return '刚刚';
  if (diff < day) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 30 * day) return Math.floor(diff / day) + ' 天前';
  return ts;
}
/* 恢复初始数据（控制台用） */
function resetData() {
  Object.values(K).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('tgh_layerlikes_' + DATA_VER);
  localStorage.removeItem('tgh_tour_' + DATA_VER); /* 新手教程标记一并清掉，下次进门重看 */
  worksCache = null;
  getWorks();
}

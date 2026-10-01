# AI 涂鸦画廊（Mur de graffiti）

课程项目网页应用的演示版：以「作品集」为单位浏览同人创作、在他人作品上新建图层涂鸦二次创作的社区画廊。

**在线预览**：https://danielliu1219.github.io/tgh/ —— 下载回本地后双击 `index.html` 也能直接打开（无需服务器）。

## 亮点

- 纯 **HTML + CSS + JS**，零构建、零依赖安装（GSAP、字体、图标全部已内置）
- 数据全部存在浏览器 localStorage：点赞、收藏、涂鸦图层、发布作品、拼贴布局刷新不丢
- 首页一面 **3D 三股螺旋环塔**：38 幅代表作每 3 张一环、盘绕上升，到顶从底端循环
- 核心玩法：打开一幅画 = 翻开一本 **3D 书本**，可直接在原画上涂色（颜色 / 粗细 / 橡皮 / 撤销 / 存为新图层）
- 适配手机；支持系统「减弱动态效果」全站降级

## 页面

| 页面 | 说明 |
|---|---|
| `index.html` | 登录门 → 新手教程 → 首页封面海报（胶片条换集） |
| `gallery.html` | 作品集卡片墙：分类 / 搜索 / 排序 |
| `set.html?id=xx` | 单个作品集的详情（全部作品网格） |
| `artwork.html?id=xx` | 3D 书本翻页 + 在原画上涂鸦 + 点赞收藏 |
| `upload.html` | 三步发布自己的作品（进入「大家的新作」） |
| `collection.html` | 收藏夹 + 拼贴画布（13 张内置素材） |

## 怎么跑

```bash
python -m http.server 8000    # 或任意静态服务器，在仓库根目录运行
```

浏览器打开 `http://localhost:8000`。

## 目录

```
├── index / gallery / set / artwork / upload / collection.html
├── css/common.css        # 设计系统
├── js/                   # data 数据层 · home 首页 · gallery / set / artwork / upload / collection · gate 登录门 · fx 氛围特效
└── assets/               # 作品图 207 幅 · 拼贴素材 13 张 · 字体 · 图标 · GSAP
```

## 数据

- 7 个作品集 · 共 207 幅，作者统一署名 朱涵书；纯编号文件名在书本里显示为「第 N 幅」
- 恢复出厂数据：页脚「重置演示数据」，或控制台执行 `resetData()`

> 课程项目演示版，AI 仅作为开发工具；作品图版权归原作者，请勿商用。

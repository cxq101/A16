# 技术与原型基线

记录日期：2026-11-24。本项目正式生产引擎**未选定**。当前代码是浏览器验证原型，不能因竞品使用 Unity 就推定本项目采用 Unity、URP 或 BaX。

## 运行与构建

在项目根目录进入 `fragment-demo` 后执行：

```powershell
node serve.cjs
```

- 二维：`http://127.0.0.1:5173/`
- 三维开发页：`http://127.0.0.1:5173/desk3d/index.html`
- 三维独立包检查页：`http://127.0.0.1:5173/desk3d-standalone.html`

服务仅绑定本机。也可使用 `demo.html`、`desk3d.html` 独立文件；不同协议／地址的存档不共享，浏览器对本地文件的限制可能不同。

```powershell
# 在 fragment-demo 下按需执行；构建会更新生成物
node build.cjs
node build-3d.cjs
```

依赖为 `three 0.180.0` 与 `esbuild 0.25.11`，精确锁定见 `package.json` 和 `package-lock.json`。已有依赖时无需为读文档重装；重建环境使用 `npm ci`。Three.js 用于真实 WebGL 三维渲染，浏览器能力需满足原型要求。

## 文件归属与生成关系

| 路径（相对 fragment-demo） | 职责 |
| --- | --- |
| `dist/index.html`、`style.css`、`expansion.css`、`app.js`、`game.js` | 二维手写源码；卡面定义在 `app.js` |
| `build.cjs` → `demo.html` | 合并二维源码生成独立 HTML |
| `dist/desk3d/index.html`、`desk.css`、`scene.js`、`surfaces.js` | 三维手写页面、场景与材质源码 |
| `art-assets.cjs` → `dist/desk3d/assets/*.svg` | 生成两张矢量卡面；直接改生成 SVG 会在重建时丢失 |
| `build-3d.cjs` → `dist/desk3d/cards.js`、`bundle.js`、`desk3d.html` | 从二维卡定义取前两张并使用生成 SVG，打包三维页面；包含 Three.js 许可 |
| `desk3d-study.html` | 第一轮三维样板快照，非当前源码；构建时复制为 `dist/desk3d/study.html` |
| `qa*.cjs` | Playwright CLI 的 `async(page)` 试玩脚本，不是直接 `node qa.cjs` 的完整程序 |
| `art-proposals` | 生成图、提示词与历史清单；尚未接入三维演示 |

**`dist` 不是可整体清理的构建目录。** 本轮沿用布局，正式代码迁移必须先评估并明确授权。`output`、`.playwright-cli` 为历史输出与运行资料；`node_modules` 是本地依赖，不作权威源。

## 内容与功能差异

二维原型共 12 张原创矢量卡面、两系列、72 片。星旅藏集含月潮之鲸、赤砂之塔、森间灵鹿、星轨信使、珊瑚王冠、日轮之鸟；时光工坊含午后三点、留声花园、云间慢车、寻星镜、茶杯里的海、风邮飞艇。以上是原型内容，不是正式收录名单。

三维原型只读取前两张卡。已有纸边厚度、阴影、程序化桌面材质、金属涂层、翻面、入册与图鉴；没有最终商业美术、动态品质资产体系、随机获取经济或多页收卡机。其「平面基准」是同一 WebGL 场景俯视并减少阴影／光泽的比较，不是独立二维渲染器的性能测试。

## 存档兼容边界

| 原型 | localStorage 键 | 说明 |
| --- | --- | --- |
| 二维当前 | `fragment-atelier-v2` | 与低／高混合共享进度 |
| 二维旧版 | `fragment-atelier-v1` | v2 初次读取旧版完成及部分进度，保留旧键 |
| 首轮三维 | `fragment-desk3d-v1` | 独立样板存档 |
| 当前三维 | `fragment-desk3d-art-v1` | 独立于二维及首轮三维 |

同一键也受浏览器与来源地址隔离。不得把三维存档覆盖二维存档。进入正式引擎后的迁移、导出、备份与数据版本策略尚未设计，不能承诺现有存档自动兼容正式产品。

## 验证证据与限制

原型 README 记录过二维迁移、十二卡完成、模式与移动布局，以及三维入册、刷新、缩放等历史浏览器检查。本轮只整理文档，未重跑玩法测试。

历史桌面性能记录为冷启动约 35–39 FPS、预热后四次采样约 60 FPS，98 draw calls、17296 triangles；这些是特定样板记录，不包含完整硬件矩阵，也不是正式产品性能保证。新增高清图、材质、更多卡片后应重新测量。

当前 `qa-3d-offline.cjs` 通过 HTTP 独立页验证没有额外资源请求；这不能直接证明本轮在 `file://` 下验证通过。质量记录必须区分这两种检查。

## 生产技术待决

需要根据三维材质、鼠标交互、资产流程、性能与独立开发维护成本选择引擎与具体版本。选型时评估 BaX 是否适用；如果采用，公共机制进入核心库，卡牌类别、收藏规则与成长进入业务层。现阶段没有生产框架或核心库接入，不将原型捆绑代码包装成公共库。

项目已于同日迁入 `E:\work\A16` 并初始化 Git，主分支 `main`，远程 `https://github.com/cxq101/A16.git`。原目录保留备份；迁移范围与验证见 [迁移记录](validation/2026-11-24-migration.md)。依赖目录未复制，运行静态独立包无需安装；重新构建时在 `fragment-demo` 中执行 `npm ci`。

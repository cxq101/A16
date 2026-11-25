# A16 · 卡牌整理游戏

工作代号：碎光收藏室，正式名称待定。

**项目文档：[docs/PROJECT.md](docs/PROJECT.md)**

项目定位、完整流程、成长、卡牌规则、交互、技术、待定事项与历史记录在项目文档中维护；美术风格、效果稿与制作要求在 [美术文档](docs/ART.md#art) 中独立维护。

- [游戏流程与成长](docs/PROJECT.md#gameplay)
- [卡牌信息规范](docs/PROJECT.md#cards)
- [美术方向与素材](docs/ART.md#art)
- [决策记录与待定事项](docs/PROJECT.md#decisions)

正式目录：E:/work/A16。远程：[cxq101/A16](https://github.com/cxq101/A16)，主分支 main；原目录只作迁移备份。


## 当前 Godot 工程

[一键试玩](godot/launch.cmd) · [Godot 工程](godot/project.godot) · [运行与已知范围](docs/PROJECT.md#technical)

使用 Godot 4.7.1 .NET、C# 和 BaX v0.1.5。本轮是三卡流程效果样板，尚非完整十二卡验证版。新克隆先初始化子模块，再用 .NET 版 Godot 打开；本机可直接运行 launch.cmd。

Godot 已替代旧演示，当前项目不再保留浏览器代码与构建入口。保留美术资源位于 godot/assets，原始提示词和来源清单位于 godot/assets/source。

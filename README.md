# A16 · 卡牌整理游戏

工作代号：碎光收藏室，正式名称待定。正式目录：E:/work/A16。远程：[cxq101/A16](https://github.com/cxq101/A16)，主分支 main。

## 文档入口

| 文档 | 职责 |
| --- | --- |
| [PROJECT.md](docs/PROJECT.md#scope) | 项目概览、当前进度、任务与待决事项 |
| [GAMEPLAY.md](docs/GAMEPLAY.md#gameplay) | 游戏流程、操作、成长及卡牌信息与内容 |
| [ART.md](docs/ART.md#art) | 视觉风格、品质表现、素材与制作成本 |
| [TECHNICAL.md](docs/TECHNICAL.md#technical) | Godot/BaX、代码、存档、运行与维护 |
| [RECORDS.md](docs/RECORDS.md#references) | 参考资料、验证与迁移记录 |

## Godot 试玩

[一键启动](godot/launch.cmd) · [Godot 工程](godot/project.godot) · [当前实现范围](docs/PROJECT.md#progress) · [运行与检查](docs/TECHNICAL.md#technical)

使用 Godot .NET 和 C#，核心库为固定版本的 BaX。新克隆先初始化子模块，版本与依赖以技术文档和机器清单为准。当前为三卡样板，完整十二卡验证版仍待扩展。

Godot 为唯一当前开发工程；卡图和卡背在 godot/assets，原始提示词及来源清单在 godot/assets/source。

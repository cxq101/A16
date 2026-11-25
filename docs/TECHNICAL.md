# A16 技术实现与工程维护

本文件维护当前 Godot/BaX 实现、运行构建、存档契约与工程约束。产品规则以 [GAMEPLAY.md](GAMEPLAY.md#gameplay) 为准，实际验证证据见 [RECORDS.md](RECORDS.md#godot-validation)。 更新时间：2026-11-25。

- [实现与运行](#technical)
- [当前样板存档契约](#save-format)
- [工程与维护约定](#governance)
- [检查与验证方式](#verification)

<a id="technical"></a>

## Godot 实现与运行

记录日期：2026-11-25。当前唯一运行工程为 **Godot .NET 4.7.1＋C#／.NET 8**，使用 GL Compatibility 渲染、BaX v0.1.5 固定子模块。版本依据见 [.project/engine.json](../.project/engine.json)。用户确认 Godot 验证可替代旧演示，旧代码、构建、测试和历史演示文档已清理。

### 工程入口与运行

- 工程：[godot/project.godot](../godot/project.godot)，一键启动：[godot/launch.cmd](../godot/launch.cmd)。必须使用 .NET 版 Godot；需要 .NET 8 SDK。本机环境已具备。
- 存档为独立的 Godot 样板文件 user://godot-study-v1.json，BaX 提供原子安装与修订令牌，项目负责 schema 与 codec，保持独立样板存档。存档损坏／未来版本不静默覆盖，提示后本轮停止写入；完整恢复界面尚未做。
- 样板暂不恢复退出时正在拿取或自动归档中的精确交互姿态，载入时 held 对象回到保存位置的桌面态；不宣称完整验证版的所有中断边界已完成。具体键位作为本轮试玩默认值，可后续调整。

在 godot 目录执行 dotnet build，再使用 Godot .NET 打开 project.godot 或直接运行。新克隆需先执行 git submodule update --init --recursive。引擎不入库，.godot／bin／obj 为生成缓存。

### Godot 源码与核心库边界

- game/Session.cs：唯一卡牌、容器、接收条件、拼接合成、归档、成长和存档载荷的领域规则。
- world/CardItem.cs：三维卡片、凹凸网格、背面与逐笔擦拭 mask；world/Room.cs：房间与桌面样板；world/Study.cs：输入、镜头、界面与流程装配。
- third_party/BaX：固定 v0.1.5 的公共机制，不修改其源码。实际复用 SingleSaveFile、IStoredSnapshot、ISaveCodec、NodeHelpers 和 TweenHelpers，卡牌业务不进入核心库。
- BaX 接入前已只读核对其 README、Contracts 和版本记录，确认其为 Godot .NET 库，适合本轮 C# 接入。精确提交以 engine.json 和 Git 子模块指针为准，不将 tag 对象标识混同为 commit。

<a id="save-format"></a>

## 当前三卡样板的存档契约

玩家侧的自动保存、暂停与继续规则见 [玩法规范](GAMEPLAY.md#interaction)；本节说明现有代码格式及边界，不将三卡限制扩展成正式内容设计。

- 载荷定义在 godot/game/Session.cs：StudySnapshot／ItemState，schema 为 1；路径为 user://godot-study-v1.json。
- 保存卡牌对象身份、所属卡、碎片索引、所在区域、正反面、污渍与清理 mask、位置和旋转，以及归档列表、玩家位置、视角、当前目标与页码。
- BaX SingleSaveFile 负责原子安装、备份与并发令牌；项目 StudyCodec 负责业务载荷校验。Revision 保存在载荷，WriteToken 是文件代际标识，不序列化为业务字段。
- 当前 codec 按三卡样板校验：8～9 个对象、卡牌索引 0～2、碎片索引 -1～5，并校验位置／角度有限性和基础身份唯一性。十二卡扩展必须同步调整载荷验证，不能只替换卡图。
- held 对象加载后回到保存位置的桌面态；精确拿取和自动归档中断恢复仍待完善。读取异常或未来版本不静默覆盖，完整恢复界面尚未实现。

<a id="governance"></a>

## 工程与维护约定

### 接入范围与版本

本项目于 2026-11-24 采用个人 `project-formalization` 技能对应的规范 **1.0.0**，接入记录为 [.project/formalization.json](../.project/formalization.json)。本节保存项目内适用约束，新环境无需依赖原机器的技能绝对路径即可理解项目规则。

当前 `formalized` 仅指文档、目录职责、版本来源和交接规则已接入；不表示生产引擎、素材、测试或商业计划已就绪。技能更新不自动升级项目，升级需评估差异并显式修改接入记录。

### 权威与历史

README 提供启动与文档入口。PROJECT 维护定位、进度与待决索引；GAMEPLAY 维护玩法和卡牌内容；ART 维护视觉及制作；本文件维护工程实现和规范；RECORDS 保存参考资料、验证与迁移记录。接入记录指向各自权威位置，同一规则不维护两份正文。

优先级：用户最新明确要求 → 对应权威文档的现行章节 → 当前实现状态 → 历史说明／生成图。若文档遗漏或冲突，记录并修正，不以旧图文字补回已删除字段。提案需显式标注；待审阅素材不得登记为已批准。

旧演示代码及其三份历史说明已移除，不再提供并行入口。当前美术图片与原始提示词在 Godot 工程内维护，选择状态和完整性哈希只在 `.project/artifacts.json` 登记。

### 目录职责

| 目录 | 所有者与职责 |
| --- | --- |
| `.project` | 项目治理与状态登记，不放秘密凭据 |
| `godot` | 当前 Godot .NET 效果样板；game 业务、world 场景交互、third_party/BaX 公共机制 |
| `docs` | 五份文档按项目、玩法内容、美术、技术、记录分工，权威映射见接入记录 |
| `godot/assets` | 在用三张卡图与卡背；source 内保存原始提示词和来源清单，并由 .gdignore 隔离非运行资料 |
| `outputs`、`work` | 原有预留／临时工作区，无权威规则职责 |

修改游戏逻辑与三维交互直接维护 Godot C# 源码，构建生成 .godot／bin／obj。图片、提示词和来源清单按美术文档维护；这些源资料与导入缓存明确区分，生成缓存不入库。Node 仅用于独立的文档检查工具，不参与游戏运行与构建。

### 公共核心与业务边界

当前已评估并接入 Godot .NET 的 BaX v0.1.5，作为固定 Git 子模块。公共机制复用核心库，项目负责卡牌领域与资产；新增公共机制先核对核心库职责，不擅自修改或升级核心库。

可复用的输入封装、存档基础设施、资源加载等公共机制可进入核心层；卡牌归属、类别、品质、收卡槽映射、拼接规则、成长解锁与经济由业务层拥有。只有出现真实复用需求才抽取，不把单项目内容硬编码进通用库，也不由核心库反向依赖业务。

### 独立版本对象

- 治理规范版本：`.project/formalization.json` 的 `standardVersion`。
- 接入记录结构：同文件 `schemaVersion`，不等于治理版本。
- Godot 引擎与 BaX 版本：`.project/engine.json`；Godot.NET.Sdk 版本声明在 godot/A16Study.csproj，检查工具核对两者一致。
- 美术登记结构：`.project/artifacts.json` 的 `schemaVersion`；图稿批次与审阅状态通过 sets 独立登记，不以目录推断批准状态。
- Godot 样板存档 schema 为 1，见 engine.json 的 saveSchema；正式产品发布与生产资源包版本尚未建立，不混用治理或素材登记版本。

### 本次例外与复核条件

旧混合目录例外已随本次清理移除。Godot 样板已固定接入 BaX，兼容范围仅覆盖本轮使用并验证的公共机制。当前管理目录已迁入 `E:\work\A16` 并建立 Git，原先无版本控制的例外已解除。历史玩法测试不作为本轮验收；后续改代码、资产、输入或存档时进行有针对性的验证。

用户已授权本轮迁移、建立指定 GitHub 仓库的版本管理及初始提交推送。本轮不进行游戏部署、外部消息或新对话创建。后续用户明确授权时按具体任务推进，本地文档更新无需反复要求批准。

### Git 管理

Windows 启动批处理由 .gitattributes 指定 text／CRLF，Git 索引规范化保存文本，工作目录保留 Windows 换行。

正式目录与远程见 README。主分支为 `main`，功能变更建议独立分支、检查后合并，不强推或覆盖远程历史。提交前查看差异、运行本次所需检查，按任务范围提交，不顺带提交用户其他未完成改动。当前仓库为公开仓库，凭据、托管配置、依赖目录与运行缓存不入库；占位文件确保空目录在克隆后仍可通过治理检查。

当前版本只维护 Godot 工程和所需美术资料。旧演示可按 Git 初始提交回溯，不在工作目录保留第二套构建。Git 提交标识不替代治理版本、素材登记或产品版本。

<a id="verification"></a>

## 检查与验证方式

在项目根目录运行文档检查：

~~~powershell
node .project/validate-docs.cjs
~~~

Godot C# 构建命令为 dotnet build godot/A16Study.csproj；Godot .NET 的 --smoke 和 --flow-test 参数运行隔离检查，--capture 与 --capture-room 生成展示截图到 outputs。完整命令与既有结果见 [验证记录](RECORDS.md#godot-validation)。运行这些命令时区分当前实测结果与历史记录。

建议验证多页归档、条件不符、错误放置、归档途中暂停与读档、重复计数防护及完成后查看。每个卡牌 ID 仅结算一次，测试中的异常数据不代表游戏设计允许重复卡实体。显示编号与后台稳定卡牌 ID 分开，编号作用域仍待数据设计。

文档变更检查链接、章节映射和素材完整性；游戏代码、存档或交互变更再运行对应检查。不用历史测试结果代替本次执行证据。

# physics-animation · 物理题交互动画

**让 AI 先理解物理，再把关键过程做成能观察、能操作的动画。**

一个中文物理动画 Skill：读取照片、截图、文字或 PDF 中的题目，独立建模与核验，生成物理过程说明、解题推导和可离线打开的 HTML 交互动画。

它不是自动保证答案正确的解题器，也不是独立应用。它为具备文件读写、代码执行和浏览器操作能力的 AI 助手提供工作流程、教学外壳及检查工具。

## 适合谁使用

- 想看懂运动、受力、电磁感应等过程的物理学习者。
- 希望展示阶段变化、临界事件与参数影响的教师。
- 希望用同一个物理模型驱动场景、曲线和推导的教学内容创作者。

普通文字答疑不必启动完整制作流程；纯概念或量子问题也不应被强行画成经典轨迹。

## 功能特点

| 功能 | 具体做什么 |
| --- | --- |
| 先建模后制作 | 梳理系统边界、约束、守恒条件、阶段和事件，再与参考答案核对 |
| 展示中间过程 | 将基础规律、中间物理量、视觉表达和可操作验证连起来 |
| 统一模型 | 画面、曲线、阶段文字和答案使用同一模型的数据 |
| 时间与参数探索 | 播放、暂停、慢放、时间定位、事件跳转、恢复原题及重新计算 |
| 教学工作台 | 左侧阶段分析，中间模型和曲线，右侧条件，底部时间线；分区可收起 |
| 自由视角与显示控制 | 三维旋转、缩放、平移，按物理量切换矢量和文字标注 |
| 暂停批注 | 在暂停帧上书写、擦除、撤销重做、保存和导入导出 |
| 离线交付 | Three.js 与许可证内嵌到 HTML，无须运行时 CDN |

以上是技能要求与资源能力，最终效果仍取决于题目、模型和实际验证，不代表每道题都已测试。

## 快速开始与安装

可以把本仓库网页链接发给具备安装能力的 AI，要求它“安装完整的 physics-animation Skill，保留 assets、scripts、references、agents 和许可文件”。是否能自动安装取决于宿主权限。

手动安装：

1. 下载完整仓库 ZIP，或下载 Release 中的 `physics-animation-v3.2.0.zip`（如已发布）。
2. 解压，将直接包含 `SKILL.md` 的文件夹命名为 `physics-animation`。
3. 复制整个文件夹到支持本地 Skill 的工具所要求的目录。

Codex 的本地安装位置如下，依据 [OpenAI 官方技能文档](https://learn.chatgpt.com/docs/build-skills)（2026-11-10 核对）：

| 范围 | 位置 |
| --- | --- |
| 当前项目 | `.agents/skills/physics-animation/` |
| 当前用户 | `~/.agents/skills/physics-animation/` |
| Windows 当前用户 | `%USERPROFILE%\.agents\skills\physics-animation\` |

应得到 `physics-animation/SKILL.md`，避免目录套两层。安装后从技能选择器选择 `physics-animation`；支持 `$` 的界面可输入 `$physics-animation`。若未出现，重启后检查。其他工具按其目录规则安装，尚未逐个平台验证。

### 所需环境

- **制作动画：** AI 能读取题目、写文件、运行 Python 3；模型检查另需 Node.js。浏览器检查需要宿主提供浏览器操作能力。
- **查看成品：** 现代浏览器；三维场景需要 WebGL 2。打开交付 HTML 即可，不需要 Python、Node.js 或联网。
- **依赖：** 已附 Three.js r180 离线包，常规打包无须 npm 安装。仅重建第三方包时需要 npm/esbuild，见 [依赖维护说明](references/dependency-maintenance.md)。
- **账号：** 本项目不要求单独配置 API Key；所用 AI 平台的账号、模型和费用由平台决定。

## 使用方法

附上题目图片或 PDF，或直接写出完整条件，然后输入：

```text
$physics-animation
请理解这道物理题，先给出物理过程说明与可视化设计说明，
再制作可离线打开的 HTML 动画。
我要能查看各阶段、调整独立参数、回看关键事件，并在暂停帧上批注。
请同时交付各小问推导和实际完成的验证记录。
```

若想先检查建模，可以说“先给说明，等我确认后再制作”。普通明确题默认连续完成，无须固定确认关卡。题目存在影响结论的缺失条件时，应先澄清。

更多可复制的提问见 [使用示例](examples/README.md)。历史参考动画见 [时空变化磁场中的线框](references/时空变化磁场中的线框.html)：下载后用浏览器打开；GitHub 文件页本身不运行 HTML。该示例保留制作时的界面和材料定位，不代表所有界面都与当前外壳一致，也不应被直接套用到其他题目。

## 交付什么

- 可点击、可离线打开的 HTML 动画。
- 物理过程说明与解题推导，可合为一个文档。
- 可视化设计说明：每条关键关系如何被观察和验证。
- 验证记录：区分物理正确性、机制表达、实际交互运行；没有执行的检查明确标注。

### 为开发者准备的命令

以下命令在本仓库根目录运行；`lesson/` 是每道题单独生成的输入目录，不是随仓库附带的通用模型：

```text
python scripts/validate_lesson.py lesson/lesson.json
node scripts/check_model.cjs lesson/model.js lesson/cases.cjs lesson/report.json
python scripts/build_html.py --lesson lesson/lesson.json --model lesson/model.js --scene lesson/scene.js --output output/动画.html
```

`cases.cjs` 需针对具体题目编写。只执行可信的模型和用例代码。接口见 [runtime-contract.md](references/runtime-contract.md)。结构检查通过不能证明物理推导或视觉表达正确。

## 仓库结构

```text
physics-animation/
├── README.md                 介绍、安装和使用方法
├── SKILL.md                  技能入口
├── LICENSE                   项目 MIT 许可证
├── THIRD_PARTY_NOTICES.md     依赖、参考项目和权利边界
├── CHANGELOG.md               版本记录
├── .gitignore                本地临时产物忽略规则
├── LICENSES/                 构建工具的上游许可
├── agents/openai.yaml        界面名称和默认提示
├── examples/README.md        可复制提问
├── references/               建模、视觉设计、接口、核验和参考动画
├── scripts/                  设计检查、模型检查、HTML 打包
└── assets/                   教学外壳、批注、控制与 Three.js 离线包
```

## 开源来源与致谢

本项目实际随包分发 **[Three.js](https://github.com/mrdoob/three.js) 0.180.0（r180）及其 TrackballControls，MIT 许可**；第三方离线包保持不变，完整许可保存在 [LICENSE.three.txt](assets/vendor/LICENSE.three.txt)，打包器会将其嵌入生成的 HTML。[上游 r180 许可](https://github.com/mrdoob/three.js/blob/r180/LICENSE)

开发时使用 **[esbuild](https://github.com/evanw/esbuild) 0.25.10** 打包，MIT 许可；它不是成品运行依赖，本仓库不附其可执行文件。[上游许可](https://github.com/evanw/esbuild/blob/v0.25.10/LICENSE.md)

原技能记录了对 **GlowScript/VPython、PhET Joist、Excalidraw、Signature Pad** 的调研参考，并把 **cannon-es** 列为备选；本版未引入这些项目的代码或运行时。项目链接和详细边界见 [第三方声明](THIRD_PARTY_NOTICES.md)。这是本项目的来源记录，不表示上述项目审核或认可本 Skill。

## 注意事项

- AI 可能误读图片、条件或公式，关键推导仍需复核；流畅动画不等于正确物理。
- 调整参数可能改变阶段或越出模型范围，不能继续沿用原题数值答案。
- 未给出的演示数值应标明；未核实的试卷身份不能冒充官方真题。
- 批注保存依赖浏览器本地存储；受限或失败时使用导出。真实手写笔体验需在实际设备上验证。
- 题目、教材截图、第三方文献和图片不因本项目 MIT 许可而获得重新授权。本仓库不附原始试卷或教材扫描件；历史示例中的题号是制作材料的标注，未独立核验。
- 本项目没有证据表明源自女娲 Skill，不沿用 Einstein 项目的女娲来源声明。

## 版本与许可

- 技能标识与界面名称：`physics-animation`。
- 当前发布整理版本：`3.2.0`，对应原 Skill 标注的 v3.2；没有新建虚假的历史版本。
- 整理日期：2026-11-10；本地发布包已准备，尚未由本次工作上传 GitHub 或创建 Release。
- 项目自有且贡献者有权许可的内容采用 [MIT](LICENSE)；第三方组件保留其原许可。

更新说明见 [CHANGELOG.md](CHANGELOG.md)。后续修正文档或缺陷可用 `3.2.1`，增加兼容功能可用 `3.3.0`，不兼容接口调整使用新的主版本。反馈时请提供题目条件、复现步骤、浏览器及观察结果，并去除私人信息。

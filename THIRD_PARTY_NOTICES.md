# 第三方来源与许可声明

本文件与 [原技能第三方记录](references/third-party.md)、[离线包来源记录](assets/vendor/provenance.json) 配合阅读。分类依据当前分发文件和原技能的来源声明；本次未逐行追溯全部历史开发过程。

## 1. 实际随包分发：Three.js 与 TrackballControls

| 项目 | 内容 |
| --- | --- |
| 上游 | [mrdoob/three.js](https://github.com/mrdoob/three.js) |
| 固定版本 | npm `three@0.180.0`，tag `r180` |
| 内容 | Three.js 与同版本 `examples/jsm/controls/TrackballControls.js` |
| 用途 | 三维绘制及自由旋转、缩放、平移；不负责物理建模与正确性 |
| 版权 | Copyright © 2010-2025 three.js authors |
| 许可 | MIT；[固定版本上游全文](https://github.com/mrdoob/three.js/blob/r180/LICENSE) |
| 本地许可全文 | [assets/vendor/LICENSE.three.txt](assets/vendor/LICENSE.three.txt) |
| 本地入口 | [assets/vendor/entry.js](assets/vendor/entry.js) |
| 离线产物 | [assets/vendor/three-controls.min.js](assets/vendor/three-controls.min.js) |

随包产物是构建后的 IIFE 文件，不是完整上游源码树。原包 SHA-256 为 `3adfd6c8b48df5462984b133c06afb673ebc658351d2858d2a953b8c30115684`，npm 来源及完整性信息见 provenance.json。发布整理未修改该产物。参考动画也已内嵌 Three.js 与许可。

分发此 Skill 时保留上游版权声明、许可全文和来源记录。`scripts/build_html.py` 会把 Three.js 完整许可嵌入生成 HTML 的源码注释；不要在后续压缩或清理时移除它。

## 2. 开发时工具：esbuild

- 上游：[evanw/esbuild](https://github.com/evanw/esbuild)，版本 `0.25.10`。
- 用途：将 Three.js 与 TrackballControls 构建为离线 IIFE。
- 许可：MIT，Copyright (c) 2020 Evan Wallace。
- [上游许可](https://github.com/evanw/esbuild/blob/v0.25.10/LICENSE.md)；本地副本：[LICENSES/esbuild-MIT.txt](LICENSES/esbuild-MIT.txt)。
- 本仓库不附 esbuild 二进制、npm 包或源代码。常规生成动画和查看成品均不需要它。

## 3. 调研参考，未作为依赖分发

以下用途来自原技能的来源记录。这些项目的链接仅作致谢和来源定位，不表示已集成，不为它们重新指定许可证。

| 项目 | 参考方向 | 本版使用边界 |
| --- | --- | --- |
| [GlowScript / VPython](https://github.com/vpython/glowscript) | 物理三维表达 | 未引入其代码或运行时 |
| [PhET Joist](https://github.com/phetsims/joist) | 教学模拟的组织 | 未引入其代码或运行时 |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | 白板交互、本地保存 | 批注采用本项目轻量实现，未引入其编辑器代码或运行时 |
| [Signature Pad](https://github.com/szimek/signature_pad) | Canvas 笔迹数据、缩放 | 未引入其代码或运行时 |

**备选但未采用：** [cannon-es](https://github.com/pmndrs/cannon-es)。本版不包含通用刚体物理引擎，题目优先用明确的方程求解；未来引入时须另行记录具体版本、文件与许可。

## 4. API 文档参考

- [Three.js TrackballControls](https://threejs.org/docs/pages/TrackballControls.html)、[OrbitControls](https://threejs.org/docs/pages/OrbitControls.html)：控制 API 参考；本版实际控制器为 TrackballControls。
- [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)：统一鼠标、触摸、触控笔输入。
- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)：存储行为与限制。

这些是文档链接，不包含相应文档全文转载。

## 5. 本项目与第三方材料的边界

根目录 MIT LICENSE 适用于本项目贡献者有权许可的内容，不覆盖上游保留权利、题目原文、教材截图、文献、商标或其他未获授权材料。AI 参与生成不等于所有内容均无第三方权利。

参考 HTML 保留原制作阶段的模型、讲解与来源定位；不附原汇编或试卷扫描件，也不承诺试卷身份已核实。新题目的公开分享须自行确认材料来源。项目不声称得到以上作者、维护者或机构的认可。

本次仅借鉴工作区 Einstein 发布包的组织形式，没有证据表明物理动画技能由女娲流程生成，因此不添加无依据的女娲衍生声明或许可。

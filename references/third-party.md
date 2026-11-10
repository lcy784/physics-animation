# 第三方项目与复用边界

- 实际依赖：[Three.js](https://github.com/mrdoob/three.js)，固定 npm `three@0.180.0`（r180），MIT。包括同版本 `examples/jsm/controls/TrackballControls.js`，支持无固定上方向的自由转动。源入口 `assets/vendor/entry.js`；离线产物 `three-controls.min.js`；许可 `LICENSE.three.txt`；来源与摘要见 `provenance.json`。
- 用 esbuild 0.25.10 在开发时打成 IIFE；运行 HTML 打包器不需要 npm 或联网。更新依赖时固定版本并重做浏览器检查，不自动跟随 latest。
- [OrbitControls 文档](https://threejs.org/docs/pages/OrbitControls.html)、[TrackballControls 文档](https://threejs.org/docs/pages/TrackballControls.html)：显示与控制 API，不提供题目的物理正确性。
- 参考调研：[GlowScript/VPython](https://github.com/vpython/glowscript) 的物理三维表达、[PhET Joist](https://github.com/phetsims/joist) 的教学模拟组织。本版本未复制这两个项目代码，不声称有集成。
- 备选：[cannon-es](https://github.com/pmndrs/cannon-es)。本版本未引入；教科书题优先明确方程，复杂刚体接触确实需要时再核对模型及许可。

生成器将 Three.js 许可写入交付 HTML 源代码注释。第三方只负责显示；题目识别、模型和答案需独立核验。

## v3 批注调研（2026-11-09）

- [Excalidraw](https://github.com/excalidraw/excalidraw)：研究白板交互与本地保存方式；完整编辑器超出暂停帧批注需要，本版未引入其代码或运行时。
- [Signature Pad](https://github.com/szimek/signature_pad)：研究 Canvas 笔迹数据与缩放处理。本版需要擦除、时间/参数绑定及暂停帧恢复，采用自行实现的轻量层，未复制该项目代码，不声称集成。
- [Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)：鼠标、触控笔及触摸统一事件，使用 pointer capture 与 touch-action 避免画笔触摸触发视角控制。
- [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)：持久化行为及 file:// 限制。保存失败提供明确反馈与 JSON 导出，不承诺浏览器退出时出现可定制保存对话框。

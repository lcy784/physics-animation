# 离线网页接口

本技能附带一个可直接使用的浏览器外壳，不包含通用解题器。先完成物理模型，再按此接口提供题目文件。不要在 UI 层再次解方程。

## 输入文件

### lesson.json

字段：`title` 必填；`subtitle`、`source`（页码/题号与来源状态）、`sceneNote`、`modelHtml`（关键条件/模型）、`solutionHtml`（各小问推导）、`limitationsHtml`（演示假设/边界）。HTML 字段仅放 AI 编写且已检查的静态正文；题目中的不可信 HTML 先转义，不带入脚本或事件处理器。

### model.js

定义 `globalThis.PHYSICS_MODEL`，并可用 `module.exports` 导出同一个对象以便 Node 验证。计算模块不访问 DOM，不依赖 Three.js。

- `defaults`: 独立输入的默认值。
- `parameters`: `{key,label,unit,min,max,step}` 的数组；也支持 `{key,label,options:[[value,label],...]}` 下拉框。值使用数值；可选 `mode` 用于按 `params.mode` 显隐。validate 必须在模型层实现，拒绝非有限/越界输入。UI 显隐不是约束检查。
- `presets`: 可选 `{label,values}` 数组，用于有教学意义的原题参数或探索特例。
- `create(params)`: 验证参数并返回一个模拟对象。它含 `duration`（物理秒）、`events:[{t,label}]`（含起点终点、按时间排序）、`state(t,side='right')`、`plots` 及派生量。
- `state`: 任意时刻可重复查询；返回 `{t,...物理状态}`。用于绘图的标量键应直接来自模型。若有跳变，`side='left'` 必须提供左极限；默认右侧。不要对冲量事件跨界平滑插值。
- `plots`: `{title,xKey?,discontinuous?,series:[{key,label,color}]}`。默认横轴物理时间 t；可指定 v 等单调物理量。对于非单调横轴或额外复杂图，针对题目扩展外壳并实测。有跳变设 discontinuous，外壳在事件处断开线段。
- `present(sim,state)`: 返回 `{heading,text,equation,note,values,results}`；后两项为 `[中文标签,数值,单位]` 数组。文字只能描述 state/派生量，不能另算物理或掩盖未解决条件。
- `lessonSteps(sim)`：新题必需，返回参数相关的状态—过程交替分析；字段和暂停批注集成见 [工作台与批注接口](workspace-and-ink.md)。

外壳会在改参数后重建模型并回到起点。使用讲解模式时，在下一关键事件暂停；暂停后继续跳过已经到达的事件。

### scene.js

定义 `globalThis.PHYSICS_SCENE={build(sim,kit){...; return {update(state){...}}}}`。

场景以物理坐标映射为显示坐标，可归一化以便适配尺寸，但要标明示意比例。相机是独立变量；update 只更新显示，不改变模型。

`kit` 提供：

- `T`（Three.js）、`add(object)`、`box(w,h,d,color,opacity)`、`sphere(radius,color)`；返回可更新的对象。
- `line([[x,y,z],...],color)` 与 `setLine(object,points)`；颜色为数值 RGB。
- `label(text,[x,y,z],cssColor,scale)`：面向相机的标签，标签布局需逐题检查。
- `arrow(color,id,label)`、`setArrow(arrow,origin,delta)`：delta 长度为显示长度，零长度隐藏；在 sceneNote 说明每类箭头的标尺。方向必须由对应物理量确定。
- `frame([cx,cy,cz],[宽,高])`：设定初始中心和包围范围；`view('front'|'oblique'|'side'|'top')`；`listVectors()`、`setVector(id,visible)`、`registerVector(object,id,label,color?)`。

每次重建外壳会释放场景旧资源。`physicsDebug` 提供只读入口（params、sim、state、time、playing、camera、renderInfo），便于实际浏览器核验，产品 UI 不暴露这些实现细节。

## 打包与依赖

`scripts/build_html.py` 只用 Python 标准库，读以上三个文件与内置资源，输出完整单 HTML。Three.js 和控制器已固定版本内嵌，生成时也不需要联网。最终 HTML 必须在浏览器离线实测，依赖 WebGL 2；无法初始化时外壳明确提示，保留数值界面，不冒充完整三维成功。

## 旧版分解数据接口（可选，不自动生成分区）

`lesson.json.visualPlan` 是非空数组，每项包含非空字符串 `id, question, law, assumptions, quantities, encoding, target, interaction, expected, test`，见 law-to-visual.md。target 填实际存在的 viewport、plots、stage-steps 或经扩展核验的场景目标；不要求创建分解面板。打包器强制检查字段完整性，语义与画面另行验收。

兼容旧模型时可保留 `mechanism(sim,state)`，返回 `{nodes,panels,feedback,links?}`。nodes 为 `{id,label,value,unit,law}`；value 必须有限。panels 每项有 `{id,node,type,title,note}`；node 绑定规律节点。点击节点高亮对应面板；一图涉及多个节点时提供 `links:{节点ID:[面板ID]}`。可选 `sceneAdapter.setFocus(id)` 用于场景联动。

可复用面板类型（具体结构参见 assets/mechanism-kit.js）：

- balance：`terms:[{label,value,color}],total,unit,scale,resultLabel?`。共用零点、单位与标尺；和应等于 total。标尺随时间变化必须明示。
- flux：`rangeMin,rangeMax,fieldStart,fieldEnd,back,front,previousBack,previousFront,delta:[{from,to,kind}],fieldSamples?:[{x,normalized}],caption,deltaCaption`。kind 为 gain/loss；有限时间增量不冒充导数。场强圆点是示意标记，不把非均匀磁场画成均匀场。
- relative：`active,contact,vBall,vBoard,speedScale,compression,compressionRate,freeLength`。同起点速度比较与固定支点的相对几何；不冒充惯性参考系受力图。未接触、接触中与分离后必须区分；分离后的相对速度不再等于弹簧压缩率。标明瞬时共用标尺。
- energy：`total,rows:[{label,time,terms:[{value,color}]}],legend`。每行各项和等于同一 total；对照行须明确同时间还是同事件对齐，并分别给真实时间。
- vectors：`vectors:[{dx,dy,label,color}],caption`。局部剖面投影示意。

可选 `sim.playbackScale(t)` 返回正数，在自动慢放开启时乘以用户选择倍率，仍以真实物理秒计时。事件前后按钮定位所选事件两侧。只看图模式收起长说明，保留符号图例与视觉面板。`physicsDebug.visual` 与 `.focus` 供浏览器测试。

验证命令：`node scripts/check_model.cjs model.js cases.cjs report.json`。cases 导出 `cases:[{name,params,check(sim,state,{near,ok}),final(sim,{near,ok})}]` 与可选 `extra(model,{near,ok})`；至少提供独立物理不变量和极限检验，不能只比较实现抄录的公式。执行的模型与用例必须是本地可信代码。通用检查无法替代题目的正确建模、视觉审查与浏览器操作。

## 逐项矢量控制（默认）

每个 k.arrow 必须提供稳定 id 和清晰中文 label；同一物理量的多个箭头可共用 id，例如电流方向。不同物体的速度、不同受力分别使用 ID。k.registerVector 将专属文字标签纳入同一显示组。外壳调用 vector-controls.js 自动创建复选框；无需每题重写 DOM。显示组控制用户偏好，子箭头 visible 控制实际物理非零条件，二者不可互相覆盖。重建场景保留相同 ID 的偏好。模型重算与相机、数值、曲线不受勾选影响。

## v3.2 独立标注

`kit.label(text,pos,color,scale,id?,choice?)` 返回可移动的文字 Sprite，并自动注册独立标注组。默认 id 与选项名取 text；会随参数变文字或相同文字出现多次时，必须显式传稳定且唯一的 id 与 choice。外壳通过 label-controls.js 自动生成复选框；无需每题重新编写界面。`listLabels()` 返回 enabled（用户选择）与 visible（实际可见），`setLabel(id,on)` 切换偏好，`registerLabelObject(object,id)` 将参考线等加入同组。

不要在更新函数覆盖标注组的 visible；物理适用性写在原 Sprite 的 visible 上。矢量专属标签同时受独立标注组和所属矢量组约束：关文字不关箭头，关矢量则文字一起隐藏；重开矢量不能复活用户关掉的文字。清除场景仅清注册对象，保留按 ID 存储的显示偏好。批注时改标注设置应退出旧暂停图，重新进入批注才截取新显示状态。

# 离线依赖维护

普通使用不需要重新构建依赖。Three.js 与控制器已放在 assets/vendor，Python 打包器只读取它们。

## 固定来源

- `three@0.180.0`，tag r180。
- `esbuild@0.25.10`，仅为开发工具。
- 入口：`assets/vendor/entry.js`。
- 产物：`assets/vendor/three-controls.min.js`；入口设置 `globalThis.PHYSICS_VENDOR`。
- 原包摘要与 npm 完整性：`assets/vendor/provenance.json`。

## 重建步骤

在干净的临时开发目录安装固定版本，并复制 entry.js 到该目录，执行：

```text
npm install --save-exact three@0.180.0 esbuild@0.25.10
npx esbuild entry.js --bundle --minify --format=iife --outfile=three-controls.min.js
```

这给出了重建方式；原始构建命令、运行平台与所有标志未完整记录，不保证重建文件逐字节相同。本次公开发布整理没有重新打包或升级依赖。

重建后：核对导出 THREE 与 TrackballControls、保留对应版本上游完整许可证、更新 provenance 中的版本/完整性/SHA-256，并用新产物构建题目、实际检查离线浏览器交互。不要仅修改摘要以掩盖未知文件变化。新版本不要直接覆盖旧包而保留旧来源记录。

若新增其他库，更新 THIRD_PARTY_NOTICES.md 和许可文件；调研参考不能直接视为已有代码复用授权。

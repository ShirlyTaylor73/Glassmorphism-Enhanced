# Third-Party Notices

Glassmorphism Enhanced is an enhanced fork, not a clean-room or wholly original implementation. The upstream Git history and root `LICENSE` are retained.

## Komari Glassmorphism

- Project: <https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism>
- Role: main upstream and complete code base
- License: MIT
- Copyright notice: Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com)
- Upstream maintainer attribution: sanrokamlan

The complete upstream history, copyright notice, and MIT license remain in this repository. Glassmorphism v3.3.7 (`bf8376587c720de915ac48789a8a180357c762d6`) is the release baseline for v3.3.7-enhanced.1.

## Three-Network Fork

- Project: <https://github.com/vlongx/komari-theme-Glassmorphism-three-network>
- Reviewed revision: `2f172e7f9e8a87e0e3a1d0c5c2d2ef3555278b9c`
- Role: source/reference for carrier task-name matching, carrier latency/loss presentation, per-carrier history blocks, multi-task aggregation behavior, and the emerald-style default background treatment
- License: MIT
- Copyright notice in that repository: Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com)

Relevant ideas and portions were selectively adapted into new utilities/composables and the current upstream components. Old `NodeCard.vue`, `useNodePingStats.ts`, and other core files were not copied wholesale over the newer Glassmorphism implementation.

## Komari Emerald

- Project: <https://github.com/Tokinx/komari-theme-emerald>
- Reviewed revision: `1372043e8675af8d522db5cd279bbea7e7bafc00`
- Role: visual/algorithm reference for automatic globe arcs
- License: MIT
- Copyright notice: Copyright (c) 2026 Tokinx

Emerald's current region-to-visitor hub-and-spoke behavior was studied as a visual reference. Glassmorphism Enhanced implements its own deterministic node-cluster arc generation and reuses the Glassmorphism realistic, Cobe, and tiled renderers; the Emerald globe component was not copied wholesale.

## License compatibility

All three reviewed projects use the MIT License. The licenses permit use, modification, distribution, and sublicensing provided their copyright and permission notices are retained. The upstream root `LICENSE` is unchanged; this file records the additional provenance and attribution relevant to the enhanced patches.

## 保留的 Komari Web PWA 图标

- 来源：<https://github.com/komari-monitor/komari-web>，原内嵌快照 `ebfbd3e079f8777a746276fe67429b519024f7c7`。
- 当前用途：`public/images/pwa/icon-512.png` 及由它缩小的 192px 图标。完整内嵌前端已移除，保留此来源说明；原项目署名不因后台清理而改写。

## GlassOps 默认背景

- 来源：本地 `komari-glassops`，提交 `c5ba36a`（v1.0.10）。
- 复用：`default-background-v2.webp`、浅深色滤镜与移动端定位；不复制卡片、地球或后台实现。
- 许可证：MIT。Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com)，保留根 LICENSE。
- 背景图 SHA256：42377961822666817def3d3b51b2c236a0f5f631dd1475535d9438a6b7ac551b

## GlassOps 卡片展示参考

- 来源：本地 komari-glassops c5ba36a，NodeCard.vue 的两行标题、IPv4/IPv6 非空徽标及明暗指标/实时速度色阶。
- MIT，Copyright (c) 2025 Tony Liu (tonyliuzj, tony-liu.com)。仅移植展示，保留本主题月流量计算及三网/中转来源，不复制其长卡片业务链。

- 顶部统计卡片的浅色渐变、内高光与柔和阴影同样参考其 general-metric-card 样式，底色和边框继续使用本主题共享配色变量。

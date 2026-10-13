# Changelog

All notable Glassmorphism Enhanced changes are documented here. Upstream history remains in the upstream repository and preserved Git history.

## 1.0.11 — 2026-10-14

- 到期黄色提醒扩大至剩余 6–15 天，5 天内及已过期仍为红色；共享阈值同步卡片、列表和详情。
- 首页卡片标题移除架构及前置分隔点，系统与协议徽标保留。
- 联通延迟/丢包标识点改为紫色，不改变历史色条或告警阈值。
- mini 完整显示 CPU、内存、流量标签，标签与百分比各一行，窄屏进度条对齐。
- 新增期限边界和 mini 标签回归；完整测试 133 项通过，1 项旧图标语义断言更新后重跑通过。未改视觉基线或阈值。

## 1.0.10 — 2026-10-14

- 顶部统计卡片复用节点卡片玻璃底色和边框，浅色增加细渐变、内高光和柔和阴影，明暗边界更清晰。
- 正常内存百分比与上传速度在明暗模式统一使用粉色 #D64B91，严重使用率及到期告警仍保留红色。
- CPU 逻辑核心数统一格式为 `X Core`（如 `2 Core`），无效值仍为 —。
- 不修改统计计算、三网请求、价格权限或布局。统计卡片阶段完整回归 132/132，最终粉色专项 2/2；lint/type-check/build 通过。

## 1.0.9 — 2026-10-13

- 首页卡片参考 GlassOps 调整标题：国旗、名称、系统与架构，右侧收藏、在线状态及 V4/V6 徽标，双栈并排。
- CPU 下方平均负载改为探针 cpu_cores 对应的逻辑核心数，如 2core；缺失或无效显示 —。
- 百分比采用指标语义色阶，实时上传粉红、下载青色；保留严重告警、流量计算、价格隐私和三网/中转。
- 恢复自动改为图标按钮，保留悬停提示和无障碍名称。
- 完整 Playwright/visual 132/132 通过，未修改本轮视觉基线。

## 1.0.8 — 2026-10-13

- 修复明暗按钮提示与点击目标不一致，以及深色切到自动仍显示深色的问题；普通点击始终反转实际颜色。
- 图标和提示统一表示目标颜色，手动模式增加“恢复自动”，保留本地选择及后台/北京时间自动规则。
- 默认背景采用 GlassOps 同一 WebP、明暗滤镜和移动端定位，保留卡片、地球与自定义媒体；视频加载和失败使用对应默认背景。
- 增加连续切换、自动恢复、跨时区边界、媒体回退和移动端键盘回归。

## 1.0.7 — 2026-10-13

- 后台入口始终显示，忽略旧隐藏入口开关，点击直接进入 Komari 官方 `/admin` 登录流程。
- 移除完整内嵌官方前端、重复公开首页、后台皮肤及同步脚本；旧入口只保留固定跳转兼容页。
- PWA manifest 与 192/512 图标独立迁移，保留 standalone 和 iOS safe-area；安装包减少约 27.9%。
- 主题作者与仓库链接更新为 ShirlyTaylor73，保留原始版权及第三方署名。
- 完整 Playwright/visual 104/104 通过，截图基线未改。价格隐藏仍是主题展示策略，不改变匿名 API 权限。

## 1.0.6 — 2026-10-12

- 修复月流量在共享请求池中嵌套占位导致三网延迟长期加载的问题。
- 三网请求优先调度；全局并发上限保持 8，首页与详情月流量共同最多占用 2 个名额。
- 修复详情历史兼容回退、Ping 历史取消和同键任务重建的生命周期问题。
- 保留每台机器的流量周期、同周期合并、缓存、迁移日期及三网算法，无需新增配置。
- 新增 12 项回归测试；完整 Playwright/visual 93/93 通过，未更新截图基线。
- 本版本发布至 `ShirlyTaylor73/Glassmorphism-Enhanced`，保留原作者及许可证署名。升级注意事项见 `docs/release-notes-v1.0.6.md`。

## 1.0.5 — Unreleased

### Transit rule format change — manual migration required

- Change the Transit Carrier Ping rule format from **target | relay | task** to **relay | target | task**: old `TargetNode|RelayNode|Task`, new `RelayNode|TargetNode|Task` (recommended example: `RelayNode|TargetNode|Relay-Target`).
- Existing configurations **must manually swap the first two columns** before using v1.0.5. There is no automatic migration, legacy-order autodetection, or backend configuration rewrite.
- Keep deterministic duplicate handling: the last valid rule for each target wins; multiple targets can share one relay. Invalid rows do not erase earlier valid rules.
- Synchronize current manifest, README, configuration help and release documentation to v1.0.5. Preserve latency/loss calculations, shared Ping caches, direct/unmatched behavior, traffic migration, finance, safe-area, admin-login and owner preview. No Server/Agent changes.

## 1.0.4 — Released

- Protect the sticky header from viewport safe-area overlap, including translucent iOS standalone status bars, without device/version detection or duplicate page padding.
- Verify the native session before admin navigation. Guests use the bundled official homepage's native login (an additional login click); native login returns to `/admin`. No invented login route, return-url parameter, credential storage or Server/Agent changes.
- Synchronize the README release badge and independent manifest version. Preserve v1.0.3 traffic migration, finance, Transit and owner preview.

## 1.0.3 — Released

Hotfix for the v1.0.2 production regression. Validated compatibility target: Komari Server 1.5.0. No Komari Server or Agent changes are included.

### Fixed

- Monthly traffic no longer refreshes the full shared usage path on every one-minute clock tick. The clock only detects a renewal-cycle key change; normal refresh is bounded to a five-minute policy and a ten-minute usage cache.
- Shared/home traffic usage now prefers one batched `public:queryMetrics` request and falls directly back to the v1.0.1 cumulative display when the metric method or a node's required traffic series is unavailable. Automatic per-node full-cycle `common:getRecords` fan-out is removed from the shared path.
- Existing traffic values remain visible while a monthly request is pending or fails; loading no longer flashes `0` usage when legacy cumulative data is available.
- Explicit detail usage may still use a single-node bounded history compatibility path; it is not used by home/shared polling and remains request-deduplicated.

### Incident

- v1.0.2 could create excessive frontend request pressure: the shared monthly clock refreshed every minute while its cache expired after 30 seconds, and missing metric data could fan out full-cycle history requests for many nodes. The resulting shared request-pool/backend pressure was consistent with missing monthly traffic, delayed Ping/three-network data, and a theme upload appearing stuck at 100%. There is no evidence that v1.0.2 wrote, reset, or corrupted Komari cumulative counters or database data.

### Compatibility

- Annual billing still uses a monthly traffic renewal window derived from the UTC `expired_at` calendar day; 29/30/31-day short-month clamping and later restoration remain unchanged.
- SGD/S$ support remains compatible with C$ (CAD) and `$` (USD).
- Komari Server 1.5.0 latest status payloads without `traffic_up/down` remain supported. Agent v1 protocol changes are separate from the theme's RPC and frontend fallback layers.
- The v1.0.3 migration is forward-only: the fixed package rollout anchor is `2026-09-16T00:00:00.000Z`; a cycle that started before it remains on legacy cumulative display until its next renewal boundary. The anchor is package/build data, not browser storage or a server-side write.

### Finance audit

- Existing `monthlyCost`, yearly/remaining-value calculations, currency normalization, and exchange-rate formatting are stateless views of current node metadata and rates. No new renewal-cycle finance snapshot was introduced; the forward-only migration gate applies to the new monthly traffic derivation only.

## 1.0.2 — Released

Validated compatibility target: Komari Server 1.5.0. The theme keeps the existing RPC and legacy frontend fallback paths for older compatible servers.

### Fixed

- Monthly traffic quota usage now derives from the active renewal-day window instead of treating persistent `net_total_up/down` counters as the current month. Annual billing still rolls the traffic window monthly; the renewal calendar day is clamped to the last day of short months and restored in the next long month.
- Monthly usage is loaded through the shared metric/history derivation layer: Komari 1.5.0 uses `traffic.up` / `traffic.down` SUM series and adds every returned bucket; a node with a missing or all-null metric series falls back individually to the bounded network-history compatibility path, whose first request includes both the active `start/end` and a safe covering `hours` window before strict client-side filtering. Only additive `traffic_up/down` deltas are used; if no cycle delta is available, the previous cumulative display is retained and identified internally as the legacy fallback.
- Added Singapore Dollar support to finance parsing and formatting: `SGD` and `S$` normalize to `SGD`; existing `$` (USD) and `C$` (CAD) mappings remain unchanged.

### Compatibility

- The theme does not depend on `traffic_up/down` in `common:getNodesLatestStatus`; Komari 1.5.0 latest status payloads without those fields are supported.
- Cumulative `net_total_*` source data is never reset or written back. Komari Agent v1 protocol removal is independent of the theme's RPC and frontend legacy fallback compatibility.

## 1.0.1 — Released

Upstream base: Glassmorphism Enhanced v1.0.0 (`42e0190b1812edfb95fe90c518e84cb063ae2939`).

### Fixed

- Simplified Transit current-value and history Tooltips: current values retain only carrier, Transit marker, Relay and the two-segment RTT expression; history cells retain carrier, Transit marker, timestamp and estimated value without repeating the link task or diagnostic breakdown.
- Fixed a confirmed long-running history alignment bug where two 20-slot histories with small timestamp drift could lose a slot. Each segment is now normalized by its own ordered slots while disjoint time windows remain uncombined.

### Documentation

- Rewrote README as a project homepage based on current behavior, including Transit limitations, `nodes.visibleNodes` Hidden Relay protection, direct compatibility and the `1.0.1` release path.
- Corrected release documentation to describe the actual `main`-push-only automation.

### Changed

- Replaced `docs/preview.png` with the owner-provided 1280×720 production Komari screenshot. The asset is copied unchanged; no fixture, AI-generated or synthetic image is used.

## 1.0.0 — Released

Upstream base: Glassmorphism v3.3.7.

- Establish an independent SemVer line: bugfix `1.0.x`, compatible features `1.x.0`, breaking changes `2.0.0`. No `-enhanced.x` suffix; upstream versions are provenance only.
- Preserve upstream attribution: original theme author **Tokinx** and upstream maintainer **sanrokamlan** remain credited in README, LICENSE, THIRD_PARTY, Git history, and this changelog; changing the manifest maintainer to `casiuna` does not remove that provenance.
- Rename the Fork to `casiuna/Glassmorphism-Enhanced`; unify the public name as **Glassmorphism Enhanced**. Keep internal `short: Glassmorphism` and ZIP layout for compatibility.
- Add optional Transit Carrier Ping: exact-name rules, one relay source shared with existing Ping caches, Metric/Legacy fallback, no backend changes.
- Estimate RTT by adding segments and loss by multiplying success probabilities; align history on a common 20-slot timeline and preserve missing data.
- Mark estimates explicitly, include relay/segment tooltips, suppress derived volatility, and fail safely for missing/ambiguous relays/tasks or offline relays.
- Rewrite README as a project homepage with generic configuration examples and migration guidance.
- Preserve all historical tags/releases, including `v3.3.7-enhanced.1`. The independent release history starts at `v1.0.0`; no tag or Release is created by this review task.

## [3.3.7-enhanced.1] - 2026-08-28

Based on Komari Glassmorphism v3.3.7 (`bf8376587c720de915ac48789a8a180357c762d6`).

### Added

- China Unicom, China Telecom, and China Mobile latency panels.
- Per-carrier packet-loss panels and Ping history blocks.
- Case-insensitive carrier task matching for Chinese and English aliases.
- Aggregation when one carrier has multiple Ping Tasks.
- Automatic, persistent, upstream, and off globe arc modes.
- Deterministic, deduplicated, bounded automatic globe connections.
- Shared upstream-tag parser for advanced topology and globe arcs.
- Three-network emerald-style light/dark default background.
- Deterministic Playwright coverage for carrier, globe, topology, missing-geo, no-task, and mobile scenarios.

### Preserved

- Glassmorphism v3.3.7 cumulative traffic history fix and current Metric Store behavior.
- Ping Task backend ordering and legacy API fallback compatibility.
- Existing realistic, Cobe, and tiled earth renderers.
- `upstream:NodeName` / `上游:NodeName` topology semantics.
- ASN/BGP topology and authenticated advanced tools.
- Existing theme settings, responsive layouts, and light/dark behavior.

### Changed

- Public Ping Task metadata is cached and shared so carrier derivation does not create per-node duplicate task-list requests.
- Node geo resolution can try another available IP candidate after a failed lookup instead of excluding a node solely because its IPv4 is private.
- Theme display metadata identifies the project as Glassmorphism Enhanced while retaining the internal `short` identifier `Glassmorphism` for Komari compatibility.

[3.3.7-enhanced.1]: https://github.com/casiuna/Glassmorphism-Enhanced/releases/tag/v3.3.7-enhanced.1

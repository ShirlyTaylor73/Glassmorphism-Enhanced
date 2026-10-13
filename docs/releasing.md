# Releasing Glassmorphism Enhanced

## 当前发布：v1.0.9（2026-10-13）

已发布且标记 Latest：[v1.0.9](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/releases/tag/v1.0.9)，main/Tag 为 `d83f1ba`。[Code Quality](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/actions/runs/38382772234) 手动运行成功，本地 132/132。自动 push 工作流仍未启动，本次手动 Tag/Release；附件下载 SHA256 与 GitHub/本地一致，5,924,438 bytes。

用户授权将卡片标题/协议徽标/核心数/配色与恢复自动图标发布为 v1.0.9，目标 ShirlyTaylor73/Glassmorphism-Enhanced。说明见 [v1.0.9](release-notes-v1.0.9.md)。不覆盖历史 Tag；读取实际 Actions 运行，必要时手动 Code Quality 成功后正常 Git/gh 发布。

## 历史发布：v1.0.8（2026-10-13）

已发布：[v1.0.8](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/releases/tag/v1.0.8)，main/Tag 指向 `98bdcaf`。[手动 Code Quality](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/actions/runs/38353938081) 成功；push 无自动运行，本次手动发布。本地 125/125；下载附件与本地及 GitHub digest 一致，5,923,398 bytes。

用户已授权修复、推送并发布，目标仅 ShirlyTaylor73/Glassmorphism-Enhanced。内容为点击目标/实际明暗一致、恢复自动及 GlassOps 默认背景，说明见 [v1.0.8](release-notes-v1.0.8.md)。保持旧 Tag；以实际 Actions 状态决定等待自动发布或手动 Code Quality 后发布，不绕过失败检查。Git 本地代理暂不可用时只对单次命令使用 `-c http.proxy=`，不修改全局代理或凭据。

## 历史发布：v1.0.7（2026-10-13）

已发布：[v1.0.7](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/releases/tag/v1.0.7)，main/Tag 指向 `3616cc6`。[手动 Code Quality](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/actions/runs/38278633399) 成功；push 未触发自动流程，本次为手动 Tag/Release。本地 104/104，下载 ZIP 与 GitHub digest/本地字节一致，5,923,917 bytes。

用户已授权向 ShirlyTaylor73/Glassmorphism-Enhanced 推送并发布后台入口清理和作者信息更新。版本 1.0.7，说明见 [release notes](release-notes-v1.0.7.md)。保留旧 Tag，读取 Actions 实际状态，不把工作流 active 当作执行成功；必要时手动质量检查与发布。下方 1.0.6 是历史记录。

## 历史发布：v1.0.6（2026-10-12）

发布已完成：[v1.0.6](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/releases/tag/v1.0.6)，main/Tag 对应 `9ab24bc`。两次 push 没有创建自动运行，最终使用正常 Git/gh 手动发布；手动 [Code Quality](https://github.com/ShirlyTaylor73/Glassmorphism-Enhanced/actions/runs/38271532576) 通过，本地 Playwright/visual 93/93 通过，未声称远端视觉运行。附件下载 SHA256 与 GitHub digest、本地包一致。下面保留准备阶段事实。

- 用户已授权向自己的 `ShirlyTaylor73/Glassmorphism-Enhanced` 推送并发布，选择版本 1.0.6。此次授权替代下方历史任务的 review-only 边界；不向原作者仓库写入。
- origin fetch/push 均为该仓库；GitHub 登录 ShirlyTaylor73，viewerPermission ADMIN；发布前远端 main 为 3bb76d9，尚无 Tag/Release。
- 工作流文件与远端一致：main push 匹配 Code Quality、Visual Regression、Release On Version Bump；修复分支 push 和 tag push 均不匹配。发布流程计算但未使用 version_changed 作为门槛；已有同名 Tag 若指向其他提交会失败。
- Actions 仓库权限已开启，但检查时 workflow API 列表为空；必须在推送后检查实际注册、运行与发布，不能只依据 YAML 宣称成功。
- 首次 main push（8382a42）之后三个 workflow 已登记 active，但 runs/check-runs 都为空；通过本次发布交接记录的后续正常 push 再次触发，发布结果以远端实际运行和资产为准。
- 首选 main 快进触发自动发布 v1.0.6；若 fork 工作流尚未激活，先完成已存在工作流的激活并验证运行。Tag 与附件必须对应最终 main SHA，不覆盖历史 Tag。
- 发布说明见 [v1.0.6](release-notes-v1.0.6.md)。原作者署名和许可证不变；下方内容属于此前原作者 fork 的历史交接。

## 历史：v1.0.5 发布交接

Repository: https://github.com/casiuna/Glassmorphism-Enhanced

Current delivery branch: **`release/v1.0.5`** in this fork. The temporary safety branch was retired only after the standard branch was read back at the verified v1.0.5 candidate SHA. Keep manifest **`1.0.5`** and the future Git tag / Release **`v1.0.5`**; temporary names are not release identifiers.

All writes must target **`casiuna/Glassmorphism-Enhanced`** only. Upstream is read-only: no upstream PRs, pushes, issues, comments or reviews. This branch-normalization pass creates no PR in any repository and does not revisit the unrelated upstream PR cleanup.

## Independent version policy

The independent version line began at **1.0.0**, which is released as Git tag / GitHub Release **v1.0.0**. The owner-approved version for this review is **1.0.5**, based on released **1.0.4**. `komari-theme.json.version` is the sole source of truth; do not add `package.json.version`.

- Bugfix: `1.0.1`, `1.0.2`, `1.0.3`, …
- Compatible feature: `1.1.0`, `1.2.0`, …
- Breaking change: `2.0.0`.
- No `-enhanced.x` suffix and no upstream version in our release number.
- Upstream base: Glassmorphism v3.3.7. Record future upstream provenance in CHANGELOG / AICACHE, independently of our SemVer.
- Keep the historical `v3.3.7-enhanced.1` tag/Release. Numeric comparison against the old line must not be used to select the independent release.

## Tag namespace sanitation

The fork's inherited upstream SemVer tags were audited before the independent release line was reopened. The 43 inherited original tags are preserved as `upstream-<original-tag>` refs and removed from the fork's original namespace. Existing release tags, including `v1.0.0` through `v1.0.4`, `v3.3.7-enhanced.1`, `upstream-v1.0.0`, and `komari`, remain protected; `v1.0.5` is the next intended Enhanced release namespace and must be checked for collisions before publication.

## v1.0.5 Transit configuration migration

Old format: `TargetNode|RelayNode|Task`. New format: `RelayNode|TargetNode|Task`, for example `RelayNode|TargetNode|Relay-Target`. Existing configurations must **manually swap the first two columns** before using v1.0.5; do not claim automatic migration. No old-order autodetection or backend writes are performed. The last valid row per target still wins, and multiple targets may share one relay. See [Transit rules](transit-rules.md) and the [v1.0.5 release notes](release-notes-v1.0.5.md).

## Komari 1.5.0 compatibility and monthly traffic

The validated compatibility target for this bugfix is **Komari Server 1.5.0**. The theme does not depend on `traffic_up` / `traffic_down` in `common:getNodesLatestStatus`; those latest payloads may contain only persistent `net_total_up` / `net_total_down` counters. Monthly quota usage is derived through the existing shared `public:queryMetrics` path using `traffic.up` and `traffic.down` with `aggregation=sum`, and every returned SUM bucket is accumulated.

The monthly window uses the existing `expired_at` calendar day as the renewal-day anchor. Annual billing changes the fee cycle only; traffic still rolls monthly. Short months clamp day 29/30/31 to the last day, and the original day is restored in the next month that contains it. The cycle starts at UTC midnight so Komari's UTC-aligned rollup buckets do not include the previous calendar day.

If `public:queryMetrics` is unavailable, or a node has no usable traffic series in a successful batch, shared/home contexts immediately use the v1.0.1 cumulative display and do not fan out `common:getRecords` history requests. An explicitly opened single-node detail context may use the existing bounded range/history compatibility path, which sends both the active-window `start/end` and a safe covering `hours` value, filters returned network records to the active window, and sums only `traffic_up` / `traffic_down` deltas. This history path is not described as un-reconstructed or error-free data because Komari may reconstruct records through its metric store and rollups. If no cycle delta is available, the cumulative display remains the explicit legacy fallback. This is separate from Komari 1.5.0 removing the Agent v1 protocol; the theme's frontend/RPC fallback is not an Agent protocol fallback.

## v1.0.2 incident and v1.0.3 hotfix

The v1.0.2 production regression was frontend request pressure: the shared monthly clock refreshed every minute while the traffic cache expired after 30 seconds, and missing metric data could start one full-cycle history request per node from the shared path. This could monopolize the shared request pool and delay monthly traffic, Ping/three-network data, and theme upload completion. There is no evidence of database corruption or writes/resetting of `net_total_*`; v1.0.3 addresses availability by using metric-to-legacy on shared paths, preserving legacy values while loading, and restricting history fallback to one explicitly opened detail node.

The v1.0.3 migration is forward-only. Its production package uses the fixed UTC rollout anchor `2026-09-16T00:00:00.000Z`: if the current cycle started before that anchor, traffic remains on the v1.0.1-compatible cumulative display and is not reconstructed on upgrade; the first cycle whose UTC renewal start is at or after the anchor activates the new monthly logic. Visual regression builds use a separate fixed test anchor only to keep the repository's historical July fixtures deterministic; this does not affect the production build. Existing finance calculations are stateless current-metadata/rate formatting, so the migration gate is intentionally traffic-only.

## Review gate

The v1.0.5 candidate is maintained on this fork's `release/v1.0.5`. The owner decides when and how to merge it into this fork's `main`; no PR is created by this agent pass. Direct pushes to `main`, unprotected force-pushes, manual tag creation and manual Release publication are outside this pass. After the owner's merge, this fork's main-push-only workflow owns publication.

The existing `Release On Version Bump` workflow runs on pushes to `main` only; it does not use `workflow_dispatch`. The owner's future merge of `release/v1.0.5` into **`casiuna/Glassmorphism-Enhanced:main`** would change the manifest from `1.0.4` to `1.0.5`. The workflow derives `release_tag=v${currentVersion}`, builds the theme, creates the missing annotated **`v1.0.5`** tag at the resulting main SHA, then creates/updates the Release in this fork and uploads the commit-matched ZIP. An existing tag is accepted only if its peeled commit matches that main SHA; otherwise the job fails. The agent does not execute the merge, create/move tags, or publish a Release. Release assets must come from the resulting main commit, not an earlier branch candidate.

## Verification

```sh
bun install --frozen-lockfile
bun run lint
bun run type-check
bun run build
bun run test:visual
git diff --check
```

Inspect the ZIP, not just `dist/`: top level must be exactly `komari-theme.json`, `preview.png`, `dist/`. Keep `short: Glassmorphism` and `komari-theme-Glassmorphism-build-<short-sha>.zip`. Rebuild after the final commit so the filename identifies the reviewed commit, then compute SHA-256. Preserve the MIT license and THIRD_PARTY attributions.

Read the exact branch ref back from this fork after pushing. After the owner's eventual main merge, verify this fork's Actions, tag target, Release metadata and downloaded asset digest. A local ZIP alone is not proof of a published Release. Do not create a PR or invoke a publication workflow during this normalization pass.

## Identity separation

Git clone/fetch/push use Hermes CLI SSH. GitHub metadata, PRs and Actions queries use an independent, repository-scoped Fine-grained PAT: Metadata Read, Contents Read/Write, Pull requests Read/Write, Actions Read. No Issues permission is needed here. Never place tokens or private keys in source, docs, logs or PR bodies. Repository role flags returned by GitHub are not evidence of a token's exact permission scopes.

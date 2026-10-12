# v3 Architecture

Komari Theme Glassmorphism v3 moves new code toward a layered architecture:

```text
Vue Component
  -> Composable (reactive state and lifecycle)
  -> Service (business logic)
  -> RequestManager / CacheService
  -> API / RPC
  -> Komari backend
```

## Rules

- Components render UI and invoke composables or services.
- Composables own `ref`, `computed`, `watch`, subscriptions, and lifecycle cleanup.
- Services own business logic such as auth, provider metadata, history loading, prediction, snapshot export, cache, and request orchestration.
- Constants belong in `src/constants/`; avoid new magic numbers in components.
- Utils stay pure and framework-light.
- Public routes remain public; sensitive operations require verified auth through the auth service.

## Foundation directories

- `src/services/` — business and infrastructure services.
- `src/constants/` — grouped runtime and architecture constants.
- `src/hooks/` — reserved for future cross-cutting hooks.
- `src/workers/` — reserved for future Web Worker workloads.
- `src/types/` — shared type entry point.

## Core services

- `auth.service.ts` — verified session state, login verification, and permission checks.
- `cache.service.ts` — shared TTL/LRU/reference-counted cache and promise deduplication helper.
- `request.service.ts` — keyed request deduplication, concurrency limiting, abort, timeout, and retry policy.
- `history.service.ts` — load/ping history normalization and request-manager-backed data fetching.
- `prediction.service.ts` — disk growth prediction from normalized history records.
- `provider.service.ts` — provider and geo metadata composition.
- `snapshot.service.ts` — JSON/CSV export composition and download boundary.

## Current M2-M6 scope

M2-M6 build on the v3 foundation without changing the public route contract:

- M2 keeps user interactions stable while routing history-heavy paths through shared request/cache infrastructure and virtualizing dense lists.
- M3 gates private tools, sensitive metadata, snapshot export, and disk prediction through verified auth; ordinary node and Ping history metrics stay public.
- M4 adds configurable presentation options such as card density, quick controls, detail tabs, list metadata, glass colors, and privacy display toggles.
- M5 adds advanced home tools: topology, provider value, health summary, snapshot export, disk prediction, and richer summary cards.
- M6 documents the architecture, auth, cache, data flow, migration behavior, and milestone acceptance points.

New work should continue to use the same layered chain rather than reintroducing component-local request, cache, or permission logic.

## 后台与公开主题的边界（2026-10-13）

后台管理入口始终显示，统一完整导航 `/admin`；服务端默认前端负责登录、后台和终端。主题不再附带 komari-web、不接管后台路由、不提供第二套公开首页。旧隐藏后台入口配置不再消费。

保留 `/admin-app/index.html` 静态固定跳转兼容页，其他内嵌官方资源及同步脚本均移除。主题的 PWA manifest 和 192/512 图标独立放置，原版权/资源来源继续保留。

价格隐藏仍为主题展示策略，不代表匿名 API 已过滤价格。此前内嵌后台/公开首页登录中转的历史说明已被本节取代。

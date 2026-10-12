# Glassmorphism Enhanced v1.0.7

## 修复与清理

- 后台管理按钮始终显示，未登录也能直接进入 Komari 官方 `/admin` 登录流程；不再经过另一套公开首页。
- 移除“隐藏后台入口”设置，已保存的旧配置自动忽略，不需手动清理。
- 删除主题内嵌的完整官方前端及后台皮肤。旧 `/admin-app/index.html` 仅保留固定后台跳转。
- 主题 PWA manifest 和 192/512 图标独立；保留 standalone、iOS safe-area，不改官方 Service Worker。
- 作者与仓库链接为 ShirlyTaylor73，原始版权和第三方来源保留。

## 升级说明

在 Komari 主题管理上传本版本 ZIP。后台和终端由服务端自带前端提供，旧内嵌后台皮肤不再保留。隐藏价格仍仅控制主题展示，不等于匿名 API 过滤价格。

从 1.0.4 或更早版本升级且使用中转规则时，仍需将 `TargetNode|RelayNode|Task` 手动改成 `RelayNode|TargetNode|Task`。

## 验证

- 完整 Playwright/visual 104/104 通过，未更新截图基线；lint、type-check、生产构建通过。
- 真实官方前端的登录/2FA/OAuth-only/会话过期界面在隔离 API mock 下通过；真实生产 Cookie、外部 OAuth 和终端会话不属于该测试。
- 安装包约 5.65 MiB，比原 1.0.6 包减少约 27.9%；保留固定 ZIP 顶层契约。

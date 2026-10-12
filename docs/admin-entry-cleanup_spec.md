# 后台入口与重复官方前端清理规格

- 用户已批准：主题只承担公开监控，后台按钮始终显示，统一导航 /admin。官方服务端负责密码、2FA、OAuth 和鉴权，不自建登录。
- 删除 hideAdminEntryWhenLoggedOut schema/store 及身份分流；旧字段忽略，不写回配置。保留其他权限及价格遮罩。
- 删除 public/admin-app 的完整官方应用、同步脚本、后台 CSS、sync:admin 命令、根入口路由桥接。仅保留原路径的静态兼容页，固定 replace('/admin')、忽略任意参数、尽力清除旧路由键并提供无脚本链接。
- PWA manifest 迁移 /manifest.webmanifest，图标迁移 /images/pwa/icon-192.png 与 icon-512.png，名称 Glassmorphism Enhanced，保留 standalone、start_url=/、scope=/、iOS safe-area；不注册/注销 Service Worker 或清空用户存储。
- 先写失败用例：登录/访客/身份失败、旧隐藏开关三态、价格隐藏与返回、旧链接/禁用存储、PWA 实际尺寸。运行现有完整 Playwright、lint、type-check、build、diff-check，验证 ZIP 内容与包大小。
- 独立检查 1.5.1 服务端真实官方前端登录、密码错误/成功、2FA、OAuth-only、会话过期；mock 只验证 UI，外部 OAuth 和真实生产会话另行记录限制。
- 检查服务端更新安装是否删除旧资源；不修改服务端，不将前端删除等同于价格数据权限。
- 独立分支 fix/admin-entry-cleanup，分阶段 commit，版本保持 1.0.6，不发布/不替换现有附件，交付候选包；保留作者 ShirlyTaylor73 与既有许可证署名。

## 实施验收（2026-10-13）

- Ready for review。规格逐项复核，未改服务端或生产配置；主题作者/URL 保持 ShirlyTaylor73，版本保持 1.0.6。
- 入口相关 16/16，完整 Playwright/visual 104/104，lint/type-check/production build/diff-check 通过；未更新 snapshots。构建仅既有 globe 大 chunk 警告。
- 旧构建的聚焦 5 项中 4 项失败，覆盖旧 true 配置隐藏访客按钮、两种旧入口未固定跳转、PWA 引用旧目录；修改后全部通过。
- ZIP 359 entries（此前 772），约 5.65 MiB（此前 7.83 MiB），减少 27.9%；CRC、manifest、preview/dist 字节一致性、192/512 图标尺寸通过。admin-app 仅保留 index.html，生产 JS 无旧配置/路由键。

### 独立官方前端检查与限制

- 检查对象为现有 Komari 1.5.1 站点实际提供的官方 entry-index-ExYZxuwU.js，不是已删除的旧内嵌前端；/admin 最终进入 /admin/dashboard，/terminal 也返回同一服务端资源入口，HTTP 200，无主题桥接。
- 在新建隔离 Chrome context 中阻止 Service Worker，拦截全部 /api/ 请求，禁止非同源及非 GET 外部请求。仅真实加载官方 HTML/静态资源，不向生产发起登录提交。
- 4 组 UI 集成通过：密码错误→要求 2FA→错误验证码→成功；OAuth-only 隐藏密码输入并进入被拦截的 OAuth 边界；已登录刷新→会话过期自动弹框；匿名自动弹框。报告位于本地 test-results/native-admin-check.json。
- 未使用生产凭据，真实 Cookie 会话建立、外部 OAuth 授权、终端 WebSocket 会话、实际上传后的旧资源残留及真机 PWA 安装不在本次已通过声明内。
- 本地服务端 theme.go 上传路径先删除旧主题目录再解包，应清理旧资源；此为源码证据，不是生产磁盘验收。
- 保留价格展示遮罩，匿名 API 价格字段权限未改。后续安装候选包后应检查登录与 PWA，以及旧主题文件是否按服务端正常流程删除。

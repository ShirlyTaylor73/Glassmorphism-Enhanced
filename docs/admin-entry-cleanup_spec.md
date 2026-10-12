# 后台入口与重复官方前端清理规格

- 用户已批准：主题只承担公开监控，后台按钮始终显示，统一导航 /admin。官方服务端负责密码、2FA、OAuth 和鉴权，不自建登录。
- 删除 hideAdminEntryWhenLoggedOut schema/store 及身份分流；旧字段忽略，不写回配置。保留其他权限及价格遮罩。
- 删除 public/admin-app 的完整官方应用、同步脚本、后台 CSS、sync:admin 命令、根入口路由桥接。仅保留原路径的静态兼容页，固定 replace('/admin')、忽略任意参数、尽力清除旧路由键并提供无脚本链接。
- PWA manifest 迁移 /manifest.webmanifest，图标迁移 /images/pwa/icon-192.png 与 icon-512.png，名称 Glassmorphism Enhanced，保留 standalone、start_url=/、scope=/、iOS safe-area；不注册/注销 Service Worker 或清空用户存储。
- 先写失败用例：登录/访客/身份失败、旧隐藏开关三态、价格隐藏与返回、旧链接/禁用存储、PWA 实际尺寸。运行现有完整 Playwright、lint、type-check、build、diff-check，验证 ZIP 内容与包大小。
- 独立检查 1.5.1 服务端真实官方前端登录、密码错误/成功、2FA、OAuth-only、会话过期；mock 只验证 UI，外部 OAuth 和真实生产会话另行记录限制。
- 检查服务端更新安装是否删除旧资源；不修改服务端，不将前端删除等同于价格数据权限。
- 独立分支 fix/admin-entry-cleanup，分阶段 commit，版本保持 1.0.6，不发布/不替换现有附件，交付候选包；保留作者 ShirlyTaylor73 与既有许可证署名。

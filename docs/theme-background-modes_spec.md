# v1.0.8 主题切换与背景规格

- 修复点击目标与结果：当前浅色显示月亮/切换为深色主题；当前深色显示太阳/切换为浅色主题。无参数 updateThemeMode 按实际 isDark 反转并存储手动状态，普通点击不进入 auto。
- 手动状态提供可见“恢复自动”按钮，显式设 auto；auto 提示注明当前自动，沿用后台托管明暗或北京时间 07:00–19:00 浅色，其余深色。保留存储键、显式接口和审计。
- 只复制 GlassOps c5ba36a 的 default-background-v2.webp 与明暗滤镜、桌面/移动定位。显式绑定实际模式，保留自定义图片/视频、模糊、遮罩及失败回退；不改卡片/地球/后台/权限/三网。
- 先补失败测试：目标文案/图标/实际类与色彩/连续四次切换、自动恢复、存储刷新、北京时间边界与跨时区、非法值、图片/视频回退。
- lint/type-check/完整 visual/production build/diff-check；逐张查看预期背景和按钮视觉差异后再更新基线；校验 ZIP、背景哈希与来源。
- 分支 fix/theme-background-modes 分阶段提交。版本 1.0.8，保留 ShirlyTaylor73 与 short。核对远端后正常 push 分支/main，等待实际 Actions；未自动运行则手动 Code Quality，通过后正常 Tag/Release；不绕过失败、不读取凭据、不覆盖历史版本。
- 下载已发布附件验证 SHA256/CRC/结构/Tag main SHA，发布后交接只推工作分支。真实安装后另验收。

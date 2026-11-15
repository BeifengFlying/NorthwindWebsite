# CourseWatch 宣传页

页面：`src/pages/coursewatch.html`。首页作品区通过 `data-project-id="coursewatch"` 接入；沿用共享语言切换、页面转场与作品区返回位置恢复。

## 内容与版本

2026-11-15 通过 GitHub API 核对仓库 README 与发布附件。下载目标为 `v0.2.34-desktop`，提供 Apple Silicon DMG、Intel DMG、Windows x64 安装程序及便携 ZIP。发布标签包含 `-desktop`，应用与文件版本为 0.2.34。

下载版本静态维护。后续发布时一并修改页内版本标记、四个附件链接、发布说明链接及相关翻译；不得使用 GitHub 的 `releases/latest` 代替测试版附件地址。

## 展示资源

`public/assets/images/coursewatch/` 中的 WebP 从 CourseWatch 项目资源生成，合计约 311 KiB，不包含安装包、原始 PNG、账号或数据库。

- `overview-*`：`docs/screenshots/desktop-build31/main-light.png`，800 / 1280 / 1920 像素响应式版本。
- `courses.webp`：`docs/screenshots/desktop-build31/courses-light.png`。
- `schedules.webp`：`docs/screenshots/desktop-build31/schedules-light.png`。
- `notifications.webp`：`docs/screenshots/desktop-build31/settings-mobile-light.png`。
- `icon.webp`：`docs/images/coursewatch-icon.png`。
- 五个平台标志：`apps/extension/public/platforms/` 中对应 PNG。

应用截图实拍于 macOS，界面版本 0.2.31，所含课程、任务、日程和设置均为模拟数据。截图用于展示界面，不代表平台同步、提醒投递或跨设备日历已完成实测。页面下载版本为 0.2.34。

原始截图内壁纸来自 [Basic Apple Guy — macOS Golden Gate Wallpaper](https://basicappleguy.com/haberdashery/macosgoldengate)，属于 Apple 素材，项目许可不覆盖；本页仅使用应用展示图，不分发壁纸原文件。详细来源见 [CourseWatch 截图记录](https://github.com/BeifengFlying/CourseWatch/blob/main/docs/verification/README-DESKTOP-2026-11-15.md)。平台标志归各权利人所有。

## 验证

- `npm run check`：构建、资源引用、敏感信息、缓存版本与既有运行测试。
- Chromium：320 / 390 / 768 / 1440 像素的中英文布局；预览切换、大图打开与 Escape 关闭、焦点恢复、常见问题、减少动态效果偏好。
- 下载地址与 GitHub 发布附件列表逐项核对，不以页面检查代替安装包实测。

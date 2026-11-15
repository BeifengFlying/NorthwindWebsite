# CourseWatch 宣传页

页面：`src/pages/coursewatch.html`。首页作品区通过 `data-project-id="coursewatch"` 接入；沿用共享语言切换、页面转场与作品区返回位置恢复。

## 内容与版本

页面仅标注测试状态，不显示具体版本号。下载按钮初始链接指向 GitHub Releases 列表；页面加载后读取 GitHub 公开发布 API，包含测试发布，按发布时间为每种系统与架构选择最近的对应附件。

GitHub API 不可用、限流或缺少对应附件时，按钮保留发布列表链接。发布说明链接指向最近提供桌面安装包的发布记录。新增版本无需修改页面或重新部署；安装包命名继续使用 `-mac-arm64.dmg`、`-mac-x64.dmg`、`-win-x64-setup.exe` 与 `-win-x64.zip` 后缀。

## 展示资源

`public/assets/images/coursewatch/` 中的 WebP 从 CourseWatch 项目资源生成，合计约 311 KiB，不包含安装包、原始 PNG、账号或数据库。

- `overview-*`：`docs/screenshots/desktop-build31/main-light.png`，800 / 1280 / 1920 像素响应式版本。
- `courses.webp`：`docs/screenshots/desktop-build31/courses-light.png`。
- `schedules.webp`：`docs/screenshots/desktop-build31/schedules-light.png`。
- `notifications.webp`：`docs/screenshots/desktop-build31/settings-mobile-light.png`。
- `icon.webp`：`docs/images/coursewatch-icon.png`。
- 五个平台标志：`apps/extension/public/platforms/` 中对应 PNG。

应用截图实拍于 macOS，界面版本 0.2.31，所含课程、任务、日程和设置均为模拟数据。截图用于展示界面，不代表平台同步、提醒投递或跨设备日历已完成实测。下载入口独立读取发布信息，不随展示截图更新。

原始截图内壁纸来自 [Basic Apple Guy — macOS Golden Gate Wallpaper](https://basicappleguy.com/haberdashery/macosgoldengate)，属于 Apple 素材，项目许可不覆盖；本页仅使用应用展示图，不分发壁纸原文件。详细来源见 [CourseWatch 截图记录](https://github.com/BeifengFlying/CourseWatch/blob/main/docs/verification/README-DESKTOP-2026-11-15.md)。平台标志归各权利人所有。

## 验证

- `npm run check`：构建、资源引用、敏感信息、缓存版本与既有运行测试。
- Chromium：320 / 390 / 768 / 1440 像素的中英文布局；预览切换、大图打开与 Escape 关闭、焦点恢复、常见问题、减少动态效果偏好。
- 下载选择验证覆盖测试发布、平台附件分开发版、API 失败与缺少附件时回退发布列表；不以页面检查代替安装包实测。

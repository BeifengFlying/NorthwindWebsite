# Northwind

Northwind 是一个以个人介绍、音乐、摄影、算法题解、AI 实验和开发记录为核心的静态个人网站。仓库公开网站源码，用于展示开发过程和技术实践；原创素材与私密配置按独立边界管理。

> 本项目是源码可见（source-available）项目，并非 OSI 定义的开源软件。使用前请阅读 [LICENSE](LICENSE)。

## Features

- 响应式个人主页与专题页面
- 摄影作品的响应式图片展示
- 音乐、项目和个人经历展示
- 页面转场、滚动动效与无障碍动效降级
- 本地构建、资源检查和 GitHub Actions 质量检查
- GitHub 推送后由 Cloudflare Pages 自动部署

## Tech Stack

- HTML5、CSS3、原生 JavaScript
- GSAP、ScrollTrigger、Lenis（首页从 CDN 按需加载）
- Node.js 20+ 构建与本地预览脚本
- Git、GitHub Actions、Cloudflare Pages
- Sharp（仅在重新生成图片时使用）

## Project Structure

```text
.
├── src/
│   ├── pages/             # 页面入口
│   ├── styles/            # 页面与共享样式
│   ├── scripts/
│   │   ├── pages/         # 页面脚本
│   │   └── shared/        # 转场、动效与边框效果
│   └── config/            # 页面数据源
├── public/
│   └── assets/            # 允许部署的优化后展示资源
├── private/               # 本机原始素材，Git 忽略
├── scripts/               # 构建、预览、检查与图片优化
├── docs/                  # 设计、需求、开发和变更记录
└── dist/                  # 可重复生成的发布目录，Git 忽略
```

`private-assets/` 也被预留为本地私有素材目录并由 Git 忽略。项目沿用现有的 `private/source-media/` 作为实际源素材位置。

## Development

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开 `http://127.0.0.1:4173`。常用命令：

```bash
npm run build            # 生成 dist
npm run check            # 构建并检查断链、敏感信息和资源规则
npm run check:version    # 检查本地 JS/CSS 是否统一使用版本占位符
npm run optimize:images  # 从本机私有原片生成公开 WebP
```

发布版本由 `package.json` 维护，资源缓存序列由 `src/config/version.js` 维护。构建时会为
本地 JS/CSS 统一写入该序列及内容指纹；`{{APP_VERSION}}` 占位符也会被替换为最终版本号。
修改脚本、样式或打包依赖后，内容指纹会自动变化，无需手工刷新缓存号。

`npm run optimize:images` 也会从 `private/source-media/photography/distilled-originals`
生成摄影蒸馏图的 WebP 发布版本；原始 PNG 不进入 `public/`。

## Public And Private Assets

- `src/`、`scripts/`、`docs/` 和工程配置可以进入公开仓库。
- `public/` 只存放网站运行所需的优化后展示资源；资源文件不因进入公开仓库而获得复用授权。
- 原始照片、音频、视频、工程文件和未公开作品保存在 `private/` 或 `private-assets/`，不会提交或部署。
- 密钥只保存在被忽略的 `.env` 中；`.env.example` 只能包含变量名和说明。
- WebP 生成流程会移除 EXIF 元数据，但发布前仍需人工检查画面中的私人信息和第三方素材授权。

完整发布清单见 [docs/development/SECURITY.md](docs/development/SECURITY.md)。

## Git Workflow

提交标题使用 `类型: 修改内容`，推荐类型为 `feat`、`fix`、`style`、`perf`、`refactor`、`docs` 和 `chore`。每次推送前必须先在根目录更新 [changed.md](changed.md)，记录本次功能、修复或样式变更；日志条目统一使用 `版本号 - 日期` 格式，例如 `2.0.0 - 2026-08-13`。每次提交前运行：

```bash
git status
git diff
git diff --check
npm run check
```

确认无私有文件、`changed.md` 已更新后再提交并推送。版本标签遵循语义化版本，例如 `v1.0.0`、`v1.1.0`、`v1.1.1`。详细流程见 [docs/development/WORKFLOW.md](docs/development/WORKFLOW.md)。

## Deployment

This project is deployed through Cloudflare Pages.

Changes pushed to the `main` branch will be automatically deployed.

Cloudflare Pages 配置如下：

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20`

推送至 GitHub 后，Cloudflare Pages 自动构建并发布。不要将项目根目录或 `private/` 设为发布目录。

## License

This project is licensed under the [Northwind Source Code License 1.0](LICENSE).

The source code is available for personal learning,
non-commercial research, and technical discussion.

Commercial use, redistribution as a template,
and reuse of original creative assets are not permitted
without permission.

## Changelog

版本变化记录在 [docs/changelog/CHANGELOG.md](docs/changelog/CHANGELOG.md)。

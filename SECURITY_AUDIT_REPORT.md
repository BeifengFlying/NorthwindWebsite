# 项目安全审查报告

审查时间：2026-08-01

项目：Northwind（`northwind-personal-site` v1.2.0）

审查范围：工作区已跟踪文件、被忽略文件、`dist/` 构建产物、Git 历史与不可达对象、依赖清单、发布配置。

## 总体评级

**B**

项目整体干净：未发现真实密钥、私人联系方式、本机路径、恶意代码或隐私收集逻辑。发布前应优先处理 1 个高危依赖漏洞、音乐封面授权问题，并补齐 CDN 完整性与安全响应头。

## 风险统计

- 严重：0
- 高危：1
- 中危：2
- 低危：5

## 问题列表

### 问题1

类型：依赖安全漏洞

位置：`package.json`、`package-lock.json`（`sharp@0.34.5`）

风险：高危。`npm audit` 报告 `sharp <0.35.0` 继承 libvips 漏洞，对应公告 GHSA-f88m-g3jw-g9cj（CVE-2026-33327、CVE-2026-33328、CVE-2026-35590、CVE-2026-35591）。`sharp` 是 devDependency，仅用于本地 `optimize:images` 脚本，不进入 `dist/`，但会影响开发机和 CI 安装环境。

建议：执行 `npm install --save-dev sharp@^0.35.3`，随后重新运行 `npm audit` 与 `npm run check`。

### 问题2

类型：第三方素材授权风险

位置：`public/assets/images/music/111/`、`public/assets/images/music/222/`，共 27 个封面 WebP

风险：中危。封面大概率来自第三方专辑或音乐平台，仓库内没有逐图授权记录，`LICENSE` 也明确排除创作资源。公开仓库与公开站点存在版权和平台下架风险；这些文件已进入 Git 历史，只删除当前文件不会清除历史记录。

建议：逐一确认展示权或替换为自有、明确授权的素材；补充素材来源与授权说明；如需从历史移除，使用 `git filter-repo` 并确认远端历史可改写。

### 问题3

类型：前端供应链与脚本完整性

位置：`src/pages/index.html`（jsdelivr 加载 GSAP、ScrollTrigger、Lenis）、Google Fonts 引用

风险：中危。外部脚本和字体没有 SRI，也没有 CSP；CDN 被投毒或劫持时可能执行任意脚本，第三方同时会收到访问者的 IP 与 UA。GSAP、Lenis、字体版本已固定，降低了漂移风险，但完整性校验仍缺失。

建议：为 CDN 脚本补充 `integrity` SRI，或改为 npm 安装并本地打包；添加 CSP，仅放行 `fonts.googleapis.com`、`fonts.gstatic.com` 与所需资源源；字体可考虑自托管。

### 问题4

类型：部署安全头不完整

位置：`public/_headers`

风险：低危。已配置 `X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff`、`Referrer-Policy`、`Permissions-Policy`；缺少 HSTS、CSP、COOP。

建议：在 Cloudflare Pages 开启 HTTPS 与 HSTS（或补充 `Strict-Transport-Security`），配合问题 3 增加 CSP；确认生产环境无 debug 模式、无目录列表。

### 问题5

类型：构建产物信息暴露

位置：`scripts/build.mjs`（`sourcemap: true`）

风险：低危。生产构建会生成 `journey-menu.js.map`；本项目源码本来就公开，影响有限，但部署产物会额外暴露可读源码。

建议：生产构建改为 `sourcemap: false`，仅在本地调试时开启。

### 问题6

类型：搜索引擎爬取配置缺失

位置：项目根目录（当前无 `robots.txt`、`sitemap.xml`）

风险：低危/信息性。不是安全漏洞；但缺少对索引范围的控制和站点地图。

建议：按需在 `public/` 增加 `robots.txt` 与 `sitemap.xml`，并在部署配置中保持与 `_headers` 一致。

### 问题7

类型：敏感词误报源

位置：`docs/requirements/网站全局性能优化与项目结构重构需求文档.md`（`API_KEY=`、`SECRET=`、`PASSWORD=`、`TOKEN=` 示例）

风险：低危。这些是需求文档中的示例占位符，没有真实值，不构成泄露；但 gitleaks 等扫描器可能误报。

建议：将示例改为 `<YOUR_API_KEY>` 等明确占位符，或删除该段。

### 问题8

类型：本地开发服务器健壮性

位置：`scripts/serve.mjs`（`decodeURIComponent` 位于 `try` 之外）

风险：低危。畸形百分号编码 URL 可能抛出异常导致本地预览进程退出；服务器仅监听 `127.0.0.1`，无远程利用面。路径解析已有前缀防护，未发现目录穿越。

建议：将解码放入 `try/catch` 并返回 400，同时保留现有路径边界检查。

## 已通过检查

- 无密钥泄露：未发现 `.env`、真实 API Key、Token、私钥、数据库口令；`.env.example` 只有变量名说明。
- 无账号与联系方式泄露：未发现私人邮箱、手机号、QQ、微信；Git 提交作者使用 GitHub `noreply` 邮箱。
- 无本地环境信息泄露：未发现 `/Users/...`、Windows/AppData 路径、内网 IP；`private/` 仅以相对路径出现在文档中，且被 Git 忽略。
- 无隐私数据收集：无 Cookie、无统计/埋点、无表单提交、无后端接口；仅使用 `localStorage` 保存语言与静音偏好，`sessionStorage` 保存滚动位置和转场状态。
- 无恶意代码：未发现 `child_process`、后门、信息窃取、键盘记录、恶意上传、远程控制逻辑；项目为纯静态站点。
- XSS 风险可控：`solutions.js` 对来自 GitHub 的远程数据统一 `escapeHTML`；AI Lab、摄影、音乐等其余数据来自本地配置。
- 注入与上传面：无 SQL、命令执行、文件上传、后台或管理接口。
- Git 安全：`private/`、`node_modules/`、`dist/` 均被忽略；`git ls-files` 与全历史扫描未发现私密文件或真实凭据；不可达对象也已扫描。
- 依赖安全：`package-lock.json` 61 个 `resolved` 全部来自 `registry.npmjs.org`；`npm audit` 仅报告 1 个高危（见问题1）。
- 资源元数据：`npm run check` 对 89 个发布文件通过，未发现 EXIF、受保护源素材、超过 1.5 MB 的资源或发布进 `dist/` 的私密文件。
- 权限与部署：GitHub Actions 仅授予 `contents: read`；无后台入口；已配置基本安全响应头。
- License：根目录 `LICENSE` 明确为 source-available 许可并区分代码与创作资源；第三方素材授权仍需人工确认。

## 扫描记录

| 检查项 | 结果 |
| --- | --- |
| `git status --ignored` | 工作区干净，`dist/`、`node_modules/`、`private/` 为忽略项 |
| `git log` / `git reflog` / `git fsck` | 18 个提交无凭据；6 个不可达 blob 已扫描，无敏感内容 |
| 全历史 `git grep` 密钥模式 | 无真实命中 |
| `rg` 密钥、邮箱、手机、本地路径、违禁词扫描 | 仅有文档示例词和模型术语误报 |
| `npm audit` | 1 个高危：`sharp` |
| `npm run check` | 通过，89 个发布文件 |
| 外部代码特征扫描 | 仅发现页面跳转与音效 base64，无恶意行为 |

## 审查限制

- 环境未安装 gitleaks、trivy、semgrep，本次使用等效模式扫描、Git 对象扫描与项目自带检查替代。
- 图片内容（色情、暴力、极端内容等）无法在当前会话中进行人工目检；已通过 EXIF、尺寸、清单与构建检查，建议发布前人工复核画面。
- GitHub API 可见性检查超时，未能在本次会话确认远端仓库当前是 public 还是 private；README 声明为公开源码仓库。
- Cloudflare Pages 控制台配置不在仓库内，只能依据 `README.md` 与 `public/_headers` 推断。

## 修复优先级

1. 升级 `sharp` 到 `^0.35.3` 并重新扫描。
2. 确认或替换第三方音乐封面，补充素材授权说明。
3. 为 CDN 资源加 SRI，并补齐 CSP/HSTS。
4. 顺手处理：关闭生产 sourcemap、增加 robots/sitemap、改写文档占位符、加固本地服务器异常处理。

修复时遵守项目既有原则：不直接删除素材，先备份；不使用 `git add -f` 强制加入忽略文件；改动后重新执行 `npm run check` 与 `git status --ignored` 确认无误再提交。

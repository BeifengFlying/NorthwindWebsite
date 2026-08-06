# 开发与版本流程

## 日常开发

```text
修改 src 或 public
        ↓
npm run check
        ↓
Git 提交
        ↓
推送到 GitHub
        ↓
Cloudflare Pages 自动部署
```

`dist` 是可重复生成的产物，不提交。需要回退时优先创建反向提交；只有确认提交尚未共享给其他人时才考虑改写历史。

## 提交规范

提交标题使用 `类型: 修改内容`：

- `feat`: 新页面或新功能
- `fix`: 缺陷修复
- `style`: 视觉样式调整
- `perf`: 性能优化
- `refactor`: 不改变功能的结构调整
- `docs`: 文档调整
- `chore`: 工程配置和维护

一个提交只包含一个明确目的。提交前执行 `npm run check`，并在至少一个手机尺寸和一个桌面尺寸查看改动页面。

## 公开仓库发布

首次发布前必须运行 `npm run check`，再使用 `git status --ignored` 确认 `private/`、`private-assets/`、`.env` 和 `dist/` 均处于忽略状态。GitHub 仓库设为 Public 后，按以下顺序同步：

```bash
git status
git diff --check
npm run check
git add .
git commit -m "类型: 修改内容"
git push
```

不要使用 `git add -f` 强制添加被忽略的素材或配置。若敏感文件曾进入提交历史，必须先撤销并轮换相关密钥，再清理历史，不能只依赖一次删除提交。

## 版本发布

版本号遵循语义化版本：不兼容变更提升主版本，新功能提升次版本，缺陷修复提升修订号。更新日志条目统一使用 `版本号 - 日期` 格式，例如 `1.2.1 - 2026-08-06`。正式版本使用带 `v` 的 Git 标签，例如 `v1.0.0`。

```bash
git tag -a v1.0.0 -m "Northwind v1.0.0"
git push origin v1.0.0
```

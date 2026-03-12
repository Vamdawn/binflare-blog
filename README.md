# Binflare Blog

## Content Workflow

1. 在 `apps/web/content/posts` 下新增 Markdown 文件。
2. frontmatter 必填字段：`title`、`date`（格式 `YYYY-MM-DD`）。
3. 可选字段：`summary`、`draft`。
4. 提交并推送后触发构建部署。

## 部署文档

- `docs/deploy/web-selfhost.md`：自建服务器部署步骤与检查项。
- `docs/deploy/nginx/binflare-blog.conf`：Nginx 站点配置模板。

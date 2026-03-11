# Web 自建服务器部署

## deploy 用户

- 使用专用用户 `deploy` 执行发布（禁止使用 `root` 直连发布）。
- 仅给 `deploy` 赋予 `/var/www/binflare-blog` 下的读写权限。
- 建议关闭密码登录，仅允许 SSH Key 登录。

## 目录结构

```text
/var/www/binflare-blog/
  releases/
    20260311-190500-a1b2c3d/
    20260310-221300-e4f5g6h/
  current -> /var/www/binflare-blog/releases/20260311-190500-a1b2c3d
  shared/
    deploy.log
```

- 发布目录：`/var/www/binflare-blog/releases`
- 对外生效目录软链：`/var/www/binflare-blog/current`

## GitHub Secrets

在仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `DEPLOY_HOST`：服务器地址（IP 或域名）
- `DEPLOY_PORT`：SSH 端口（如 `22`）
- `DEPLOY_SSH_KEY`：`deploy` 用户私钥内容（多行）

## 首次部署检查项

- 服务器已创建 `deploy` 用户，且可以通过私钥 SSH 登录。
- `/var/www/binflare-blog/releases`、`/var/www/binflare-blog/shared` 已创建并归属 `deploy`。
- Nginx 已加载 `docs/deploy/nginx/binflare-blog.conf`，并通过 `nginx -t`。
- GitHub Actions 的 `DEPLOY_HOST`、`DEPLOY_PORT`、`DEPLOY_SSH_KEY` 已配置。
- 首次发布前，确认 `apps/web` 可在 CI 中成功 `build`。

## 回滚命令示例

如需快速回滚到上一个版本，可执行：

```bash
ln -sfn /var/www/binflare-blog/releases/<previous_release_id> /var/www/binflare-blog/current
```

或使用仓库脚本：

```bash
bash scripts/deploy/rollback-release.sh /var/www/binflare-blog <previous_release_id>
```

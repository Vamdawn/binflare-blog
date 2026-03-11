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

## 服务器一次性初始化命令清单（Ubuntu 示例）

首次初始化建议由有 sudo 权限的管理员执行：

```bash
# 1) 创建 deploy 用户（已存在则跳过）
id deploy >/dev/null 2>&1 || sudo adduser --disabled-password --gecos "" deploy

# 2) 准备 SSH 目录与授权公钥
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo touch /home/deploy/.ssh/authorized_keys
sudo chmod 600 /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
# 把本地公钥内容追加到 authorized_keys（示例）
# cat ~/.ssh/id_ed25519.pub | sudo tee -a /home/deploy/.ssh/authorized_keys

# 3) 创建部署目录
sudo mkdir -p /var/www/binflare-blog/releases
sudo mkdir -p /var/www/binflare-blog/shared
sudo chown -R deploy:deploy /var/www/binflare-blog
sudo chmod -R 755 /var/www/binflare-blog

# 4) 安装并启用 Nginx（未安装时）
sudo apt-get update
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5) 安装站点配置
sudo cp docs/deploy/nginx/binflare-blog.conf /etc/nginx/sites-available/binflare-blog.conf
sudo ln -sf /etc/nginx/sites-available/binflare-blog.conf /etc/nginx/sites-enabled/binflare-blog.conf
sudo nginx -t
sudo systemctl reload nginx
```

初始化完成后验证：

```bash
sudo -u deploy test -w /var/www/binflare-blog/releases && echo "deploy write ok"
sudo -u deploy test -w /var/www/binflare-blog/shared && echo "deploy shared ok"
```

## GitHub Secrets 最小配置检查表

必填项：

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_SSH_KEY`

建议值规范：

- `DEPLOY_HOST` 使用公网 IP 或可解析域名（不带协议头）。
- `DEPLOY_PORT` 通常是 `22`，如改端口需与服务器 SSH 配置一致。
- `DEPLOY_SSH_KEY` 必须是 `deploy` 用户对应私钥，保留完整多行内容。

配置后自检（需本地已安装并登录 GitHub CLI）：

```bash
gh auth status
gh secret list --repo <owner>/<repo>
```

上线前连通性检查（本地执行）：

```bash
ssh -p <DEPLOY_PORT> deploy@<DEPLOY_HOST> "echo connected && whoami && ls -la /var/www/binflare-blog"
```

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

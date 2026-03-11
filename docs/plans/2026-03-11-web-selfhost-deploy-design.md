# Web 静态站自建服务器部署策略设计（2026-03-11）

## 1. 背景与目标

- 项目类型：`apps/web` 静态博客（Vite 构建产物）。
- 部署目标：在自建 Linux 服务器上稳定自动发布。
- 优先级：稳定优先，支持秒级回滚，发布过程尽量无中断。

## 2. 已确认约束

1. 仅部署 `apps/web`，不纳入 `apps/server`。
2. 发布触发方式：GitHub Actions 在 `main` 分支自动发布。
3. 托管形态：自建服务器 + Nginx（非容器）。
4. 安全约束：使用专用部署用户 `deploy`。
5. 发布策略倾向：原子切换 + 快速回滚。

## 3. 方案对比

### 方案 A（推荐）：`releases/` + `current` 软链原子切换

- 流程：CI 构建并上传到新目录 -> 切换 `current` 软链 -> 健康检查。
- 优点：
  - 基本无中断；
  - 回滚仅需软链回切；
  - 历史版本可保留，审计和问题定位方便。
- 缺点：
  - 需要维护 release 目录与发布脚本。

### 方案 B：直接覆盖 Nginx 目录

- 流程：CI 用 `rsync --delete` 直接覆盖线上目录。
- 优点：实现最简单。
- 缺点：发布中可能出现中间态，回滚成本高。

### 方案 C：Blue/Green 双目录

- 流程：维护 `blue`/`green` 两套完整目录并切换流量。
- 优点：稳定性高，回滚路径清晰。
- 缺点：目录与切换管理更重，复杂度高于方案 A。

结论：采用 **方案 A**。

## 4. 目标架构

1. GitHub `main` 分支触发 `deploy-web` 工作流。
2. Actions 执行 `lint/test/build`，生成 `apps/web/dist`。
3. 产物上传至服务器：`/var/www/binflare-blog/releases/<timestamp>-<sha>/`。
4. 服务器执行发布脚本进行校验与软链切换：
   - `current -> releases/<new_release>`
5. Nginx `root` 固定为 `/var/www/binflare-blog/current`。
6. 发布后做线上健康检查，失败自动回滚。

## 5. 服务器目录与权限模型

```text
/var/www/binflare-blog/
  releases/
    20260311-190500-a1b2c3d/
    20260310-221300-e4f5g6h/
  current -> /var/www/binflare-blog/releases/20260311-190500-a1b2c3d
  shared/
    deploy.log
```

- 目录所有者：`deploy:deploy`（或部署组）。
- `deploy` 仅有上述目录写权限。
- Nginx 仅需可读 `current` 指向目录。
- `deploy` 不授予 sudo 管理权限。

## 6. 发布流程

1. 合并代码到 `main`。
2. Actions 运行：
   - `pnpm install --frozen-lockfile`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm --filter web build`
3. 生成 release 元信息（`release.json`：时间、SHA、run id）。
4. 上传构建产物到 `releases/<new_release>/`。
5. 服务器执行：
   - 校验关键文件（`index.html`、`assets/`、`sitemap.xml`）；
   - 原子切换 `current` 软链；
   - 记录日志。
6. 发布后健康检查：`/`、`/posts/hello-world`、`/404`。

## 7. 回滚策略

- 触发条件：
  - 发布后健康检查失败；
  - 人工确认线上异常。
- 回滚动作：
  - `ln -sfn <previous_release_path> current`
  - 重新执行健康检查。
- 目标：2 分钟内恢复。

## 8. 失败处理与安全策略

### 失败处理

1. 构建失败：流程中止，不上传。
2. 上传失败：保持旧版本，不切换软链。
3. 切换失败：停止流程并告警。
4. 发布后检测失败：自动回滚并标记失败版本。

### 安全策略

1. GitHub Secrets 存储 `deploy` 私钥。
2. 服务器侧仅放置 `deploy` 的公钥到 `authorized_keys`。
3. 关闭密码登录，使用 SSH Key。
4. Nginx 开启基础安全头和目录访问限制。

## 9. 验收标准与运行指标

- 发布成功率：`>= 95%`
- 发布中断时间：接近 0（原子切换）
- 回滚恢复时长：`<= 2 分钟`
- 历史版本保留：最近 10 个 release

## 10. 非目标（本次不做）

1. 容器化部署（Docker/K8s）
2. 多机房或多节点负载均衡
3. 后端服务部署编排（`apps/server`）

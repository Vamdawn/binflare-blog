# Web 自建服务器原子发布 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `apps/web` 建立基于 GitHub Actions + Nginx + `deploy` 用户的自动发布链路，支持原子切换与秒级回滚。

**Architecture:** CI 在 GitHub Actions 完成质量门禁与构建，产物上传到服务器 `releases/<id>`。服务器脚本校验后将 `current` 软链原子切换到新版本，失败时自动回滚。Nginx 固定读取 `current`，避免覆盖式发布中间态。

**Tech Stack:** pnpm, Vitest, Bash, OpenSSH, GitHub Actions, Nginx

---

### Task 1: 实现原子切换脚本（promote）

**Files:**
- Create: `scripts/deploy/promote-release.sh`
- Create: `scripts/deploy/promote-release.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/promote-release.sh');

describe('promote-release.sh', () => {
  it('切换 current 软链到新 release 并写日志', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-promote-'));
    const releases = path.join(root, 'releases');
    const shared = path.join(root, 'shared');
    fs.mkdirSync(releases, { recursive: true });
    fs.mkdirSync(shared, { recursive: true });

    const oldId = '20260311-100000-oldsha';
    const newId = '20260311-110000-newsha';
    const oldDir = path.join(releases, oldId);
    const newDir = path.join(releases, newId);
    fs.mkdirSync(path.join(oldDir, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(newDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(oldDir, 'index.html'), 'old');
    fs.writeFileSync(path.join(newDir, 'index.html'), 'new');
    fs.writeFileSync(path.join(newDir, 'sitemap.xml'), '<xml />');

    fs.symlinkSync(oldDir, path.join(root, 'current'));

    execFileSync('bash', [script, root, newId], { stdio: 'pipe' });

    const currentTarget = fs.readlinkSync(path.join(root, 'current'));
    expect(currentTarget).toBe(newDir);

    const log = fs.readFileSync(path.join(shared, 'deploy.log'), 'utf-8');
    expect(log).toContain(`release=${newId}`);
    expect(log).toContain('status=promoted');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/promote-release.test.ts`
Expected: FAIL with `No such file or directory` for `promote-release.sh`.

**Step 3: Write minimal implementation**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$1"
RELEASE_ID="$2"
RELEASE_DIR="$ROOT_DIR/releases/$RELEASE_ID"
CURRENT_LINK="$ROOT_DIR/current"
LOG_FILE="$ROOT_DIR/shared/deploy.log"

[[ -d "$RELEASE_DIR" ]] || { echo "release dir missing: $RELEASE_DIR"; exit 1; }
[[ -f "$RELEASE_DIR/index.html" ]] || { echo "index.html missing"; exit 1; }
[[ -d "$RELEASE_DIR/assets" ]] || { echo "assets missing"; exit 1; }
[[ -f "$RELEASE_DIR/sitemap.xml" ]] || { echo "sitemap.xml missing"; exit 1; }

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"
mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date -u +%FT%TZ) release=$RELEASE_ID status=promoted" >> "$LOG_FILE"
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/promote-release.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/deploy/promote-release.sh scripts/deploy/promote-release.test.ts
git commit -m "feat(deploy): add atomic release promotion script"
```

### Task 2: 实现回滚脚本（rollback）

**Files:**
- Create: `scripts/deploy/rollback-release.sh`
- Create: `scripts/deploy/rollback-release.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/rollback-release.sh');

describe('rollback-release.sh', () => {
  it('回切到指定 release 并记录 rollback 日志', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-rollback-'));
    const releases = path.join(root, 'releases');
    const shared = path.join(root, 'shared');
    fs.mkdirSync(releases, { recursive: true });
    fs.mkdirSync(shared, { recursive: true });

    const prev = path.join(releases, '20260311-100000-prevsha');
    fs.mkdirSync(path.join(prev, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(prev, 'index.html'), 'ok');
    fs.writeFileSync(path.join(prev, 'sitemap.xml'), '<xml />');

    execFileSync('bash', [script, root, '20260311-100000-prevsha'], { stdio: 'pipe' });

    const currentTarget = fs.readlinkSync(path.join(root, 'current'));
    expect(currentTarget).toBe(prev);

    const log = fs.readFileSync(path.join(shared, 'deploy.log'), 'utf-8');
    expect(log).toContain('status=rolled_back');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/rollback-release.test.ts`
Expected: FAIL with missing script error.

**Step 3: Write minimal implementation**

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$1"
TARGET_RELEASE_ID="$2"
TARGET_DIR="$ROOT_DIR/releases/$TARGET_RELEASE_ID"
CURRENT_LINK="$ROOT_DIR/current"
LOG_FILE="$ROOT_DIR/shared/deploy.log"

[[ -d "$TARGET_DIR" ]] || { echo "target release missing: $TARGET_DIR"; exit 1; }
[[ -f "$TARGET_DIR/index.html" ]] || { echo "index.html missing"; exit 1; }

ln -sfn "$TARGET_DIR" "$CURRENT_LINK"
mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date -u +%FT%TZ) release=$TARGET_RELEASE_ID status=rolled_back" >> "$LOG_FILE"
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/rollback-release.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/deploy/rollback-release.sh scripts/deploy/rollback-release.test.ts
git commit -m "feat(deploy): add rollback script for previous release"
```

### Task 3: 实现 release 清理脚本（保留最近 10 个）

**Files:**
- Create: `scripts/deploy/prune-releases.sh`
- Create: `scripts/deploy/prune-releases.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/prune-releases.sh');

describe('prune-releases.sh', () => {
  it('只保留最新 10 个 release 目录', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-prune-'));
    const releases = path.join(root, 'releases');
    fs.mkdirSync(releases, { recursive: true });

    for (let i = 1; i <= 12; i += 1) {
      const id = `20260311-10${String(i).padStart(2, '0')}-sha`;
      fs.mkdirSync(path.join(releases, id));
    }

    execFileSync('bash', [script, releases, '10'], { stdio: 'pipe' });

    const after = fs.readdirSync(releases).sort();
    expect(after).toHaveLength(10);
    expect(after[0]).toContain('1003');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/prune-releases.test.ts`
Expected: FAIL with missing script error.

**Step 3: Write minimal implementation**

```bash
#!/usr/bin/env bash
set -euo pipefail

RELEASES_DIR="$1"
KEEP_COUNT="${2:-10}"

mapfile -t dirs < <(find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)
count="${#dirs[@]}"

if (( count <= KEEP_COUNT )); then
  exit 0
fi

delete_count=$((count - KEEP_COUNT))
for ((i=0; i<delete_count; i++)); do
  rm -rf "$RELEASES_DIR/${dirs[$i]}"
done
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/prune-releases.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/deploy/prune-releases.sh scripts/deploy/prune-releases.test.ts
git commit -m "feat(deploy): add old release pruning script"
```

### Task 4: 添加 GitHub Actions 自动发布流水线

**Files:**
- Create: `.github/workflows/deploy-web.yml`
- Create: `scripts/deploy/workflow-smoke.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deploy-web workflow', () => {
  it('包含质量门禁、上传与原子切换步骤', () => {
    const yaml = fs.readFileSync('.github/workflows/deploy-web.yml', 'utf-8');
    expect(yaml).toContain('on:\n  push:\n    branches:\n      - main');
    expect(yaml).toContain('pnpm lint');
    expect(yaml).toContain('pnpm test');
    expect(yaml).toContain('pnpm --filter web build');
    expect(yaml).toContain('scripts/deploy/promote-release.sh');
    expect(yaml).toContain('scripts/deploy/prune-releases.sh');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/workflow-smoke.test.ts`
Expected: FAIL with `.github/workflows/deploy-web.yml` not found.

**Step 3: Write minimal implementation**

```yaml
name: deploy-web

on:
  push:
    branches:
      - main
    paths:
      - 'apps/web/**'
      - 'packages/**'
      - 'pnpm-lock.yaml'
      - 'package.json'
      - 'pnpm-workspace.yaml'
      - '.github/workflows/deploy-web.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm --filter web build

      - name: Pack dist
        run: tar -C apps/web/dist -czf web-dist.tar.gz .

      - name: Upload and promote
        env:
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_PORT: ${{ secrets.DEPLOY_PORT }}
          DEPLOY_USER: deploy
          DEPLOY_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        run: |
          RELEASE_ID="$(date -u +%Y%m%d-%H%M%S)-${GITHUB_SHA::7}"
          ROOT_DIR="/var/www/binflare-blog"

          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519

          ssh -p "$DEPLOY_PORT" -o StrictHostKeyChecking=accept-new "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $ROOT_DIR/releases/$RELEASE_ID"
          ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p $ROOT_DIR/scripts/deploy"
          scp -P "$DEPLOY_PORT" scripts/deploy/*.sh "$DEPLOY_USER@$DEPLOY_HOST:$ROOT_DIR/scripts/deploy/"
          scp -P "$DEPLOY_PORT" web-dist.tar.gz "$DEPLOY_USER@$DEPLOY_HOST:$ROOT_DIR/releases/$RELEASE_ID/"
          ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "chmod +x $ROOT_DIR/scripts/deploy/*.sh"
          ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "cd $ROOT_DIR/releases/$RELEASE_ID && tar -xzf web-dist.tar.gz && rm -f web-dist.tar.gz"
          ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "bash $ROOT_DIR/scripts/deploy/promote-release.sh $ROOT_DIR $RELEASE_ID"
          ssh -p "$DEPLOY_PORT" "$DEPLOY_USER@$DEPLOY_HOST" "bash $ROOT_DIR/scripts/deploy/prune-releases.sh $ROOT_DIR/releases 10"
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/workflow-smoke.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add .github/workflows/deploy-web.yml scripts/deploy/workflow-smoke.test.ts
git commit -m "ci: add web deploy workflow for self-hosted nginx"
```

### Task 5: 添加服务器侧部署文档与 Nginx 配置模板

**Files:**
- Create: `docs/deploy/web-selfhost.md`
- Create: `docs/deploy/nginx/binflare-blog.conf`
- Create: `scripts/deploy/docs-smoke.test.ts`
- Modify: `README.md`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deploy docs', () => {
  it('包含 deploy 用户、目录结构与 nginx root 约束', () => {
    const doc = fs.readFileSync('docs/deploy/web-selfhost.md', 'utf-8');
    const nginx = fs.readFileSync('docs/deploy/nginx/binflare-blog.conf', 'utf-8');

    expect(doc).toContain('deploy');
    expect(doc).toContain('/var/www/binflare-blog/releases');
    expect(doc).toContain('current');

    expect(nginx).toContain('root /var/www/binflare-blog/current;');
    expect(nginx).toContain('try_files $uri $uri/ /index.html;');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/docs-smoke.test.ts`
Expected: FAIL with missing files.

**Step 3: Write minimal implementation**

```nginx
server {
  listen 80;
  server_name _;

  root /var/www/binflare-blog/current;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location = /healthz {
    return 200 'ok';
    add_header Content-Type text/plain;
  }
}
```

`docs/deploy/web-selfhost.md` 至少包含：
- `deploy` 用户创建与目录授权命令
- GitHub Secrets 清单（`DEPLOY_HOST`、`DEPLOY_PORT`、`DEPLOY_SSH_KEY`）
- 首次发布前检查项（Nginx、目录、SSH）
- 回滚命令示例

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/docs-smoke.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/deploy/web-selfhost.md docs/deploy/nginx/binflare-blog.conf README.md scripts/deploy/docs-smoke.test.ts
git commit -m "docs(deploy): add self-hosted nginx deployment runbook"
```

### Task 6: 发布前总体验证与交付检查

**Files:**
- Modify: `.github/workflows/deploy-web.yml` (如需补充健康检查与自动回滚)
- Create: `scripts/deploy/workflow-healthcheck.test.ts`

**Step 1: Write the failing test**

```ts
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('deploy workflow healthcheck', () => {
  it('包含发布后健康检查与失败回滚动作', () => {
    const yaml = fs.readFileSync('.github/workflows/deploy-web.yml', 'utf-8');
    expect(yaml).toContain('curl -fsS http://127.0.0.1/');
    expect(yaml).toContain('rollback-release.sh');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- scripts/deploy/workflow-healthcheck.test.ts`
Expected: FAIL until workflow includes healthcheck + rollback path.

**Step 3: Write minimal implementation**

在 workflow 的远端执行段追加：
- 发布后 `curl` 检查 `/`、`/posts/hello-world`、`/404`
- 任一失败时执行 `rollback-release.sh <previous_release_id>`
- 回滚后再次检查 `/`

**Step 4: Run test to verify it passes**

Run: `pnpm test -- scripts/deploy/workflow-healthcheck.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add .github/workflows/deploy-web.yml scripts/deploy/workflow-healthcheck.test.ts
git commit -m "ci(deploy): add post-release health checks and rollback"
```

## Implementation notes

- 执行本计划时，按任务顺序逐个完成，避免跨任务并行改动同一文件。
- 每个任务结束后使用 `@verification-before-completion` 运行对应测试与关键命令。
- 实施阶段遵循 `@test-driven-development`：先写失败测试，再最小实现。
- 全部任务完成后，补充一次端到端预发演练记录到 `docs/deploy/web-selfhost.md`。

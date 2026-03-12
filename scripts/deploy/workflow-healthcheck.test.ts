import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.resolve('.github/workflows/deploy-web.yml');

describe('deploy-web workflow healthcheck', () => {
  it('包含发布后健康检查与回滚信号', () => {
    const yaml = fs.readFileSync(workflowPath, 'utf-8');

    const requiredSnippets = [
      'for path in / /posts/hello-world /404; do',
      'curl --fail --silent --show-error "$HEALTHCHECK_BASE_URL$path" > /dev/null',
      'scripts/deploy/rollback-release.sh',
      'bash "$REMOTE_SCRIPT_DIR/rollback-release.sh" "$DEPLOY_ROOT" "$PREVIOUS_RELEASE_ID"',
      'curl --fail --silent --show-error "$HEALTHCHECK_BASE_URL/" > /dev/null',
    ];

    for (const snippet of requiredSnippets) {
      expect(yaml).toContain(snippet);
    }
  });
});

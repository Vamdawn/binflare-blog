import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowPath = path.resolve('.github/workflows/deploy-web.yml');

describe('deploy-web workflow smoke', () => {
  it('包含自动部署关键步骤', () => {
    const yaml = fs.readFileSync(workflowPath, 'utf-8');

    const requiredSnippets = [
      'on:',
      'push:',
      'branches:',
      '- main',
      'paths:',
      '- apps/web/**',
      '- packages/**',
      '- pnpm-lock.yaml',
      '- package.json',
      '- pnpm-workspace.yaml',
      '- .github/workflows/deploy-web.yml',
      'pnpm install --frozen-lockfile',
      'pnpm lint',
      'pnpm test',
      'pnpm --filter web build',
      'tar -czf web-dist.tgz -C apps/web/dist .',
      'mkdir -p \\"$DEPLOY_ROOT\\"',
      'bash "$REMOTE_SCRIPT_DIR/promote-release.sh" "$DEPLOY_ROOT" "$RELEASE_ID"',
      'bash "$REMOTE_SCRIPT_DIR/prune-releases.sh" "$DEPLOY_ROOT/releases"',
      'DEPLOY_USER: deploy',
      'DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}',
      'DEPLOY_PORT: ${{ secrets.DEPLOY_PORT }}',
      'SSH_PRIVATE_KEY: ${{ secrets.DEPLOY_SSH_KEY }}',
      'uses: actions/checkout@v6',
      'uses: actions/setup-node@v6',
      'corepack enable',
      'corepack prepare pnpm@9.15.0 --activate',
    ];

    for (const snippet of requiredSnippets) {
      expect(yaml).toContain(snippet);
    }

    expect(yaml).not.toContain('uses: pnpm/action-setup@');
  });
});

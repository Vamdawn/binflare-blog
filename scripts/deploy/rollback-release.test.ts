import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/rollback-release.sh');
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

function createRoot(prefix = 'deploy-rollback-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(root);
  return root;
}

describe('rollback-release.sh', () => {
  it('切换 current 软链到目标 release 并写回滚日志', () => {
    const root = createRoot();
    const releases = path.join(root, 'releases');
    const shared = path.join(root, 'shared');

    fs.mkdirSync(releases, { recursive: true });
    fs.mkdirSync(shared, { recursive: true });

    const currentId = '20260311-120000-newsha';
    const targetId = '20260311-110000-oldsha';
    const currentDir = path.join(releases, currentId);
    const targetDir = path.join(releases, targetId);

    fs.mkdirSync(path.join(currentDir, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(currentDir, 'index.html'), 'current');
    fs.writeFileSync(path.join(targetDir, 'index.html'), 'target');
    fs.writeFileSync(path.join(currentDir, 'sitemap.xml'), '<xml>current</xml>');
    fs.writeFileSync(path.join(targetDir, 'sitemap.xml'), '<xml>target</xml>');
    fs.symlinkSync(currentDir, path.join(root, 'current'));

    execFileSync('bash', [script, root, targetId], { stdio: 'pipe' });

    expect(fs.readlinkSync(path.join(root, 'current'))).toBe(targetDir);

    const log = fs.readFileSync(path.join(shared, 'deploy.log'), 'utf-8');
    expect(log).toContain(`release=${targetId}`);
    expect(log).toContain('status=rolled_back');
  });

  it('目标 release 不存在时失败并保持 current 不变', () => {
    const root = createRoot('deploy-rollback-missing-');
    const releases = path.join(root, 'releases');

    fs.mkdirSync(releases, { recursive: true });

    const currentId = '20260311-120000-newsha';
    const missingTargetId = '20260311-110000-oldsha';
    const currentDir = path.join(releases, currentId);

    fs.mkdirSync(path.join(currentDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(currentDir, 'index.html'), 'current');
    fs.writeFileSync(path.join(currentDir, 'sitemap.xml'), '<xml>current</xml>');
    fs.symlinkSync(currentDir, path.join(root, 'current'));

    expect(() =>
      execFileSync('bash', [script, root, missingTargetId], { stdio: 'pipe' }),
    ).toThrow();
    expect(fs.readlinkSync(path.join(root, 'current'))).toBe(currentDir);
  });
});

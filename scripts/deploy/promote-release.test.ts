import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/promote-release.sh');
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

function createRoot(prefix = 'deploy-promote-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(root);
  return root;
}

describe('promote-release.sh', () => {
  it('切换 current 软链到新 release 并写日志', () => {
    const root = createRoot();
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
    fs.writeFileSync(path.join(oldDir, 'sitemap.xml'), '<xml>old</xml>');
    fs.writeFileSync(path.join(newDir, 'index.html'), 'new');
    fs.writeFileSync(path.join(newDir, 'sitemap.xml'), '<xml>new</xml>');
    fs.symlinkSync(oldDir, path.join(root, 'current'));

    execFileSync('bash', [script, root, newId], { stdio: 'pipe' });

    const currentTarget = fs.readlinkSync(path.join(root, 'current'));
    expect(currentTarget).toBe(newDir);

    const log = fs.readFileSync(path.join(shared, 'deploy.log'), 'utf-8');
    expect(log).toContain(`release=${newId}`);
    expect(log).toContain('status=promoted');
  });

  it('缺少 sitemap.xml 时失败并保持 current 不变', () => {
    const root = createRoot('deploy-promote-missing-');
    const releases = path.join(root, 'releases');

    fs.mkdirSync(releases, { recursive: true });

    const oldId = '20260311-100000-oldsha';
    const newId = '20260311-110000-newsha';
    const oldDir = path.join(releases, oldId);
    const newDir = path.join(releases, newId);

    fs.mkdirSync(path.join(oldDir, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(newDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(oldDir, 'index.html'), 'old');
    fs.writeFileSync(path.join(oldDir, 'sitemap.xml'), '<xml>old</xml>');
    fs.writeFileSync(path.join(newDir, 'index.html'), 'new');
    fs.symlinkSync(oldDir, path.join(root, 'current'));

    expect(() => execFileSync('bash', [script, root, newId], { stdio: 'pipe' })).toThrow();
    expect(fs.readlinkSync(path.join(root, 'current'))).toBe(oldDir);
  });
});

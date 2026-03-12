import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const script = path.resolve('scripts/deploy/prune-releases.sh');
const tempRoots: string[] = [];

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (root) {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }
});

function createReleasesDir(prefix = 'deploy-prune-') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const releasesDir = path.join(root, 'releases');
  fs.mkdirSync(releasesDir, { recursive: true });
  tempRoots.push(root);
  return releasesDir;
}

function createReleaseDirs(releasesDir: string, count: number) {
  const names = Array.from(
    { length: count },
    (_, index) => `20260311-${String(index + 1).padStart(6, '0')}`,
  );
  for (const name of names) {
    fs.mkdirSync(path.join(releasesDir, name));
  }
  return names;
}

function listEntries(releasesDir: string) {
  return fs.readdirSync(releasesDir).sort();
}

describe('prune-releases.sh', () => {
  it('12 个 release 保留最近 10 个，删除最旧 2 个', () => {
    const releasesDir = createReleasesDir();
    const names = createReleaseDirs(releasesDir, 12);

    execFileSync('bash', [script, releasesDir], { stdio: 'pipe' });

    expect(listEntries(releasesDir)).toEqual(names.slice(2));
    expect(fs.existsSync(path.join(releasesDir, names[0]))).toBe(false);
    expect(fs.existsSync(path.join(releasesDir, names[1]))).toBe(false);
  });

  it('release 数量少于 keep_count 时不删除', () => {
    const releasesDir = createReleasesDir('deploy-prune-few-');
    const names = createReleaseDirs(releasesDir, 3);

    execFileSync('bash', [script, releasesDir, '10'], { stdio: 'pipe' });

    expect(listEntries(releasesDir)).toEqual(names);
  });

  it('存在非目录文件时不删除该文件，且不影响目录清理结果', () => {
    const releasesDir = createReleasesDir('deploy-prune-file-');
    const names = createReleaseDirs(releasesDir, 12);
    const noteFile = path.join(releasesDir, 'README.txt');
    fs.writeFileSync(noteFile, 'keep me');

    execFileSync('bash', [script, releasesDir], { stdio: 'pipe' });

    expect(fs.existsSync(noteFile)).toBe(true);
    expect(listEntries(releasesDir)).toEqual([...names.slice(2), 'README.txt'].sort());
  });

  it('keep_count 非法时失败', () => {
    const releasesDir = createReleasesDir('deploy-prune-invalid-');
    createReleaseDirs(releasesDir, 2);

    expect(() => execFileSync('bash', [script, releasesDir, '0'], { stdio: 'pipe' })).toThrow();
    expect(() => execFileSync('bash', [script, releasesDir, '-1'], { stdio: 'pipe' })).toThrow();
    expect(() => execFileSync('bash', [script, releasesDir, 'abc'], { stdio: 'pipe' })).toThrow();
  });
});

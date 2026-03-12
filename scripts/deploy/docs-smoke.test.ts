import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const selfhostDocPath = path.resolve('docs/deploy/web-selfhost.md');
const nginxConfPath = path.resolve('docs/deploy/nginx/binflare-blog.conf');
const readmePath = path.resolve('README.md');

describe('deploy docs smoke', () => {
  it('web-selfhost 文档包含部署关键说明', () => {
    const doc = fs.readFileSync(selfhostDocPath, 'utf-8');

    const requiredSnippets = [
      'deploy 用户',
      '/var/www/binflare-blog/releases',
      'current -> /var/www/binflare-blog/releases/',
      'DEPLOY_HOST',
      'DEPLOY_PORT',
      'DEPLOY_SSH_KEY',
      '首次部署检查项',
      'ln -sfn /var/www/binflare-blog/releases/<previous_release_id> /var/www/binflare-blog/current',
      'bash scripts/deploy/rollback-release.sh /var/www/binflare-blog <previous_release_id>',
    ];

    for (const snippet of requiredSnippets) {
      expect(doc).toContain(snippet);
    }
  });

  it('nginx 模板包含 SPA 部署必需配置', () => {
    const conf = fs.readFileSync(nginxConfPath, 'utf-8');

    expect(conf).toContain('root /var/www/binflare-blog/current;');
    expect(conf).toContain('try_files $uri $uri/ /index.html;');
  });

  it('README 提供部署文档入口', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');

    expect(readme).toContain('## 部署文档');
    expect(readme).toContain('docs/deploy/web-selfhost.md');
  });
});

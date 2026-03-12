import { describe, expect, it } from 'vitest';
import { buildSitemapXml } from './sitemap-utils.mjs';

describe('buildSitemapXml', () => {
  it('contains root and post urls', () => {
    const xml = buildSitemapXml('https://example.com/', ['hello-world']);
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/posts/hello-world</loc>');
  });
});

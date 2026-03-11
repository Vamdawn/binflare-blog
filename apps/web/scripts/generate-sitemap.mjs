import fs from 'node:fs';
import path from 'node:path';
import { readValidatedPosts } from './posts.mjs';
import { buildSitemapXml } from './sitemap-utils.mjs';

export const collectPublishedPostSlugs = (postsDir) =>
  readValidatedPosts(postsDir)
    .filter((post) => !post.meta.draft)
    .map((post) => post.meta.slug)
    .sort((a, b) => a.localeCompare(b));

if (process.env.VITEST !== 'true') {
  const cwd = process.cwd();
  const postsDir = path.join(cwd, 'content/posts');
  const outputFile = path.join(cwd, 'public/sitemap.xml');
  const siteUrl = process.env.SITE_URL ?? 'https://example.com';

  const postSlugs = collectPublishedPostSlugs(postsDir);
  const xml = buildSitemapXml(siteUrl, postSlugs);
  fs.writeFileSync(outputFile, xml, 'utf-8');

  console.log(`Generated sitemap.xml with ${postSlugs.length + 1} urls`);
}

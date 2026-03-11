import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { buildSitemapXml } from './sitemap-utils.mjs';

export const collectPublishedPostSlugs = (postsDir) =>
  fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .flatMap((entry) => {
      const filePath = path.join(postsDir, entry.name);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);

      if (parsed.data?.draft === true) {
        return [];
      }

      return [entry.name.replace(/\.md$/, '')];
    });

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

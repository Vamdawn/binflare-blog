import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const FrontmatterSchema = z.object({
  title: z.string().trim().min(1, 'title is required'),
  date: z.preprocess(
    (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
    z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
  ),
  summary: z.string().trim().min(1).optional(),
  draft: z.boolean().optional(),
});

const cwd = process.cwd();
const postsDir = path.join(cwd, 'content/posts');

const entries = fs
  .readdirSync(postsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

const slugs = new Set();

for (const entry of entries) {
  const filePath = path.join(postsDir, entry.name);
  const slug = entry.name.replace(/\.md$/, '');

  if (!slug.trim()) {
    throw new Error(`Invalid slug from filename: ${entry.name}`);
  }
  if (slugs.has(slug)) {
    throw new Error(`Duplicate slug: ${slug}`);
  }
  slugs.add(slug);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(raw);

  try {
    FrontmatterSchema.parse(parsed.data);
  } catch (error) {
    throw new Error(`Invalid frontmatter in ${entry.name}: ${error}`);
  }
}

console.log(`Validated ${entries.length} posts`);

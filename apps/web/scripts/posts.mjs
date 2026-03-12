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

export const readValidatedPosts = (postsDir) => {
  const entries = fs
    .readdirSync(postsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'));

  const slugs = new Set();

  const posts = entries.map((entry) => {
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

    const fm = FrontmatterSchema.parse(parsed.data);
    return {
      meta: {
        title: fm.title,
        date: fm.date,
        summary: fm.summary,
        draft: fm.draft ?? false,
        slug,
      },
      content: parsed.content.trim(),
    };
  });

  return posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date));
};

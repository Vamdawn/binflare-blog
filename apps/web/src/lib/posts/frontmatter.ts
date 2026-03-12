import matter from 'gray-matter';
import { z } from 'zod';
import type { Post } from './types';

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

export const parsePost = (slug: string, rawMarkdown: string): Post => {
  const parsed = matter(rawMarkdown);
  const fm = FrontmatterSchema.parse(parsed.data);
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    throw new Error('slug is required');
  }

  return {
    meta: {
      title: fm.title,
      date: fm.date,
      summary: fm.summary,
      draft: fm.draft ?? false,
      slug: normalizedSlug,
    },
    content: parsed.content.trim(),
  };
};

import { parsePost } from './frontmatter';
import type { Post } from './types';

type RawPostInput = {
  slug: string;
  raw: string;
};

type BuildMode = 'development' | 'production';

export const buildPostCollection = (
  inputs: RawPostInput[],
  mode: BuildMode = 'development',
): Post[] => {
  const seen = new Set<string>();

  const posts = inputs.map(({ slug, raw }) => {
    const normalizedSlug = slug.trim();
    if (seen.has(normalizedSlug)) {
      throw new Error(`Duplicate slug: ${normalizedSlug}`);
    }
    seen.add(normalizedSlug);
    return parsePost(normalizedSlug, raw);
  });

  return posts
    .filter((post) => !(mode === 'production' && post.meta.draft))
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
};

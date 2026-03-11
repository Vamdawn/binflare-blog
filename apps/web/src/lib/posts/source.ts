import { buildPostCollection } from './loader';
import type { Post } from './types';

type BuildMode = 'development' | 'production';

export const buildPostsFromModules = (
  modules: Record<string, string>,
  mode: BuildMode = 'development',
): Post[] => {
  const inputs = Object.entries(modules).map(([filepath, raw]) => {
    const filename = filepath.split('/').pop() ?? '';
    const slug = filename.replace(/\.md$/, '');
    return {
      slug,
      raw,
    };
  });

  return buildPostCollection(inputs, mode);
};

const rawModules = import.meta.glob('../../../content/posts/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const mode = import.meta.env.PROD ? 'production' : 'development';
const posts = buildPostsFromModules(rawModules, mode);

export const getPosts = (): Post[] => posts;
export const getPostBySlug = (slug: string): Post | undefined =>
  posts.find((post) => post.meta.slug === slug);

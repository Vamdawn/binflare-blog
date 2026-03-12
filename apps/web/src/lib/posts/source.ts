import { generatedPosts } from '../../generated/posts.generated';
import type { Post } from './types';

const isProduction = import.meta.env.PROD;

const posts = generatedPosts.filter((post) => !(isProduction && post.meta.draft));

export const getPosts = (): Post[] => posts;
export const getPostBySlug = (slug: string): Post | undefined =>
  posts.find((post) => post.meta.slug === slug);

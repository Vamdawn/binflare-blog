import { describe, expect, it } from 'vitest';
import { getPostBySlug, getPosts } from './source';

describe('runtime source', () => {
  it('returns posts sorted by date desc', () => {
    const posts = getPosts();
    const dates = posts.map((post) => post.meta.date);

    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it('loads seeded post and supports lookup by slug', () => {
    const posts = getPosts();
    const firstPost = posts[0];
    const target = firstPost ? getPostBySlug(firstPost.meta.slug) : undefined;

    expect(posts.length).toBeGreaterThan(0);
    expect(firstPost).toBeDefined();
    expect(target).toBeDefined();
    expect(target?.meta.title).toBe(firstPost?.meta.title);
  });
});

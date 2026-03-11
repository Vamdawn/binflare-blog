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
    const target = getPostBySlug('hello-world');

    expect(posts.length).toBeGreaterThan(0);
    expect(target).toBeDefined();
    expect(target?.meta.title).toBe('Hello World');
  });
});

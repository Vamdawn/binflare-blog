import { describe, expect, it } from 'vitest';
import { buildPostsFromModules, getPostBySlug, getPosts } from './source';

describe('buildPostsFromModules', () => {
  it('extracts slugs from file path and keeps date-desc order', () => {
    const posts = buildPostsFromModules({
      '../../../content/posts/first.md': [
        '---',
        'title: First',
        'date: 2026-03-01',
        '---',
        '',
        'first body',
      ].join('\n'),
      '../../../content/posts/second.md': [
        '---',
        'title: Second',
        'date: 2026-03-11',
        '---',
        '',
        'second body',
      ].join('\n'),
    });

    expect(posts.map((post) => post.meta.slug)).toEqual(['second', 'first']);
  });

  it('filters drafts in production mode', () => {
    const posts = buildPostsFromModules(
      {
        '../../../content/posts/draft.md': [
          '---',
          'title: Draft',
          'date: 2026-03-11',
          'draft: true',
          '---',
          '',
          'draft body',
        ].join('\n'),
      },
      'production',
    );

    expect(posts).toHaveLength(0);
  });
});

describe('runtime source', () => {
  it('loads seeded post and supports lookup by slug', () => {
    const posts = getPosts();
    const target = getPostBySlug('hello-world');

    expect(posts.length).toBeGreaterThan(0);
    expect(target).toBeDefined();
    expect(target?.meta.title).toBe('Hello World');
  });
});

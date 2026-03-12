import { describe, expect, it } from 'vitest';
import { buildPostCollection } from './loader';

describe('buildPostCollection', () => {
  it('sorts posts by date in descending order', () => {
    const posts = buildPostCollection([
      {
        slug: 'older',
        raw: ['---', 'title: Older', 'date: 2026-03-01', '---', '', 'Old body'].join('\n'),
      },
      {
        slug: 'newer',
        raw: ['---', 'title: Newer', 'date: 2026-03-11', '---', '', 'New body'].join('\n'),
      },
    ]);

    expect(posts.map((post) => post.meta.slug)).toEqual(['newer', 'older']);
  });

  it('filters draft posts in production mode', () => {
    const posts = buildPostCollection(
      [
        {
          slug: 'draft-post',
          raw: ['---', 'title: Draft', 'date: 2026-03-11', 'draft: true', '---', '', 'Body'].join(
            '\n',
          ),
        },
      ],
      'production',
    );

    expect(posts).toHaveLength(0);
  });

  it('throws on duplicate slug', () => {
    expect(() =>
      buildPostCollection([
        {
          slug: 'same',
          raw: ['---', 'title: First', 'date: 2026-03-10', '---', '', 'Body'].join('\n'),
        },
        {
          slug: 'same',
          raw: ['---', 'title: Second', 'date: 2026-03-11', '---', '', 'Body'].join('\n'),
        },
      ]),
    ).toThrow(/Duplicate slug/);
  });
});

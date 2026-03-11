import { describe, expect, it } from 'vitest';
import { parsePost } from './frontmatter';

describe('parsePost', () => {
  it('parses valid frontmatter and injects slug', () => {
    const post = parsePost(
      'hello-world',
      `---
title: Hello
date: 2026-03-11
summary: intro
---

正文`,
    );

    expect(post.meta).toMatchObject({
      title: 'Hello',
      date: '2026-03-11',
      summary: 'intro',
      draft: false,
      slug: 'hello-world',
    });
    expect(post.content).toBe('正文');
  });

  it('throws on invalid date format', () => {
    expect(() =>
      parsePost(
        'bad-date',
        `---
title: Bad
date: 2026/03/11
---
body`,
      ),
    ).toThrow(/date/i);
  });
});

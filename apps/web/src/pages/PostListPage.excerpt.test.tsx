import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/posts/source', () => ({
  getPosts: () => [
    {
      meta: {
        title: '无摘要文章',
        date: '2026-03-13',
        draft: false,
        slug: 'no-summary-post',
      },
      content: 'a'.repeat(200),
    },
  ],
}));

import { PostListPage, excerptFromContent } from './PostListPage';

afterEach(() => {
  cleanup();
});

describe('PostListPage excerpt fallback', () => {
  it('builds excerpt from content as first 120 chars plus ellipsis', () => {
    expect(excerptFromContent('a'.repeat(200))).toBe(`${'a'.repeat(120)}...`);
  });

  it('renders excerpt fallback when summary is missing', () => {
    render(
      <MemoryRouter>
        <PostListPage />
      </MemoryRouter>,
    );

    const expectedExcerpt = `${'a'.repeat(120)}...`;

    expect(screen.getByText(expectedExcerpt)).toBeInTheDocument();
    expect(screen.queryByText('a'.repeat(200))).not.toBeInTheDocument();
  });
});

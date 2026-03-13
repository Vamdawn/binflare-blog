import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { PostCard } from './PostCard';

afterEach(() => {
  cleanup();
});

describe('PostCard', () => {
  it('renders one clickable card link with title/date/summary and no read-more button', () => {
    const slug = 'hello-world';
    const title = 'Hello World';
    const date = '2026-03-13';
    const summary = '这是一段摘要';

    render(
      <MemoryRouter>
        <PostCard slug={slug} title={title} date={date} summary={summary} />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', `/posts/${slug}`);
    expect(screen.getByText(date)).toBeInTheDocument();
    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.queryByText('阅读全文')).not.toBeInTheDocument();
  });
});

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { PostCard } from './PostCard';

afterEach(() => {
  cleanup();
});

describe('PostCard', () => {
  it('renders title link, date, summary and read-more link', () => {
    const slug = 'hello-world';
    const title = 'Hello World';
    const date = '2026-03-13';
    const summary = '这是一段摘要';

    const { container } = render(
      <MemoryRouter>
        <PostCard slug={slug} title={title} date={date} summary={summary} />
      </MemoryRouter>,
    );

    const titleLink = screen.getByRole('link', { name: title });
    expect(titleLink).toHaveAttribute('href', `/posts/${slug}`);
    expect(screen.getByText(date)).toBeInTheDocument();
    expect(screen.getByText(summary)).toBeInTheDocument();

    const actions = container.querySelector('.post-card-actions');
    expect(actions).toBeInTheDocument();

    const readMoreLink = within(actions as HTMLElement).getByRole('link', { name: '阅读全文' });
    expect(readMoreLink).toHaveAttribute('href', `/posts/${slug}`);
  });
});

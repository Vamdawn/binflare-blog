import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { PostListPage } from './PostListPage';

afterEach(() => {
  cleanup();
});

describe('PostListPage', () => {
  it('renders hero and semantic list region', () => {
    render(
      <MemoryRouter>
        <PostListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '文章' })).toBeInTheDocument();
    expect(screen.getByText('Binflare 的工程与产品实践')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '文章列表内容区' })).toBeInTheDocument();
  });
});

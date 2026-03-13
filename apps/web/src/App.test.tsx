import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { getPostBySlug } from './lib/posts/source';

afterEach(() => {
  cleanup();
});

describe('App routes', () => {
  it('renders list page on root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const banner = screen.getByRole('banner');
    const main = screen.getByRole('main');

    expect(banner).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(banner.closest('.site-shell')).not.toBeNull();
    expect(banner.closest('.site-shell')).toBe(main.closest('.site-shell'));
    expect(screen.getByRole('link', { name: '文章列表' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '文章' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '404' })).not.toBeInTheDocument();
  });

  it('renders post detail page for existing slug', () => {
    const post = getPostBySlug('hello-world');
    if (!post) {
      throw new Error('Expected hello-world post to exist in test data');
    }

    render(
      <MemoryRouter initialEntries={['/posts/hello-world']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: post.meta.title })).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: '返回文章列表' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
    expect(screen.queryByRole('heading', { name: '404' })).not.toBeInTheDocument();
  });

  it('renders 404 UI for unknown slug', async () => {
    render(
      <MemoryRouter initialEntries={['/posts/not-found']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/');
    expect(screen.getByText('未找到该文章或页面。')).toBeInTheDocument();
  });

  it('renders 404 UI for unknown route', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/');
  });
});

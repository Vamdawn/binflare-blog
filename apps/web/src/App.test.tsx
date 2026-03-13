import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';

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

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '文章列表' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '文章' })).toBeInTheDocument();
  });

  it('renders post detail page for existing slug', () => {
    render(
      <MemoryRouter initialEntries={['/posts/hello-world']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: '返回文章列表' });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('renders 404 UI for unknown slug', async () => {
    render(
      <MemoryRouter initialEntries={['/posts/not-found']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument();
  });
});

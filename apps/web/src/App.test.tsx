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

    expect(screen.getByRole('heading', { name: '文章' })).toBeInTheDocument();
  });

  it('renders post detail page for existing slug', () => {
    render(
      <MemoryRouter initialEntries={['/posts/hello-world']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hello World' })).toBeInTheDocument();
  });

  it('redirects unknown slug to 404 page', async () => {
    render(
      <MemoryRouter initialEntries={['/posts/not-found']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument();
  });
});

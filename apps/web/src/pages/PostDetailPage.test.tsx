import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as postSource from '../lib/posts/source';
import type { Post } from '../lib/posts/types';
import { PostDetailPage } from './PostDetailPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderDetailPage(initialPath = '/posts/sample') {
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/posts/:slug" element={<PostDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PostDetailPage', () => {
  it('renders back link, date metadata, summary and semantic article for seeded post', () => {
    const seededPost = postSource.getPosts()[0];
    expect(seededPost).toBeDefined();
    if (!seededPost) {
      return;
    }

    renderDetailPage(`/posts/${seededPost.meta.slug}`);

    const article = screen
      .getAllByRole('article')
      .find((item) => item.classList.contains('post-detail'));
    expect(article).toBeInTheDocument();
    if (!article) {
      return;
    }

    const header = article.querySelector<HTMLElement>('.post-detail-header');
    expect(header).not.toBeNull();
    if (!header) {
      return;
    }

    expect(within(header).getByRole('link', { name: '返回文章列表' })).toHaveAttribute('href', '/');
    expect(within(header).getByText(seededPost.meta.date)).toBeInTheDocument();
    expect(
      within(header).getByRole('heading', { level: 2, name: seededPost.meta.title }),
    ).toBeInTheDocument();
    if (seededPost.meta.summary) {
      expect(document.querySelector('.post-detail-summary')).toHaveTextContent(
        seededPost.meta.summary,
      );
      const quote = screen.getByRole('complementary', { name: '文章金句' });
      expect(within(quote).getByText(seededPost.meta.summary)).toBeInTheDocument();
    }

    const outline = screen.getByRole('navigation', { name: '章节导航' });
    expect(outline).toBeInTheDocument();
    expect(article.contains(outline)).toBe(false);
    const buttons = within(outline).getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(1);

    const firstButton = buttons[0];
    const secondButton = buttons[1];
    expect(firstButton).toHaveAttribute('aria-current', 'true');
    expect(secondButton).not.toHaveAttribute('aria-current');

    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollSpy,
      writable: true,
    });

    fireEvent.click(secondButton);
    expect(secondButton).toHaveAttribute('aria-current', 'true');
    expect(firstButton).not.toHaveAttribute('aria-current');
    expect(scrollSpy).toHaveBeenCalled();

    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: originalScrollIntoView,
        writable: true,
      });
    } else {
      // jsdom default: no scrollIntoView implementation
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: undefined,
        writable: true,
      });
    }
  });

  it('does not render summary paragraph when summary is missing', () => {
    const mockPost: Post = {
      meta: {
        title: 'No Summary Post',
        date: '2026-03-10',
        draft: false,
        slug: 'no-summary',
      },
      content: '## 第一节\n\n内容段落',
    };

    vi.spyOn(postSource, 'getPostBySlug').mockReturnValue(mockPost);
    renderDetailPage('/posts/no-summary');

    expect(document.querySelector('.post-detail-summary')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '文章金句' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '章节导航' })).toBeInTheDocument();
  });
});

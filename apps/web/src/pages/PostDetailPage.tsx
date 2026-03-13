import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SeoHead } from '../components/SeoHead';
import { SiteLayout } from '../components/SiteLayout';
import { getPostBySlug } from '../lib/posts/source';

const HEADING_LEVEL_TWO_REGEX = /^##\s+(.+)$/gm;

type SectionHeading = {
  id: string;
  text: string;
};

const extractLevelTwoHeadings = (content: string): string[] => {
  const matches = [...content.matchAll(HEADING_LEVEL_TWO_REGEX)];
  return matches
    .map((item) => item[1]?.trim() ?? '')
    .filter(Boolean)
    .map((heading) =>
      heading
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/[`*_~]/g, '')
        .trim(),
    );
};

const createSectionHeadings = (content: string): SectionHeading[] => {
  return extractLevelTwoHeadings(content).map((text, index) => ({
    id: `section-${index + 1}`,
    text,
  }));
};

const createPullQuote = (summary: string | undefined, content: string): string => {
  if (summary) {
    return summary;
  }

  const normalized = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*`_>\-|[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '持续记录，持续迭代。';
  }

  return normalized.length > 72 ? `${normalized.slice(0, 72)}...` : normalized;
};

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const articleRef = useRef<HTMLDivElement | null>(null);

  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  const post = getPostBySlug(slug);
  if (!post) {
    return <Navigate to="/404" replace />;
  }

  const sectionHeadings = useMemo(() => createSectionHeadings(post.content), [post.content]);
  const pullQuote = createPullQuote(post.meta.summary, post.content);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sectionHeadings[0]?.id ?? null,
  );

  useEffect(() => {
    setActiveSectionId(sectionHeadings[0]?.id ?? null);
  }, [sectionHeadings]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root || sectionHeadings.length === 0) {
      return;
    }

    const targets = Array.from(root.querySelectorAll('h2'));
    for (const [index, target] of targets.entries()) {
      const section = sectionHeadings[index];
      if (section) {
        target.id = section.id;
      }
    }

    if (typeof IntersectionObserver !== 'function') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const firstVisible = visible[0];
        if (!firstVisible) {
          return;
        }
        const id = (firstVisible.target as HTMLElement).id;
        if (id) {
          setActiveSectionId(id);
        }
      },
      {
        root: null,
        rootMargin: '-25% 0px -65% 0px',
        threshold: [0, 1],
      },
    );

    for (const target of targets) {
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
    };
  }, [sectionHeadings]);

  const jumpToSection = (sectionId: string) => {
    const target = articleRef.current?.querySelector<HTMLElement>(`#${sectionId}`);
    setActiveSectionId(sectionId);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <SiteLayout>
      <SeoHead
        title={`${post.meta.title} | Binflare Blog`}
        description={post.meta.summary ?? `${post.meta.title} - Binflare Blog`}
      />
      <div className="post-detail-layout">
        <article className="post-detail">
          <header className="post-detail-header">
            <Link className="site-link" to="/">
              返回文章列表
            </Link>
            <p className="post-detail-date">{post.meta.date}</p>
            <h2 className="post-detail-title">{post.meta.title}</h2>
          </header>
          {post.meta.summary ? <p className="post-detail-summary">{post.meta.summary}</p> : null}
          <aside aria-label="文章金句" className="post-pull-quote">
            <p>{pullQuote}</p>
          </aside>
          <div className="post-reading-content" ref={articleRef}>
            <MarkdownRenderer content={post.content} />
          </div>
        </article>
        {sectionHeadings.length > 0 ? (
          <nav aria-label="章节导航" className="post-outline post-outline-sidebar">
            <p className="post-outline-title">章节导航</p>
            <ol className="post-outline-list">
              {sectionHeadings.map((heading) => (
                <li key={heading.id}>
                  <button
                    aria-current={activeSectionId === heading.id ? 'true' : undefined}
                    className="post-outline-button"
                    onClick={() => jumpToSection(heading.id)}
                    type="button"
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </div>
    </SiteLayout>
  );
}

import { Link, Navigate, useParams } from 'react-router-dom';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { SeoHead } from '../components/SeoHead';
import { SiteLayout } from '../components/SiteLayout';
import { getPostBySlug } from '../lib/posts/source';

export function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) {
    return <Navigate to="/404" replace />;
  }

  const post = getPostBySlug(slug);
  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <SiteLayout>
      <SeoHead
        title={`${post.meta.title} | Binflare Blog`}
        description={post.meta.summary ?? `${post.meta.title} - Binflare Blog`}
      />
      <article className="post-detail">
        <header className="post-detail-header">
          <Link className="site-link" to="/">
            返回文章列表
          </Link>
          <p className="post-detail-date">{post.meta.date}</p>
          <h2 className="post-detail-title">{post.meta.title}</h2>
        </header>
        {post.meta.summary ? <p className="post-detail-summary">{post.meta.summary}</p> : null}
        <MarkdownRenderer content={post.content} />
      </article>
    </SiteLayout>
  );
}

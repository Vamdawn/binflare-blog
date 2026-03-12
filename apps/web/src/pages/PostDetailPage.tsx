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
      <article>
        <h2 className="post-detail-title">{post.meta.title}</h2>
        <p className="post-detail-date">{post.meta.date}</p>
        <MarkdownRenderer content={post.content} />
      </article>
      <p>
        <Link className="site-link" to="/">
          返回文章列表
        </Link>
      </p>
    </SiteLayout>
  );
}

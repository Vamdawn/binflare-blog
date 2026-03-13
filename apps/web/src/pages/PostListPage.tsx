import { PostCard } from '../components/PostCard';
import { SeoHead } from '../components/SeoHead';
import { SiteLayout } from '../components/SiteLayout';
import { getPosts } from '../lib/posts/source';

const EXCERPT_LENGTH = 120;

const excerptFromContent = (content: string): string => {
  const plain = content.replace(/\s+/g, ' ').trim();
  return plain.length <= EXCERPT_LENGTH ? plain : `${plain.slice(0, EXCERPT_LENGTH)}...`;
};

export function PostListPage() {
  const posts = getPosts();

  return (
    <SiteLayout>
      <SeoHead title="文章列表 | Binflare Blog" description="Binflare Blog 全部文章列表" />
      <section className="home-hero">
        <div className="home-hero-content">
          <h2>文章</h2>
          <p>Binflare 的工程与产品实践</p>
        </div>
        <div aria-hidden="true" className="home-hero-decor">
          <i className="shape-dot" />
          <i className="shape-block" />
          <i className="shape-wave" />
        </div>
      </section>
      <section aria-label="文章列表内容区">
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post.meta.slug}
              slug={post.meta.slug}
              title={post.meta.title}
              date={post.meta.date}
              summary={post.meta.summary ?? excerptFromContent(post.content)}
            />
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

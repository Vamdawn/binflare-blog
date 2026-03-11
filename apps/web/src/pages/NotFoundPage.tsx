import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { SiteLayout } from '../components/SiteLayout';

export function NotFoundPage() {
  return (
    <SiteLayout>
      <SeoHead title="页面不存在 | Binflare Blog" description="请求的页面不存在" />
      <section className="not-found">
        <h2>404</h2>
        <p>未找到该文章或页面。</p>
        <p>
          <Link className="site-link" to="/">
            返回首页
          </Link>
        </p>
      </section>
    </SiteLayout>
  );
}

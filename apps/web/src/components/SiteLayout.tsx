import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

type SiteLayoutProps = {
  children: ReactNode;
};

const ICP_RECORD_NUMBER = '豫ICP备2026008070号';
const MIIT_ICP_URL = 'https://beian.miit.gov.cn/';

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <h1 className="site-title">Binflare Blog</h1>
        <Link className="site-link" to="/">
          文章列表
        </Link>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <a
          className="site-footer-link"
          href={MIIT_ICP_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          {ICP_RECORD_NUMBER}
        </a>
      </footer>
    </div>
  );
}

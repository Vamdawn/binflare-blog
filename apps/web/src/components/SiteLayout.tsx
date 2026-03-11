import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

type SiteLayoutProps = {
  children: ReactNode;
};

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <main className="site-shell">
      <header className="site-header">
        <h1 className="site-title">Binflare Blog</h1>
        <Link className="site-link" to="/">
          文章列表
        </Link>
      </header>
      {children}
    </main>
  );
}

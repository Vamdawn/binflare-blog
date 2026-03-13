import { Link } from 'react-router-dom';

type PostCardProps = {
  slug: string;
  title: string;
  date: string;
  summary: string;
};

export function PostCard({ slug, title, date, summary }: PostCardProps) {
  const postHref = `/posts/${slug}`;

  return (
    <article className="post-card">
      <h2 className="post-card-title">
        <Link to={postHref}>{title}</Link>
      </h2>
      <p className="post-card-date">{date}</p>
      <p className="post-card-summary">{summary}</p>
      <div className="post-card-actions">
        <Link to={postHref}>阅读全文</Link>
      </div>
    </article>
  );
}

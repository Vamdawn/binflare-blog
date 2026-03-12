import { Link } from 'react-router-dom';

type PostCardProps = {
  slug: string;
  title: string;
  date: string;
  summary: string;
};

export function PostCard({ slug, title, date, summary }: PostCardProps) {
  return (
    <article className="post-card">
      <h2 className="post-card-title">
        <Link to={`/posts/${slug}`}>{title}</Link>
      </h2>
      <p className="post-card-date">{date}</p>
      <p className="post-card-summary">{summary}</p>
    </article>
  );
}

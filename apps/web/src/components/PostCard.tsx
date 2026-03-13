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
    <Link className="post-card" to={postHref}>
      <h2 className="post-card-title">{title}</h2>
      <p className="post-card-date">{date}</p>
      <p className="post-card-summary">{summary}</p>
    </Link>
  );
}

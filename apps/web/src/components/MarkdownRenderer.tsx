import ReactMarkdown from 'react-markdown';

type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <article className="markdown-body">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  );
}

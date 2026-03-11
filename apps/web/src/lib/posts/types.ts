export type PostMeta = {
  title: string;
  date: string;
  summary?: string;
  draft: boolean;
  slug: string;
};

export type Post = {
  meta: PostMeta;
  content: string;
};

export type RawPostInput = {
  slug: string;
  raw: string;
};

export type BuildMode = 'development' | 'production';

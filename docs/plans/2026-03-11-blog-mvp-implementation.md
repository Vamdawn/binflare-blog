# Blog MVP (Markdown Static) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 1-week MVP personal blog that publishes from Markdown via Git, with only post list and post detail pages.

**Architecture:** Keep the app fully static. Parse Markdown at build-time from `apps/web/content/posts/*.md`, validate frontmatter, generate post index, and render list/detail routes in React. Fail fast in CI for invalid content and generate `sitemap.xml` during build.

**Tech Stack:** React 19, Vite 7, TypeScript, React Router 7, Vitest, Zod, gray-matter, react-markdown

---

### Task 1: Add dependencies and create content directory baseline

**Files:**
- Create: `apps/web/content/posts/.gitkeep`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Add failing import test for missing dependencies**

```ts
// apps/web/src/lib/posts/deps-smoke.test.ts
import { describe, expect, it } from 'vitest';

describe('post deps', () => {
  it('loads markdown toolchain', async () => {
    await expect(import('gray-matter')).resolves.toBeDefined();
    await expect(import('react-markdown')).resolves.toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/lib/posts/deps-smoke.test.ts`  
Expected: FAIL with module-not-found errors for `gray-matter` and `react-markdown`.

**Step 3: Install minimal dependencies**

```json
{
  "dependencies": {
    "gray-matter": "^4.0.3",
    "react-markdown": "^10.1.0"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/lib/posts/deps-smoke.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml apps/web/content/posts/.gitkeep apps/web/src/lib/posts/deps-smoke.test.ts
git commit -m "chore(web): add markdown dependencies and content baseline"
```

### Task 2: Implement frontmatter schema and parser utilities

**Files:**
- Create: `apps/web/src/lib/posts/types.ts`
- Create: `apps/web/src/lib/posts/frontmatter.ts`
- Test: `apps/web/src/lib/posts/frontmatter.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { parsePost } from './frontmatter';

describe('parsePost', () => {
  it('parses valid frontmatter', () => {
    const result = parsePost('hello-world', `---\ntitle: Hello\ndate: 2026-03-11\n---\nBody`);
    expect(result.meta.title).toBe('Hello');
    expect(result.meta.date).toBe('2026-03-11');
  });

  it('throws on invalid date format', () => {
    expect(() =>
      parsePost('bad-date', `---\ntitle: Bad\ndate: 03/11/2026\n---\nBody`),
    ).toThrow(/date/i);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/lib/posts/frontmatter.test.ts`  
Expected: FAIL because `parsePost` is not implemented.

**Step 3: Write minimal implementation**

```ts
// apps/web/src/lib/posts/types.ts
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
```

```ts
// apps/web/src/lib/posts/frontmatter.ts
import matter from 'gray-matter';
import { z } from 'zod';
import type { Post } from './types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const FrontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(dateRegex, 'date must be YYYY-MM-DD'),
  summary: z.string().optional(),
  draft: z.boolean().optional(),
});

export const parsePost = (slug: string, rawMarkdown: string): Post => {
  const parsed = matter(rawMarkdown);
  const fm = FrontmatterSchema.parse(parsed.data);
  return {
    meta: {
      title: fm.title,
      date: fm.date,
      summary: fm.summary,
      draft: fm.draft ?? false,
      slug,
    },
    content: parsed.content.trim(),
  };
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/lib/posts/frontmatter.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/posts/types.ts apps/web/src/lib/posts/frontmatter.ts apps/web/src/lib/posts/frontmatter.test.ts
git commit -m "feat(web): add frontmatter schema and parser"
```

### Task 3: Build post collection loader with sorting/filtering/slug guards

**Files:**
- Create: `apps/web/src/lib/posts/loader.ts`
- Test: `apps/web/src/lib/posts/loader.test.ts`

**Step 1: Write failing tests for collection rules**

```ts
import { describe, expect, it } from 'vitest';
import { buildPostCollection } from './loader';

describe('buildPostCollection', () => {
  it('sorts by date desc', () => {
    const posts = buildPostCollection([
      { slug: 'a', raw: '---\ntitle: A\ndate: 2026-03-01\n---\nA' },
      { slug: 'b', raw: '---\ntitle: B\ndate: 2026-03-11\n---\nB' },
    ]);
    expect(posts.map((p) => p.meta.slug)).toEqual(['b', 'a']);
  });

  it('excludes draft in production mode', () => {
    const posts = buildPostCollection(
      [{ slug: 'a', raw: '---\ntitle: A\ndate: 2026-03-11\ndraft: true\n---\nA' }],
      'production',
    );
    expect(posts).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/lib/posts/loader.test.ts`  
Expected: FAIL because `buildPostCollection` is missing.

**Step 3: Write minimal implementation**

```ts
import { parsePost } from './frontmatter';
import type { Post } from './types';

type RawInput = { slug: string; raw: string };
type BuildMode = 'development' | 'production';

export const buildPostCollection = (inputs: RawInput[], mode: BuildMode = 'development'): Post[] => {
  const seen = new Set<string>();
  const posts = inputs.map(({ slug, raw }) => {
    if (seen.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
    seen.add(slug);
    return parsePost(slug, raw);
  });

  return posts
    .filter((post) => !(mode === 'production' && post.meta.draft))
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/lib/posts/loader.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/posts/loader.ts apps/web/src/lib/posts/loader.test.ts
git commit -m "feat(web): add post loader with sort and draft filtering"
```

### Task 4: Wire Markdown content source and route-level data access

**Files:**
- Create: `apps/web/src/lib/posts/source.ts`
- Modify: `apps/web/src/lib/posts/loader.ts`
- Test: `apps/web/src/lib/posts/source.test.ts`

**Step 1: Write failing tests for lookup APIs**

```ts
import { describe, expect, it } from 'vitest';
import { getPostBySlug, getPosts } from './source';

describe('source', () => {
  it('returns list and supports lookup', () => {
    const posts = getPosts();
    expect(Array.isArray(posts)).toBe(true);
    if (posts.length > 0) {
      expect(getPostBySlug(posts[0].meta.slug)?.meta.slug).toBe(posts[0].meta.slug);
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/lib/posts/source.test.ts`  
Expected: FAIL because source module is not implemented.

**Step 3: Implement Vite content source**

```ts
import { buildPostCollection } from './loader';

const modules = import.meta.glob('../../../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const inputs = Object.entries(modules).map(([path, raw]) => ({
  slug: path.split('/').pop()?.replace(/\.md$/, '') ?? '',
  raw,
}));

const posts = buildPostCollection(
  inputs.filter((item) => item.slug),
  import.meta.env.PROD ? 'production' : 'development',
);

export const getPosts = () => posts;
export const getPostBySlug = (slug: string) => posts.find((p) => p.meta.slug === slug);
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/lib/posts/source.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/posts/source.ts apps/web/src/lib/posts/source.test.ts apps/web/src/lib/posts/loader.ts
git commit -m "feat(web): load markdown posts via vite glob source"
```

### Task 5: Build list/detail/404 pages and router

**Files:**
- Create: `apps/web/src/pages/PostListPage.tsx`
- Create: `apps/web/src/pages/PostDetailPage.tsx`
- Create: `apps/web/src/pages/NotFoundPage.tsx`
- Create: `apps/web/src/components/MarkdownRenderer.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.css`
- Test: `apps/web/src/App.test.tsx`

**Step 1: Write failing route tests**

```tsx
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('routes', () => {
  it('renders list page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /文章列表/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/App.test.tsx`  
Expected: FAIL because list/detail pages and test setup are missing.

**Step 3: Implement pages and router**

```tsx
// apps/web/src/App.tsx
import { Navigate, Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './pages/NotFoundPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { PostListPage } from './pages/PostListPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PostListPage />} />
      <Route path="/posts/:slug" element={<PostDetailPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/App.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/pages apps/web/src/components apps/web/src/App.tsx apps/web/src/App.css apps/web/src/App.test.tsx
git commit -m "feat(web): add post list/detail routes and pages"
```

### Task 6: Add web test environment for React route tests

**Files:**
- Modify: `vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Write a failing DOM matcher test**

```ts
import { describe, expect, it } from 'vitest';

describe('dom matcher', () => {
  it('supports toBeInTheDocument', () => {
    document.body.innerHTML = '<div data-testid="x">x</div>';
    expect(document.querySelector('[data-testid="x"]')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/src/test/dom-smoke.test.ts`  
Expected: FAIL because jsdom and jest-dom setup are missing.

**Step 3: Configure jsdom + setup + deps**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    passWithNoTests: true,
    environmentMatchGlobs: [['apps/web/src/**/*.test.tsx', 'jsdom'], ['apps/web/src/test/**/*.test.ts', 'jsdom']],
    setupFiles: ['apps/web/src/test/setup.ts'],
  },
});
```

```ts
// apps/web/src/test/setup.ts
import '@testing-library/jest-dom/vitest';
```

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "jsdom": "^26.1.0"
  }
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test -- apps/web/src/test/dom-smoke.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add vitest.config.ts apps/web/src/test/setup.ts apps/web/package.json pnpm-lock.yaml apps/web/src/test/dom-smoke.test.ts
git commit -m "test(web): enable jsdom and testing-library setup"
```

### Task 7: Add SEO helpers and sitemap generation

**Files:**
- Create: `apps/web/scripts/generate-sitemap.mjs`
- Create: `apps/web/src/components/SeoHead.tsx`
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/pages/PostListPage.tsx`
- Modify: `apps/web/src/pages/PostDetailPage.tsx`
- Test: `apps/web/scripts/generate-sitemap.test.ts`

**Step 1: Write failing sitemap generation test**

```ts
import { describe, expect, it } from 'vitest';
import { buildSitemapXml } from './generate-sitemap';

describe('buildSitemapXml', () => {
  it('contains root and post url', () => {
    const xml = buildSitemapXml('https://example.com', ['hello-world']);
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/posts/hello-world</loc>');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/scripts/generate-sitemap.test.ts`  
Expected: FAIL because builder function is missing.

**Step 3: Implement sitemap builder + script and wire build**

```js
// apps/web/scripts/generate-sitemap.mjs
import fs from 'node:fs';
import path from 'node:path';

export const buildSitemapXml = (siteUrl, slugs) => {
  const urls = ['/', ...slugs.map((slug) => `/posts/${slug}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${siteUrl}${u}</loc></url>`).join('\n')}
</urlset>`;
};

const root = path.resolve(process.cwd(), 'apps/web');
const postDir = path.join(root, 'content/posts');
const slugs = fs
  .readdirSync(postDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => name.replace(/\.md$/, ''));
const siteUrl = process.env.SITE_URL ?? 'https://example.com';
const xml = buildSitemapXml(siteUrl, slugs);
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
```

```json
{
  "scripts": {
    "build": "node ./scripts/generate-sitemap.mjs && tsc -b && vite build"
  }
}
```

**Step 4: Run test/build to verify it passes**

Run: `pnpm test -- apps/web/scripts/generate-sitemap.test.ts && pnpm --filter web build`  
Expected: PASS and `apps/web/public/sitemap.xml` generated.

**Step 5: Commit**

```bash
git add apps/web/scripts/generate-sitemap.mjs apps/web/scripts/generate-sitemap.test.ts apps/web/src/components/SeoHead.tsx apps/web/src/pages/PostListPage.tsx apps/web/src/pages/PostDetailPage.tsx apps/web/package.json apps/web/public/sitemap.xml
git commit -m "feat(web): add basic seo head and sitemap generation"
```

### Task 8: Seed first post and complete acceptance verification

**Files:**
- Create: `apps/web/content/posts/hello-world.md`
- Modify: `README.md`

**Step 1: Add failing smoke expectation for seeded content**

```ts
import { describe, expect, it } from 'vitest';
import { getPostBySlug } from '../src/lib/posts/source';

describe('seed content', () => {
  it('contains hello-world post', () => {
    expect(getPostBySlug('hello-world')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- apps/web/content/seed-smoke.test.ts`  
Expected: FAIL because seeded post file does not exist.

**Step 3: Add first post and docs**

```md
---
title: "Hello World"
date: "2026-03-11"
summary: "第一篇用于验证发布链路的文章。"
draft: false
---

这是一篇用于验证 MVP 发布链路的示例文章。
```

`README.md` add a short section:

```md
## Content Workflow

1. Add markdown file under `apps/web/content/posts`.
2. Use required frontmatter fields: `title`, `date`.
3. Commit and push to trigger deployment.
```

**Step 4: Run full verification**

Run: `pnpm lint && pnpm test && pnpm --filter web build`  
Expected: all PASS, and app contains list/detail pages driven by Markdown.

**Step 5: Commit**

```bash
git add apps/web/content/posts/hello-world.md apps/web/content/seed-smoke.test.ts README.md
git commit -m "docs(web): seed first post and document content workflow"
```

### Task 9: Final manual QA and release checklist

**Files:**
- Modify: `docs/plans/2026-03-11-blog-mvp-implementation.md`

**Step 1: Run local app smoke checks**

Run: `pnpm dev`  
Expected:

1. `/` shows post list.
2. `/posts/hello-world` shows markdown detail.
3. `/posts/not-exist` redirects to 404.

**Step 2: Run production preview checks**

Run: `pnpm --filter web build && pnpm --filter web preview`  
Expected:

1. `sitemap.xml` available at `/sitemap.xml`.
2. page title and meta description change per route.

**Step 3: Record release-ready checklist**

```md
- [ ] Frontmatter validation failures are clear
- [ ] Draft filtering works in production
- [ ] Post list ordering is correct
- [ ] Post detail rendering is readable on mobile
- [ ] Deployment env var `SITE_URL` configured
```

**Step 4: Commit checklist update**

```bash
git add docs/plans/2026-03-11-blog-mvp-implementation.md
git commit -m "chore(plan): add final qa checklist for blog mvp"
```

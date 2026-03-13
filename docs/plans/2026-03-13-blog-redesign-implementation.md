# Blog List & Detail Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改变路由与数据源的前提下，完成文章列表页与详情页的全量视觉重设计，并保证关键行为可测、可回归。

**Architecture:** 采用「样式 token + 页面结构重构 + 组件语义增强」路线。先补页面行为测试并让其失败，再最小化修改组件与样式使测试通过，最后进行跨路由回归验证。每个任务限制在 2~3 个文件内，降低回归风险并支持频繁提交。

**Tech Stack:** React 19, React Router 7, TypeScript, Vitest, Testing Library, CSS（`App.css` + `index.css`）

---

## 执行约束

- 技能要求：@test-driven-development @verification-before-completion @systematic-debugging
- 每个任务严格遵循：先写失败测试 -> 验证失败 -> 最小实现 -> 验证通过 -> 提交
- 每个任务最多修改 3 个文件
- 不引入新业务功能（搜索/标签/上一篇下一篇）

### Task 1: 列表页结构重构（Hero + 语义区块）

**Files:**
- Create: `apps/web/src/pages/PostListPage.test.tsx`
- Modify: `apps/web/src/pages/PostListPage.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/src/pages/PostListPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PostListPage } from './PostListPage';

describe('PostListPage', () => {
  it('renders page hero and article region', () => {
    render(
      <MemoryRouter>
        <PostListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: '文章' })).toBeInTheDocument();
    expect(screen.getByText('Binflare 的工程与产品实践')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '文章列表内容区' })).toBeInTheDocument();
  });
});
```

同时更新 `apps/web/src/App.test.tsx` 的首页断言：

```tsx
expect(screen.getByRole('heading', { name: '文章' })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.test.tsx apps/web/src/App.test.tsx`  
Expected: FAIL，提示找不到标题“文章”或区域“文章列表内容区”。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostListPage.tsx` 调整结构：

```tsx
<section className="post-list-hero">
  <h2>文章</h2>
  <p>Binflare 的工程与产品实践</p>
</section>
<section aria-label="文章列表内容区">
  <div className="post-list">{/* cards */}</div>
</section>
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.test.tsx apps/web/src/App.test.tsx`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostListPage.test.tsx apps/web/src/pages/PostListPage.tsx apps/web/src/App.test.tsx
git commit -m "test(web): cover redesigned list page hero semantics"
```

### Task 2: 列表卡片信息层级重构（标题/日期/摘要/CTA）

**Files:**
- Create: `apps/web/src/components/PostCard.test.tsx`
- Modify: `apps/web/src/components/PostCard.tsx`
- Modify: `apps/web/src/App.css`

**Step 1: Write the failing test**

```tsx
// apps/web/src/components/PostCard.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PostCard } from './PostCard';

describe('PostCard', () => {
  it('renders title link, date, summary and CTA text', () => {
    render(
      <MemoryRouter>
        <PostCard slug="hello-world" title="Hello World" date="2026-03-13" summary="summary text" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Hello World' })).toHaveAttribute('href', '/posts/hello-world');
    expect(screen.getByText('2026-03-13')).toBeInTheDocument();
    expect(screen.getByText('summary text')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '阅读全文' })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/components/PostCard.test.tsx`  
Expected: FAIL，缺少“阅读全文”链接。

**Step 3: Write minimal implementation**

在 `apps/web/src/components/PostCard.tsx` 增加 CTA：

```tsx
<p className="post-card-actions">
  <Link to={`/posts/${slug}`}>阅读全文</Link>
</p>
```

在 `apps/web/src/App.css` 增加/调整类名：

```css
.post-card-actions a {
  color: var(--accent);
  text-decoration: none;
}
.post-card-actions a:hover {
  color: var(--accent-strong);
  text-decoration: underline;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/components/PostCard.test.tsx`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/components/PostCard.test.tsx apps/web/src/components/PostCard.tsx apps/web/src/App.css
git commit -m "feat(web): redesign post card hierarchy and cta"
```

### Task 3: 详情页头部结构重构（返回入口 + 日期 + 可选 summary）

**Files:**
- Create: `apps/web/src/pages/PostDetailPage.test.tsx`
- Modify: `apps/web/src/pages/PostDetailPage.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/src/pages/PostDetailPage.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PostDetailPage } from './PostDetailPage';

describe('PostDetailPage', () => {
  it('renders back link and meta row', () => {
    render(
      <MemoryRouter initialEntries={['/posts/hello-world']}>
        <Routes>
          <Route path="/posts/:slug" element={<PostDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '返回文章列表' })).toHaveAttribute('href', '/');
    expect(screen.getByText('2026-03-11')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

在 `apps/web/src/App.test.tsx` 保留并增强详情页断言：

```tsx
expect(screen.getByRole('link', { name: '返回文章列表' })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx apps/web/src/App.test.tsx`  
Expected: FAIL，找不到语义化的详情头部结构或 `article` 容器。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostDetailPage.tsx` 使用结构：

```tsx
<article className="post-detail">
  <header className="post-detail-header">
    <Link className="site-link" to="/">返回文章列表</Link>
    <p className="post-detail-date">{post.meta.date}</p>
    <h2 className="post-detail-title">{post.meta.title}</h2>
    {post.meta.summary ? <p className="post-detail-summary">{post.meta.summary}</p> : null}
  </header>
  <MarkdownRenderer content={post.content} />
</article>
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx apps/web/src/App.test.tsx`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostDetailPage.test.tsx apps/web/src/pages/PostDetailPage.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): redesign post detail header and reading metadata"
```

### Task 4: 样式 Token 与页面视觉重建（瑞士编辑风）

**Files:**
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/App.css`
- Modify: `apps/web/src/components/SiteLayout.tsx`

**Step 1: Write the failing test**

在 `apps/web/src/App.test.tsx` 新增结构存在性断言（当前实现应失败）：

```tsx
expect(screen.getByRole('banner')).toBeInTheDocument();
expect(screen.getByText('Binflare Blog')).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/App.test.tsx`  
Expected: FAIL，`banner` 语义不存在。

**Step 3: Write minimal implementation**

1) 在 `apps/web/src/components/SiteLayout.tsx`：

```tsx
<header className="site-header" role="banner">
  <h1 className="site-title">Binflare Blog</h1>
  <Link className="site-link" to="/">文章列表</Link>
</header>
```

2) 在 `apps/web/src/index.css` 注入字体与 token：

```css
@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@500;600;700&family=Roboto:wght@400;500;700&display=swap');
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #0f172a;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --accent: #2563eb;
  --accent-strong: #1d4ed8;
  --focus-ring: #93c5fd;
}
```

3) 在 `apps/web/src/App.css` 重建页面布局、卡片、详情、markdown 排版、响应式与 reduced-motion。

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/App.test.tsx`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/index.css apps/web/src/App.css apps/web/src/components/SiteLayout.tsx
git commit -m "style(web): rebuild blog visual system with swiss editorial tokens"
```

### Task 5: 摘要回退与路由回归验证

**Files:**
- Create: `apps/web/src/pages/PostListPage.excerpt.test.tsx`
- Modify: `apps/web/src/pages/PostListPage.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

```tsx
// apps/web/src/pages/PostListPage.excerpt.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostListPage } from './PostListPage';

vi.mock('../lib/posts/source', () => ({
  getPosts: () => [
    {
      meta: { slug: 'no-summary', title: 'No Summary', date: '2026-03-13' },
      content: 'a'.repeat(200),
    },
  ],
}));

describe('PostListPage excerpt fallback', () => {
  it('uses content excerpt when summary is absent', () => {
    render(
      <MemoryRouter>
        <PostListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/^a{120}\.\.\.$/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.excerpt.test.tsx`  
Expected: FAIL，若摘要逻辑被改坏会无法匹配 120 字 + `...`。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostListPage.tsx` 保留并明确纯函数：

```ts
const excerptFromContent = (content: string): string => {
  const plain = content.replace(/\s+/g, ' ').trim();
  return plain.length <= 120 ? plain : `${plain.slice(0, 120)}...`;
};
```

并确保传值：

```tsx
summary={post.meta.summary ?? excerptFromContent(post.content)}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.excerpt.test.tsx apps/web/src/App.test.tsx`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostListPage.excerpt.test.tsx apps/web/src/pages/PostListPage.tsx apps/web/src/App.test.tsx
git commit -m "test(web): lock excerpt fallback and routing regressions"
```

### Task 6: 最终验证与交付说明

**Files:**
- Modify: `apps/web/README.md`
- Modify: `docs/plans/2026-03-13-blog-redesign-design.md`

**Step 1: Write the failing test**

本任务为文档与验证任务，无单元测试；改为先执行验证命令并记录失败项（如有）。

**Step 2: Run test to verify baseline**

Run: `pnpm lint && pnpm test && pnpm --filter web build`  
Expected: 全部通过；若失败，按 @systematic-debugging 逐项定位后修复。

**Step 3: Write minimal implementation**

- 在 `apps/web/README.md` 添加“新版列表/详情页设计说明与截图占位”小节
- 在设计文档末尾追加“实施完成状态”和“验证结果”

**Step 4: Re-run verification**

Run: `pnpm lint && pnpm test && pnpm --filter web build`  
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/README.md docs/plans/2026-03-13-blog-redesign-design.md
git commit -m "docs(web): document redesigned list/detail behavior and verification"
```

## 全量验收清单

- 首页：出现新 Hero、副标题、双列/单列响应式卡片布局
- 卡片：标题、日期、摘要与“阅读全文”可见，hover/focus 状态清晰
- 详情页：返回入口、日期、标题、可选 summary、正文单栏阅读宽度生效
- Markdown：标题、段落、引用、代码块样式统一且可读
- 可访问性：键盘焦点清晰，语义 heading/landmark 可查询
- 回归：`/posts/not-found` 仍正确跳转 `/404`

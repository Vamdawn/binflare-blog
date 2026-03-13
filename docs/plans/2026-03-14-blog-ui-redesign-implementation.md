# Binflare Blog Editorial Precision UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改变博客路由与 Markdown 数据源的前提下，完成“理性高端 + 纯文章流 + 强阅读辅助”的 UI 重设计，并优先提升阅读完成率。

**Architecture:** 采用“行为先行（TDD）+ 样式重建”的方案：先通过测试锁定页面语义与交互行为，再最小化修改组件结构与 CSS token。详情页的目录联动、阅读进度与回顶按钮用渐进增强实现，保证 JS 降级时正文仍可阅读。所有实现按小步任务推进，每个任务最多修改 3 个文件。

**Tech Stack:** React 19、React Router 7、TypeScript、Vitest、Testing Library、CSS（`index.css` + `App.css`）

---

## 执行约束

- 技能要求：`@test-driven-development` `@systematic-debugging` `@verification-before-completion`
- 每个任务都遵循：先写失败测试 -> 验证失败 -> 最小实现 -> 验证通过 -> 提交
- 每个任务最多修改 3 个文件
- 不新增业务功能（搜索、标签、上一篇/下一篇、登录）

### Task 1: 首页改为纯文章流语义骨架

**Files:**
- Modify: `apps/web/src/pages/PostListPage.test.tsx`
- Modify: `apps/web/src/pages/PostListPage.tsx`
- Modify: `apps/web/src/App.test.tsx`

**Step 1: Write the failing test**

在 `apps/web/src/pages/PostListPage.test.tsx` 调整断言：

```tsx
expect(screen.getByRole('heading', { level: 2, name: '最新文章' })).toBeInTheDocument();
expect(screen.getByRole('region', { name: '文章流' })).toBeInTheDocument();
expect(screen.queryByText('Binflare 的工程与产品实践')).not.toBeInTheDocument();
```

在 `apps/web/src/App.test.tsx` 首页断言同步为：

```tsx
expect(screen.getByRole('heading', { name: '最新文章' })).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.test.tsx apps/web/src/App.test.tsx`
Expected: FAIL，提示找不到 heading `最新文章` 或 region `文章流`。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostListPage.tsx` 采用纯文章流结构：

```tsx
<section className="post-feed-header" aria-label="文章流标题区">
  <h2>最新文章</h2>
</section>
<section aria-label="文章流">
  <div className="post-list">...</div>
</section>
```

移除旧 hero 装饰节点（`home-hero`/`home-hero-decor`）。

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostListPage.test.tsx apps/web/src/App.test.tsx`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostListPage.test.tsx apps/web/src/pages/PostListPage.tsx apps/web/src/App.test.tsx
git commit -m "feat(web): switch homepage to pure article feed structure"
```

### Task 2: 卡片中密度信息层级（日期 + 预计阅读 + CTA）

**Files:**
- Modify: `apps/web/src/components/PostCard.test.tsx`
- Modify: `apps/web/src/components/PostCard.tsx`
- Modify: `apps/web/src/pages/PostListPage.tsx`

**Step 1: Write the failing test**

在 `apps/web/src/components/PostCard.test.tsx` 更新断言：

```tsx
expect(screen.getByText('2026-03-13')).toBeInTheDocument();
expect(screen.getByText('预计阅读 1 分钟')).toBeInTheDocument();
expect(screen.getByText('阅读全文')).toBeInTheDocument();
expect(screen.getAllByRole('link')).toHaveLength(1);
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/components/PostCard.test.tsx`
Expected: FAIL，缺少 `预计阅读` 或 `阅读全文`。

**Step 3: Write minimal implementation**

1) 在 `apps/web/src/pages/PostListPage.tsx` 新增阅读时长估算并传给卡片：

```tsx
const estimateReadingMinutes = (content: string): number => {
  const plain = content.replace(/\s+/g, '').trim();
  return Math.max(1, Math.round(plain.length / 450));
};

<PostCard
  ...
  readMinutes={estimateReadingMinutes(post.content)}
/>
```

2) 在 `apps/web/src/components/PostCard.tsx` 增加 `readMinutes` 属性与元信息区：

```tsx
<p className="post-card-meta">
  <span>{date}</span>
  <span aria-hidden="true">·</span>
  <span>预计阅读 {readMinutes} 分钟</span>
</p>
<p className="post-card-summary">{summary}</p>
<span className="post-card-read-more">阅读全文</span>
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/components/PostCard.test.tsx`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/components/PostCard.test.tsx apps/web/src/components/PostCard.tsx apps/web/src/pages/PostListPage.tsx
git commit -m "feat(web): enrich post card with read-time and cta hierarchy"
```

### Task 3: 详情页阅读进度条与回到顶部交互

**Files:**
- Modify: `apps/web/src/pages/PostDetailPage.test.tsx`
- Modify: `apps/web/src/pages/PostDetailPage.tsx`
- Modify: `apps/web/src/App.css`

**Step 1: Write the failing test**

在 `apps/web/src/pages/PostDetailPage.test.tsx` 新增断言：

```tsx
const progress = screen.getByRole('progressbar', { name: '阅读进度' });
expect(progress).toHaveAttribute('aria-valuemin', '0');
expect(progress).toHaveAttribute('aria-valuemax', '100');

const backTop = screen.getByRole('button', { name: '回到顶部' });
const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
fireEvent.click(backTop);
expect(scrollToSpy).toHaveBeenCalled();
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx`
Expected: FAIL，找不到 progressbar 或回顶按钮。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostDetailPage.tsx`：

- 增加 `readingProgress` 状态（0-100）
- 监听 `scroll` 计算正文进度
- 在详情页顶部渲染进度条：

```tsx
<div
  aria-label="阅读进度"
  aria-valuemax={100}
  aria-valuemin={0}
  aria-valuenow={readingProgress}
  className="post-reading-progress"
  role="progressbar"
/>
```

- 增加回顶按钮：

```tsx
<button className="post-back-to-top" onClick={scrollToTop} type="button">
  回到顶部
</button>
```

在 `apps/web/src/App.css` 增加进度条与回顶按钮样式。

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostDetailPage.test.tsx apps/web/src/pages/PostDetailPage.tsx apps/web/src/App.css
git commit -m "feat(web): add reading progress bar and back-to-top control"
```

### Task 4: 章节目录移动端折叠与可访问状态

**Files:**
- Modify: `apps/web/src/pages/PostDetailPage.test.tsx`
- Modify: `apps/web/src/pages/PostDetailPage.tsx`
- Modify: `apps/web/src/App.css`

**Step 1: Write the failing test**

在 `apps/web/src/pages/PostDetailPage.test.tsx` 新增移动端目录开关断言：

```tsx
const toggle = screen.getByRole('button', { name: '章节导航' });
expect(toggle).toHaveAttribute('aria-expanded', 'false');
fireEvent.click(toggle);
expect(toggle).toHaveAttribute('aria-expanded', 'true');
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx`
Expected: FAIL，缺少目录开关按钮或 `aria-expanded` 未变化。

**Step 3: Write minimal implementation**

在 `apps/web/src/pages/PostDetailPage.tsx`：

- 增加 `isOutlineOpen` 状态
- 增加目录开关按钮：

```tsx
<button
  aria-controls="post-outline-panel"
  aria-expanded={isOutlineOpen ? 'true' : 'false'}
  className="post-outline-toggle"
  onClick={() => setIsOutlineOpen((v) => !v)}
  type="button"
>
  章节导航
</button>
```

- `nav` 增加 `id="post-outline-panel"` 与 `data-open`
- 点击目录条目后自动关闭移动端目录

在 `apps/web/src/App.css` 增加移动端折叠样式（桌面端保持可见）。

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/pages/PostDetailPage.test.tsx`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/pages/PostDetailPage.test.tsx apps/web/src/pages/PostDetailPage.tsx apps/web/src/App.css
git commit -m "feat(web): add mobile-collapsible outline navigation"
```

### Task 5: 站点壳层精简为编辑风导航语义

**Files:**
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/components/SiteLayout.tsx`
- Modify: `apps/web/src/App.css`

**Step 1: Write the failing test**

在 `apps/web/src/App.test.tsx` 首页用例新增：

```tsx
expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument();
expect(screen.getByRole('link', { name: 'Binflare Blog' })).toHaveAttribute('href', '/');
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/App.test.tsx`
Expected: FAIL，缺少 `主导航` 或品牌首页链接。

**Step 3: Write minimal implementation**

在 `apps/web/src/components/SiteLayout.tsx`：

```tsx
<header className="site-header" role="banner">
  <h1 className="site-title">
    <Link className="site-brand-link" to="/">
      Binflare Blog
    </Link>
  </h1>
  <nav aria-label="主导航" className="site-nav">
    <Link className="site-link" to="/">文章</Link>
  </nav>
</header>
```

在 `apps/web/src/App.css` 补齐 `.site-brand-link`、`.site-nav` 样式。

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/App.test.tsx`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/App.test.tsx apps/web/src/components/SiteLayout.tsx apps/web/src/App.css
git commit -m "feat(web): refine site shell with semantic editorial navigation"
```

### Task 6: 重建浅色设计 Token 与可读性基线

**Files:**
- Create: `apps/web/src/test/style-tokens.test.ts`
- Modify: `apps/web/src/index.css`
- Modify: `apps/web/src/App.css`

**Step 1: Write the failing test**

新增 `apps/web/src/test/style-tokens.test.ts`：

```tsx
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('style tokens', () => {
  it('defines editorial light theme tokens and reduced motion support', () => {
    const indexCss = readFileSync('apps/web/src/index.css', 'utf8');
    expect(indexCss).toContain('--bg: #F5F7FA');
    expect(indexCss).toContain('--surface: #FFFFFF');
    expect(indexCss).toContain('--text: #0F172A');
    expect(indexCss).toContain('--accent: #1D4ED8');
    expect(indexCss).toContain('prefers-reduced-motion: reduce');

    const appCss = readFileSync('apps/web/src/App.css', 'utf8');
    expect(appCss).toContain('.post-detail-layout');
    expect(appCss).toContain('.post-reading-progress');
    expect(appCss).toContain('.post-outline-toggle');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/test/style-tokens.test.ts`
Expected: FAIL，token 或 class 片段不存在。

**Step 3: Write minimal implementation**

- 在 `apps/web/src/index.css` 替换为本次确定的浅色 token 与字体栈（Newsreader/Roboto/JetBrains Mono）
- 在 `apps/web/src/App.css` 重构页面样式：
  - 首页纯文章流布局
  - 中密度卡片视觉
  - 详情窄栏 + 目录侧栏
  - 进度条/回顶/移动端目录折叠
  - 响应式断点（375/768/1024/1440）

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/test/style-tokens.test.ts`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/src/test/style-tokens.test.ts apps/web/src/index.css apps/web/src/App.css
git commit -m "style(web): rebuild editorial light design tokens and layout system"
```

### Task 7: 全量回归验证与文档同步

**Files:**
- Modify: `apps/web/README.md`

**Step 1: Write the failing test**

无需新增失败测试，本任务是验证与文档同步；先执行验证命令收集结果。

**Step 2: Run verification suite**

Run:

```bash
pnpm lint
pnpm test
pnpm --filter web build
```

Expected: 全部 PASS。

**Step 3: Write minimal documentation update**

在 `apps/web/README.md` 更新“2026-03 重设计”段落为“2026-03-14 Editorial Precision 版”，补充：

- 首页纯文章流
- 详情页阅读进度与回顶
- 移动端目录折叠
- 浅色 token 系统

**Step 4: Re-run targeted check**

Run: `pnpm --filter web test`
Expected: PASS。

**Step 5: Commit**

```bash
git add apps/web/README.md
git commit -m "docs(web): update readme for editorial precision redesign"
```

## 交付前检查清单

- [ ] 所有交互元素可键盘访问，焦点可见
- [ ] 详情页目录、阅读进度、回顶在移动端与桌面端都可用
- [ ] 375px 无横向滚动
- [ ] `prefers-reduced-motion` 下无强制动画
- [ ] `pnpm lint && pnpm test && pnpm --filter web build` 全通过

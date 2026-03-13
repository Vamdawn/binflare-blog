# Binflare Blog Web App

`apps/web` 是 Binflare Blog 前端站点，基于 React + TypeScript + Vite。

## 运行与构建

```bash
# 开发模式
pnpm --filter web dev

# 构建（含内容校验、数据生成、sitemap 与前端打包）
pnpm --filter web build
```

## 内容来源

- Markdown 文章目录：`apps/web/content/posts`
- 运行时数据入口：`apps/web/src/lib/posts/source.ts`
- 列表页：`/`
- 详情页：`/posts/:slug`

## 2026-03 文章页重设计

本次重设计覆盖文章列表与详情页，核心方向为「新瑞士编辑风 + 单栏阅读 + 中密度列表」。

### 已落地内容

- 视觉系统重建：颜色 token、字体系统、页面基线、轻动效与 reduced-motion 处理
- 列表页结构升级：Hero 标题区、双列到单列响应式卡片、摘要两行截断
- 详情页结构升级：返回入口、元信息头部、可选 summary、单栏正文阅读容器
- Markdown 排版增强：标题层级、代码块、引用、正文节奏
- 可访问性与兼容性修正：焦点对比度提升、`color-mix` fallback、语义地标断言

### 关键样式文件

- 设计 token 与全局基线：`apps/web/src/index.css`
- 页面与组件视觉样式：`apps/web/src/App.css`
- 站点壳层结构：`apps/web/src/components/SiteLayout.tsx`

## 测试与回归

- 路由回归测试：`apps/web/src/App.test.tsx`
- 列表页结构测试：`apps/web/src/pages/PostListPage.test.tsx`
- 摘要回退黑盒测试：`apps/web/src/pages/PostListPage.excerpt.test.tsx`
- 详情页结构测试：`apps/web/src/pages/PostDetailPage.test.tsx`
- 卡片组件测试：`apps/web/src/components/PostCard.test.tsx`

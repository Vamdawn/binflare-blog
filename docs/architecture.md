# 技术架构

## 技术栈

- **开发语言**：TypeScript -- 统一前后端开发语言，实现端到端类型安全，减少低级错误并显著提升开发效率与可维护性。
- **包管理工具**：pnpm -- 通过硬链接与内容寻址存储大幅节省磁盘空间，并提供 Node.js 生态中最快的依赖安装速度。
- **代码仓库**：Monorepo (pnpm workspaces) -- 在单一仓库中管理前端、后端与共享库，实现类型共享、代码复用和统一版本管理。
- **前端框架**：React + Vite -- React 提供成熟的组件化生态，Vite 提供极快的开发启动与热更新体验。
- **样式与组件系统**：TailwindCSS + shadcn/ui -- Tailwind 提供高效的原子化 CSS 体系，shadcn/ui 提供可复制、可完全定制的无头组件实现设计系统。
- **客户端状态管理**：Zustand -- 极简且高性能的状态管理方案，避免 Redux 的模板代码并保持良好的可维护性。
- **服务端数据状态管理**：TanStack Query -- 专注于服务端状态缓存、请求重试、自动刷新与数据同步，是现代 React 应用的数据获取标准方案。
- **服务端框架**：Fastify -- 轻量且高性能的 Node.js Web 框架，插件体系完善，适合个人开发者构建高性能 API 服务。
- **数据校验与接口契约**：Zod -- 使用 TypeScript-first 的 schema 定义实现运行时数据校验，并可作为 API 类型契约来源。
- **核心数据库**：MySQL -- 生态成熟、稳定可靠，适合作为用户账户、订单、账单、会话等核心业务数据的持久化存储。
- **ORM 框架**：Prisma -- 提供优秀的 TypeScript 类型推导与数据库 schema 管理能力，大幅提升 CRUD 开发效率。
- **日志系统**：Pino -- Node.js 生态中性能最优秀的结构化日志库，适合高并发服务记录与分析日志。
- **代码质量工具**：Biome + Husky + Commitlint -- 使用 Rust 编写的 Biome 替代 ESLint/Prettier 实现极速代码检查与格式化，并通过 Git Hooks 保证提交规范。
- **测试体系**：Vitest + Supertest + Playwright -- Vitest 用于单元测试，Supertest 用于 API 集成测试，Playwright 用于端到端自动化测试。
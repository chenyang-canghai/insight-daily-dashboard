# 系统架构

## 目标

“知势”是一个静态优先、无密钥也可运行的个人研究与公考学习看板。页面部署到 GitHub Pages，公共日报保存在 GitHub 仓库，收藏、答题记录、错题和笔记保存在当前浏览器 IndexedDB。

## 总体结构

```text
公开来源 / 可选 LLM
        │
        ▼
Python 生成层（校验、去重、评分、降级）
        │
        ├── data/** JSON + Markdown（长期归档）
        └── public/data/**（静态站点可读取副本）
                         │
                         ▼
Next.js 16 静态导出 ── GitHub Pages
        │
        └── IndexedDB（收藏、错题、答题记录、设置；不提交仓库）
```

## 技术选择

- 前端：Next.js 16 App Router、React 19、TypeScript 严格模式、Tailwind CSS 4、Lucide、Recharts。
- 浏览器数据：`idb` 封装 IndexedDB。前端仅在 Client Component 的事件或 Effect 中访问浏览器 API。
- 搜索：小数据量使用构建时扁平索引与客户端检索；数据规模增长后切换 FlexSearch Document 索引。
- 数据生成：Python 3.11+、Pydantic 2、httpx、tenacity；行情分析可选 pandas 与 AKShare。
- 测试：Vitest、Testing Library、fake-indexeddb、Playwright、pytest、ruff。

## 静态导出边界

`next.config.ts` 使用 `output: "export"` 和 `trailingSlash: true`。所有动态路由必须实现 `generateStaticParams()`；不使用 Server Actions、Cookie、ISR、请求时 Route Handler 或默认图片优化。日报在构建前生成，页面构建时只读取仓库内数据。

## 数据新鲜度

每个模块同时显示 `generated_at`、数据日期、来源与任务状态。生成失败时保留最近一次有效数据，但状态改为 `stale` 或 `failed`，绝不把旧数据标记为今日数据。非交易日市场状态为 `closed`，最近交易日与当前日期分开显示。

## 移动端策略

- 360px 起可用；信息卡改为单列，表格变成横向滚动或语义列表。
- 顶部桌面导航在小屏收敛为底部主导航和可滚动模块标签。
- 点击目标不小于 44px；答案、筛选器和详情采用原生 `details` 或可访问按钮。
- 图表提供文本摘要，颜色之外同时使用正负号、箭头和标签。

## 可升级路径

第一版没有用户账户和服务端数据库。第二阶段可增加 Supabase Auth 与 RLS 做跨设备同步，但公开静态日报、私有本地数据和服务端密钥仍保持隔离。

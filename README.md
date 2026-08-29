# 知势 · 每日研判与公考学习看板

> Insight Daily Dashboard：面向数字经济专业研究生的新闻研判、A 股复盘和国考 / 江西省考学习系统。

生产部署默认运行在 **真实来源模式**：新闻只采集官方公开 RSS/列表页元数据，A 股优先 AKShare、失败时降级到 BaoStock，公考题为系统原创并逐题校验。`--demo` 仍可用于离线展示；任何模式均不构成投资建议。

## 1. 项目介绍

知势把每天分散的信息任务组织成一条闭环：采集与核验 → 去重与评分 → 通俗解释 → 逻辑链分析 → 收藏与搜索 → 行测练习 → 错题复习 → 学习统计。目标是每天用 20—40 分钟完成一轮高质量输入与练习。

## 2. 页面与功能

- 首页：一句话总览、任务新鲜度、重点新闻、市场温度、研究标的、学习摘要。
- 新闻：每天 8 条重点议题、3 条深度剖析、独立详情页、影响链与申论转化。
- A 股：6 个主要指数、市场广度、行业热点、完整研究观察结构与风险声明。
- 公考：每天 8 道行测题、答案折叠、计时、信心记录、错题本、间隔复习、申论积累。
- 收藏：IndexedDB 本地收藏、类型/标签/备注检索、置顶、掌握标记、JSON/Markdown 导出与 JSON 恢复。
- 搜索：跨新闻、深度、行业、研究标的、行测和申论的本地全文检索。
- 归档：`/daily/YYYY-MM-DD/` 综合日报；仓库同时保存 JSON 与 Markdown。
- 主题与移动端：跟随系统、浅色、深色；360px 起响应式布局和底部导航。

页面截图暂不提交二进制文件；运行 `make dev` 后可在桌面与手机视口直接预览。

## 3. 技术架构

- Next.js 16、React 19、TypeScript 严格模式、Tailwind CSS 4。
- Lucide Icons、Recharts、IndexedDB（`idb`）。
- Python 3.11+、uv、Pydantic、httpx、tenacity；可选 pandas、AKShare、BaoStock。
- Vitest、Testing Library、Playwright、pytest、ruff。
- 静态导出到 `out/`，部署到 GitHub Pages。

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 4. 目录结构

```text
data/                 JSON + Markdown 日报与清单
public/data/          静态站点读取副本
src/app/              Next.js 页面
src/components/       交互与展示组件
src/lib/              IndexedDB、搜索、数据访问
src/types/            TypeScript 数据契约
python/               Pydantic 模型与数据逻辑
scripts/              demo、新闻、市场、公考生成入口
prompts/              LLM 结构化提示词
tests/                Python、前端与 E2E 测试
.github/workflows/    定时生成、质量检查与 Pages 部署
docs/                 架构、来源、Schema、安全、部署文档
```

## 5. 本地运行

环境要求：Node.js 24+、pnpm 11、Python 3.11+、uv 0.12+。

```bash
make bootstrap
make generate-demo
make dev
```

Windows PowerShell 可使用：

```powershell
pnpm install --frozen-lockfile
uv sync --dev
pnpm generate:demo
pnpm dev
```

打开 `http://localhost:3000`。

### 桌面快捷方式与手机访问

桌面上的“知势看板”快捷方式会运行 `scripts/start-dashboard.ps1`，自动启动服务并打开浏览器。服务窗口中会同时显示手机访问地址，例如：

```text
http://192.168.1.20:3000/
```

手机和电脑必须连接同一 Wi-Fi，电脑上的服务窗口必须保持打开。首次启动若出现 Windows 防火墙询问，只允许“专用网络”即可；不要向公共网络开放。关闭服务窗口或按 `Ctrl+C` 即停止本地访问。

如果希望手机离开家中 Wi-Fi 后仍可访问，应按第 12 节部署到 GitHub Pages。GitHub Pages 方式不需要电脑持续开机。

## 6. 一键命令

```bash
make bootstrap       # 安装前端和 Python 依赖
make dev             # 本地开发
make generate-demo   # 重建 3 天 demo
make test            # 前端 + Python 测试
make build           # 静态导出
make check           # 全量质量检查
```

## 7. 环境变量

复制 `.env.example` 为 `.env.local`（前端）或在 Actions Variables 中配置。当前官方新闻来源、AKShare、BaoStock 和原创公考生成均不需要 API Key。

必需环境变量：**无**。

当前生产流水线不调用 LLM；摘要严格限定为标题与发布时间的来源索引。未来若接入自有 OpenAI-Compatible 服务，可再增加 `LLM_API_KEY` 等配置并完成单独审计。

可选行情：`TUSHARE_TOKEN`。AKShare / BaoStock 默认不需要 Key，但必须遵守上游条款和频率限制。

## 8. 数据源配置

来源登记位于 `data/source-registry/sources.yml`。重大事实优先政府、监管、央行、交易所、统计机构和公司公告，原则上再用一个独立来源交叉核验。社交媒体只能作为线索。

详见 [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) 与 [docs/OPEN_SOURCE_AUDIT.md](docs/OPEN_SOURCE_AUDIT.md)。

## 9. LLM 配置

`python/insight_dashboard/llm.py` 提供 OpenAI-Compatible Client。模型只处理已采集证据，使用 JSON Schema 结构化输出并经 Pydantic 校验；失败时最多修复两次，仍失败则拒绝发布。模型不得用训练记忆补“最新事实”。

运行时提示词位于 `prompts/`。

## 10. GitHub Actions

- `update-exam.yml`：北京时间每天 06:45（UTC 前一日 22:45）。
- `update-news.yml`：北京时间每天 07:15（UTC 前一日 23:15）。
- `update-market.yml`：A 股工作日北京时间 18:25（UTC 10:25），脚本再次校验交易日。
- `quality-check.yml`：前端、Python、数据与构建检查。
- `deploy-pages.yml`：构建并部署 GitHub Pages。

GitHub Actions 的 `schedule` 只接受 UTC，不使用无效的 `timezone` 字段。

## 11. 手动触发与指定日期

Actions 页面选择对应 workflow，点击 **Run workflow**，填写：

- `date`：`YYYY-MM-DD`；留空使用北京时间当日。
- `dry_run`：只采集和校验，不提交。
- `mode`：`live` 或 `demo`。

本地示例：

```bash
uv run python scripts/generate_daily_digest.py --date 2026-08-29 --module all --demo --dry-run
uv run python scripts/generate_daily_digest.py --date 2026-08-29 --module news --dry-run
```

## 12. GitHub Pages 部署

1. 创建 GitHub 仓库并推送本项目。
2. 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
3. 在 Actions 运行 `Deploy GitHub Pages`。
4. 工作流根据仓库名自动设置 `NEXT_PUBLIC_BASE_PATH`；用户/组织站点使用空路径。

详见 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)。

## 13. 收藏导入导出

收藏中心支持：

- JSON：收藏、答题和错题的完整备份；可在另一浏览器恢复。
- Markdown：当前筛选收藏的阅读型导出。
- 清空：两次确认；请先导出 JSON。

GitHub Pages 域名或仓库名变化会改变浏览器存储源，迁移前请导出备份。

## 14. 数据版权

- 不保存付费文章全文，只保存链接、必要元数据和原创摘要。
- 不抓取登录后商业题库，不复制来源不明真题、截图、范文和图片。
- demo 行测题为本项目原创。
- 软件许可证不自动授予上游行情和新闻数据的再分发权。

## 15. 投资风险声明

本项目只用于学习、研究和信息整理，不构成任何投资建议，不保证收益，不接入券商账户，不实现自动下单。免费行情可能延迟、缺失或冲突；使用者必须自行核验原始公告和数据。

## 16. 测试

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm validate:data
pnpm build
uv run ruff check python scripts tests/python
uv run pytest
pnpm exec playwright test
```

## 17. 常见问题

**没有 API Key 能用吗？** 可以。demo、历史归档、收藏、答题、错题和构建全部可用。

**为什么周末没有“今日行情”？** 系统保留最近交易日并显示休市，防止把旧数据伪装成当天数据。

**手机和电脑收藏为什么不同步？** 第一版默认本地隐私存储；使用 JSON 导出/恢复，或在第二阶段配置 Supabase。

**为什么没有复制大量真题？** 未核实许可证和题目版权前不再分发商业题库或汇编数据。

## 18. 故障排查

- 页面显示旧数据：检查 `task_statuses`、`generated_at` 和 Actions 日志；失败时页面应标记 stale/failed。
- Pages 资源 404：检查仓库 Pages Source、`NEXT_PUBLIC_BASE_PATH` 和 `trailingSlash`。
- IndexedDB 不可用：确认不是无痕限制或浏览器策略拦截；尝试导出备份后清理站点数据。
- AKShare 失败：检查上游接口变化和网络；系统应降级并保留诊断，不能伪造字段。
- `uv sync` 失败：确认 Python ≥ 3.11，删除损坏的虚拟环境后重新同步；不要删除工作区其他目录。

## 19. 开源许可证

本项目代码使用 MIT License。第三方依赖遵循各自许可证；指定参考项目的审计见 `docs/OPEN_SOURCE_AUDIT.md`。

## 20. 路线图

1. 对正文级事实增加第二独立来源交叉核验；当前只发布官方标题元数据索引。
2. 增加交易所原始行情/公告接口，进一步减少聚合源依赖。
3. 在获得明确许可后接入官方或已授权真题；当前只发布系统原创训练题。
4. 可选 Supabase 登录、RLS 与跨设备同步。
5. PWA 离线壳、安装图标和后台更新提示。

## 已知限制

- 新闻卡片不复制网页正文；自动摘要只确认来源、标题与发布日期，深度卡片是研读框架而非事实扩写。
- 免费行情接口可能延迟或临时不可用；降级数据缺失时不形成个股研究结论。
- 申论答题框内容尚未持久化，刷新页面会丢失；收藏、行测答题和错题已持久化。
- 本地搜索当前使用构建时扁平索引；数据量增长后启用 FlexSearch 持久索引。
- GitHub 定时任务可能延迟，页面以数据时间和任务状态为准，不能只看计划时间。

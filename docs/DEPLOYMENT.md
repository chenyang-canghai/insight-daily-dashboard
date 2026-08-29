# GitHub Pages 部署

## 两种手机访问方式

- 本地局域网：双击桌面“知势看板”快捷方式，手机与电脑连接同一 Wi-Fi，并访问服务窗口显示的地址。电脑必须保持开机并运行服务。
- GitHub Pages：完成下方部署后，手机可通过公网地址随时访问，不依赖本地电脑。收藏和错题仍保存在每台设备各自的 IndexedDB 中。
- PWA 安装：Android Chrome 使用安装提示；iPhone Safari 使用“分享”→“添加到主屏幕”。Service Worker 的作用域跟随仓库 Base Path。

## 首次部署

1. 推送仓库。
2. Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
3. 运行 `Deploy GitHub Pages`。
4. 等待 `deploy-pages` 环境给出 URL，在桌面和手机各验证一次。

## Base Path

项目站点通常为 `https://USER.github.io/REPO/`，工作流把 `NEXT_PUBLIC_BASE_PATH` 设置为 `/REPO`；名为 `USER.github.io` 的站点使用空路径。Next.js 静态导出使用 `trailingSlash: true`。

`manifest.webmanifest` 中的 `id`、`start_url`、`scope` 和快捷入口全部使用相对地址，避免把 PWA 安装到域名根路径。`sw.js` 从自身注册作用域推导仓库路径。GitHub Pages 无法为单个静态文件自定义响应头，因此注册时使用 `updateViaCache: none`，每次加载主动检查 Service Worker 更新。

## Secrets

- 当前必需 Secrets：**无**。不要创建空值或示例密钥。
- 生产 Variables：`NEXT_PUBLIC_SITE_MODE=live`、`NEWS_LOOKBACK_DAYS=7`、`MARKET_PROVIDER=akshare`。
- `GITHUB_TOKEN` 由 Actions 自动生成，只赋予工作流声明的 `contents: write` 与 `actions: write`；不需要手工保存为 Secret。
- 可选增强 Secrets：用户以后自行提供的 `LLM_API_KEY`、`TUSHARE_TOKEN`。当前工作流不读取它们。

数据任务通过内置 `GITHUB_TOKEN` 提交日报后，会显式触发 Pages 部署。Actions 使用自身 Token 的提交不会自动触发另一个 push 工作流，因此该显式触发不能删除。

不要把 Key 设置为 `NEXT_PUBLIC_*`。GitHub Pages 是公开静态文件，任何进入前端包的值都可被访客读取。

## 回滚

日报提交与页面部署分离。错误内容先提交更正和清单哈希，再重新部署；不要删除历史来掩盖错误。若页面构建失败，Pages 保留上一次成功部署，但首页数据状态必须在下次成功构建后显示实际新鲜度。

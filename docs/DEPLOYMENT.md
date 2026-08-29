# GitHub Pages 部署

## 两种手机访问方式

- 本地局域网：双击桌面“知势看板”快捷方式，手机与电脑连接同一 Wi-Fi，并访问服务窗口显示的地址。电脑必须保持开机并运行服务。
- GitHub Pages：完成下方部署后，手机可通过公网地址随时访问，不依赖本地电脑。收藏和错题仍保存在每台设备各自的 IndexedDB 中。

## 首次部署

1. 推送仓库。
2. Settings → Pages → Build and deployment → Source 选择 GitHub Actions。
3. 运行 `Deploy GitHub Pages`。
4. 等待 `deploy-pages` 环境给出 URL，在桌面和手机各验证一次。

## Base Path

项目站点通常为 `https://USER.github.io/REPO/`，工作流把 `NEXT_PUBLIC_BASE_PATH` 设置为 `/REPO`；名为 `USER.github.io` 的站点使用空路径。Next.js 静态导出使用 `trailingSlash: true`。

## Secrets

- 必需：无。
- 可选 Secrets：`LLM_API_KEY`、`TUSHARE_TOKEN`。
- 可选 Variables：`LLM_BASE_URL`、`LLM_MODEL`、`LLM_TIMEOUT`、`LLM_MAX_RETRIES`、`LLM_TEMPERATURE`。

不要把 Key 设置为 `NEXT_PUBLIC_*`。GitHub Pages 是公开静态文件，任何进入前端包的值都可被访客读取。

## 回滚

日报提交与页面部署分离。错误内容先提交更正和清单哈希，再重新部署；不要删除历史来掩盖错误。若页面构建失败，Pages 保留上一次成功部署，但首页数据状态必须在下次成功构建后显示实际新鲜度。

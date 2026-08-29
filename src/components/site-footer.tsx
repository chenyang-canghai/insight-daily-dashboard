import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>知势 · 每日研判与公考学习看板</strong>
        <p>公共日报保存在 GitHub；收藏、错题与笔记仅保存在当前浏览器。</p>
      </div>
      <div className="footer-links">
        <Link href="/settings/">数据与隐私</Link>
        <Link href="/archive/">历史归档</Link>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}

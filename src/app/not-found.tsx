import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>404</h1>
      <h2>这条内容还没有进入归档</h2>
      <p>静态站点只发布构建时已经生成的日报与详情页。</p>
      <Link className="primary-button" href="/">
        返回首页
      </Link>
    </div>
  );
}

import {
  Bookmark,
  ChartNoAxesCombined,
  House,
  Newspaper,
  NotebookPen,
} from "lucide-react";
import Link from "next/link";

const items = [
  ["首页", "/", House],
  ["研判", "/news/", Newspaper],
  ["市场", "/market/", ChartNoAxesCombined],
  ["学习", "/exam/", NotebookPen],
  ["收藏", "/favorites/", Bookmark],
] as const;

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="手机主导航">
      {items.map(([label, href, Icon]) => (
        <Link href={href} key={href}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

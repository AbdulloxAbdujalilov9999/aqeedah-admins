"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

const LINKS: [string, string][] = [
  ["/", "Savollar · Questions"],
  ["/new", "+ Savol-javob qo‘shish · Add Q&A"],
  ["/resources", "Manbalar · Resources"],
];

export default function TopBar({ name, manager, signOut }: { name: string; manager: boolean; signOut: () => Promise<void> }) {
  const path = usePathname();
  const on = (href: string) => (href === "/" ? path === "/" || path.startsWith("/q/") : path.startsWith(href));
  const links = manager ? [...LINKS, ["/team", "Jamoa · Team"] as [string, string]] : LINKS;
  return (
    <header className="top">
      <div className="top-in">
        <Link href="/" className="brand"><Logo />Aqeedah <small>admin</small></Link>
        <nav>{links.map(([href, label]) => <Link key={href} href={href} className={on(href) ? "on" : ""}>{label}</Link>)}</nav>
        <span className="spacer" />
        <span className="who">{name}</span>
        <form action={signOut}><button className="btn ghost sm" type="submit">Chiqish · Sign out</button></form>
      </div>
    </header>
  );
}

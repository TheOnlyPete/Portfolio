"use client";

import { usePathname } from "next/navigation";
import site from "../../../content/site.json";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <a className="site-header-name" href="/" aria-label="Home">{site.name}</a>
      <nav className="site-header-nav" aria-label="Primary navigation">
        {links.map(link => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return <a key={link.href} className={active ? "active" : undefined} href={link.href}>{link.label}</a>;
        })}
      </nav>
    </header>
  );
}

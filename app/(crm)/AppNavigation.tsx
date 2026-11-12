"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/crm";

type AppNavigationProps = { role: Role; variant: "desktop" | "mobile" };
type NavigationItem = { href: string; label: string; icon: "home" | "leads" | "users" | "options" };

function NavigationIcon({ name }: { name: NavigationItem["icon"] }) {
  if (name === "home") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
  }
  if (name === "leads") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>;
  }
  if (name === "users") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6m3-3h-6" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6" /></svg>;
}

export default function AppNavigation({ role, variant }: AppNavigationProps) {
  const pathname = usePathname();
  const items: NavigationItem[] = [
    { href: "/", label: "Beranda", icon: "home" },
    { href: "/leads", label: "Daftar Leads", icon: "leads" },
    ...(role === "owner" ? [{ href: "/admin/users", label: "Pengguna", icon: "users" as const }] : []),
    ...(role === "owner" || role === "admin" ? [{ href: "/admin/options", label: "Pilihan Form", icon: "options" as const }] : []),
  ];
  const isNewLead = pathname === "/leads/new" || pathname.endsWith("/edit");
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "desktop") {
    return (
      <nav className="main-nav" aria-label="Navigasi utama">
        <div className="nav-label">WORKSPACE</div>
        {items.slice(0, 2).map((item) => (
          <Link className={`nav-link${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
            <span className="nav-icon"><NavigationIcon name={item.icon} /></span>{item.label}
          </Link>
        ))}
        {(role === "owner" || role === "admin") && <div className="nav-label nav-spaced">PENGATURAN</div>}
        {items.slice(2).map((item) => (
          <Link className={`nav-link${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
            <span className="nav-icon"><NavigationIcon name={item.icon} /></span>{item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className={`mobile-bottom-nav mobile-bottom-nav-${role}`} aria-label="Navigasi utama">
      {items.map((item) => (
        <Link className={`mobile-nav-link mobile-nav-${item.icon}${isActive(item.href) ? " active" : ""}`} href={item.href} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
          <NavigationIcon name={item.icon} /><span>{item.label}</span>
        </Link>
      ))}
      {!isNewLead && <Link className="mobile-add-lead" href="/leads/new" aria-label="Tambah lead" title="Tambah lead"><span aria-hidden="true">＋</span></Link>}
    </nav>
  );
}

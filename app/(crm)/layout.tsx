import Link from "next/link";
import { signOut } from "@/app/actions";
import ConfirmAction from "@/app/components/ConfirmAction";
import { getViewer } from "@/lib/auth";
import { roleLabel } from "@/lib/crm";

export default async function CrmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">P</span>
          <span>PROLINTAS<small>LEAD MANAGEMENT</small></span>
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav">
          <Link href="/" className="nav-link"><span className="nav-icon">⌂</span>Dashboard</Link>
          <Link href="/leads" className="nav-link"><span className="nav-icon">▤</span>Daftar Leads</Link>
          {(viewer.role === "owner" || viewer.role === "admin") && (
            <>
              <div className="nav-label nav-spaced">PENGATURAN</div>
              {viewer.role === "owner" && <Link href="/admin/users" className="nav-link"><span className="nav-icon">♙</span>Pengguna</Link>}
              <Link href="/admin/options" className="nav-link"><span className="nav-icon">☷</span>Pilihan Form</Link>
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">{(viewer.full_name || viewer.email).slice(0, 1).toUpperCase()}</div>
          <div className="user-meta"><strong>{viewer.full_name || viewer.email}</strong><span>{roleLabel(viewer.role)}</span></div>
          <ConfirmAction
            action={signOut}
            triggerLabel="↪"
            triggerClassName="signout"
            triggerAriaLabel="Keluar"
            triggerTitle="Keluar"
            title="Keluar dari akun?"
            description="Anda perlu masuk kembali untuk mengakses workspace."
            confirmLabel="Ya, keluar"
          />
        </div>
      </aside>
      <div className="mobile-top">
        <Link className="brand" href="/"><span className="brand-mark">P</span><span>PROLINTAS</span></Link>
        <ConfirmAction
          action={signOut}
          triggerLabel="↪"
          triggerClassName="signout"
          triggerAriaLabel="Keluar"
          triggerTitle="Keluar"
          title="Keluar dari akun?"
          description="Anda perlu masuk kembali untuk mengakses workspace."
          confirmLabel="Ya, keluar"
        />
      </div>
      <main className="main-content">{children}</main>
    </div>
  );
}

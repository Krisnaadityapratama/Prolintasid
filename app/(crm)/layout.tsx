import Link from "next/link";
import { signOut } from "@/app/actions";
import ConfirmAction from "@/app/components/ConfirmAction";
import InstallPwaButton from "@/app/components/InstallPwaButton";
import AppNavigation from "./AppNavigation";
import { getViewer } from "@/lib/auth";
import { roleLabel } from "@/lib/crm";

export default async function CrmLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <img className="brand-logo" src="/img/Prolintas - Logo Biru.png" alt="PROLINTAS" />
        </Link>
        <AppNavigation role={viewer.role} variant="desktop" />
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
        <Link className="brand" href="/"><img className="brand-logo" src="/img/Prolintas - Logo Biru.png" alt="PROLINTAS" /></Link>
        <div className="mobile-header-actions">
          <InstallPwaButton />
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
      </div>
      <main className="main-content">{children}</main>
      <AppNavigation role={viewer.role} variant="mobile" />
    </div>
  );
}

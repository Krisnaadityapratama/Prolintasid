import Link from "next/link";
import { redirect } from "next/navigation";
import { createTeamUser, deleteTeamUser, setTeamUserActive } from "@/app/actions";
import ConfirmAction from "@/app/components/ConfirmAction";
import CreateUserButton from "./CreateUserButton";
import SetUserStatusButton from "./SetUserStatusButton";
import { getViewer } from "@/lib/auth";
import { roleLabel, type Profile } from "@/lib/crm";
import { createClient } from "@/lib/supabase/server";

type UsersPageProps = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const [viewer, params, supabase] = await Promise.all([getViewer(), searchParams, createClient()]);
  if (viewer.role !== "owner") redirect("/");
  const { data, error: usersError } = await supabase.from("profiles").select("id,email,full_name,role,is_active,created_at").order("created_at");
  if (usersError) throw new Error(`Gagal memuat pengguna: ${usersError.message}`);
  const users = (data ?? []) as (Profile & { created_at: string })[];

  return (
    <>
      <header className="page-header"><div><div className="eyebrow">ADMINISTRASI</div><h1>Pengguna</h1><p>Kelola akses Admin dan Sales ke workspace leads.</p></div><Link className="button secondary" href="/">← Dashboard</Link></header>
      {params.error && <div className="alert error">{params.error}</div>}
      {params.notice && <div className="alert success">{params.notice}</div>}
      <div className="users-layout">
        <section className="panel users-panel"><div className="panel-heading"><div><div className="eyebrow">WORKSPACE</div><h2>Anggota tim <span className="subtle-count">{users.length}</span></h2></div></div>
          <div className="team-list">{users.map((user) => <div className="team-row" key={user.id}>
            <span className="user-avatar">{(user.full_name || user.email).slice(0, 1).toUpperCase()}</span>
            <span className="team-name"><strong>{user.full_name || "Nama belum diatur"}</strong><small>{user.email}</small></span>
            <span className={`role-badge role-${user.role}`}>{roleLabel(user.role)}</span>
            <span className={`account-state ${user.is_active ? "account-active" : "account-frozen"}`}>{user.is_active ? "Aktif" : "Dibekukan"}</span>
            {user.role !== "owner" && <>
              <Link className="button secondary user-action" href={`/admin/users/${user.id}/edit`}>Ubah</Link>
              <form action={setTeamUserActive}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="is_active" value={String(!user.is_active)} />
                <SetUserStatusButton active={user.is_active} />
              </form>
              <ConfirmAction
                action={deleteTeamUser}
                fields={{ id: user.id }}
                triggerLabel="Hapus"
                triggerClassName="button danger user-action"
                title="Hapus akun pengguna?"
                description={`Akun ${user.full_name || user.email} akan dihapus permanen. Akun dengan leads yang belum dipindahkan tidak dapat dihapus.`}
                confirmLabel="Ya, hapus akun"
              />
            </>}
          </div>)}</div>
          <div className="permission-note"><span>i</span><p>Seluruh anggota dapat melihat semua leads. Hanya pembuat lead yang dapat mengubah atau menghapusnya.</p></div>
        </section>
        <aside className="panel invite-panel"><div className="eyebrow">BUAT AKUN LANGSUNG</div><h2>Tambah anggota</h2><p>Akun langsung aktif setelah dibuat. Sampaikan email dan kata sandi kepada anggota secara aman.</p>
          <form action={createTeamUser} className="invite-form">
            <label className="field">Nama lengkap<input name="full_name" required placeholder="Nama anggota" /></label>
            <label className="field">Username / email Gmail<input name="email" type="email" autoComplete="off" required placeholder="nama@gmail.com" /></label>
            <label className="field">Role<select name="role" defaultValue="sales"><option value="sales">Sales</option><option value="admin">Admin</option></select></label>
            <label className="field">Kata sandi awal<input name="password" type="password" minLength={8} autoComplete="new-password" required placeholder="Minimal 8 karakter" /></label>
            <CreateUserButton />
          </form>
          <small className="invite-foot">Kata sandi tidak disimpan di data profil. Bagikan kredensial akun kepada anggota secara aman.</small>
        </aside>
      </div>
    </>
  );
}

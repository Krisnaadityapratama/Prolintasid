import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateTeamUser } from "@/app/actions";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const [{ id }, { error }, viewer] = await Promise.all([params, searchParams, getViewer()]);
  if (viewer.role !== "owner") redirect("/");

  const admin = createAdminClient();
  const { data: user, error: userError } = await admin
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", id)
    .maybeSingle();
  if (userError) throw new Error(`Gagal memuat akun: ${userError.message}`);
  if (!user || user.role === "owner") notFound();

  return (
    <>
      <header className="page-header">
        <div><div className="eyebrow">ADMINISTRASI</div><h1>Ubah pengguna</h1><p>Perbarui nama atau atur kata sandi baru untuk akun ini.</p></div>
        <Link className="button secondary" href="/admin/users">← Kembali</Link>
      </header>
      {error && <div className="alert error">{error}</div>}
      <section className="panel edit-user-panel">
        <form action={updateTeamUser} className="invite-form">
          <input type="hidden" name="id" value={user.id} />
          <label className="field">Email / username<input value={user.email} readOnly /></label>
          <label className="field">Role<input value={user.role === "admin" ? "Admin" : "Sales"} readOnly /></label>
          <label className="field">Nama lengkap<input name="full_name" required maxLength={120} defaultValue={user.full_name} /></label>
          <label className="field">Kata sandi baru <span className="optional-label">(kosongkan jika tidak diubah)</span><input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="Minimal 8 karakter" /></label>
          <div className="edit-user-footer"><span>Kata sandi tidak disimpan di data profil.</span><button className="button primary" type="submit">Simpan perubahan <span>→</span></button></div>
        </form>
      </section>
    </>
  );
}

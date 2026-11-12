import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="login-page">
      <section className="login-card">
        <Link className="brand login-brand" href="/">
          <img className="brand-logo" src="/img/Prolintas - Logo Biru.png" alt="PROLINTAS" />
        </Link>
        <div className="eyebrow">RUANG KERJA TIM</div>
        <h1>Selamat datang<br />kembali.</h1>
        <p className="login-copy">Masuk untuk melihat dan mengelola sales pipeline tim Anda.</p>
        <LoginForm />
        <div className="login-foot">Gunakan email dan kata sandi akun CRM yang diberikan Admin Utama.</div>
      </section>
      <aside className="login-aside">
        <div className="aside-kicker">CARGO SALES · CRM</div>
        <div className="aside-title">Satu pipeline.<br /><em>Seluruh tim.</em></div>
        <p>Pantau peluang, tindak lanjut, dan perkembangan setiap lead dalam satu ruang kerja bersama.</p>
        <div className="aside-bottom">PROLINTAS <span>•</span> LEAD OPERATIONS</div>
      </aside>
    </main>
  );
}

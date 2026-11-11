"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions";

const initialState: { error: string | null } = { error: null };

export default function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <>
      {state.error && (
        <div className="login-notification" role="alert" aria-live="assertive">
          <span className="notification-mark">!</span>
          <span>{state.error}</span>
        </div>
      )}
      <form action={action} className="login-form">
        <label htmlFor="email">Email kerja</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="nama@perusahaan.com" required />
        <label htmlFor="password">Kata sandi</label>
        <input className="password-input" id="password" name="password" type="password" autoComplete="current-password" placeholder="Masukkan kata sandi akun CRM" required />
        <button className="button primary full" type="submit" disabled={pending}>
          {pending ? "Memeriksa..." : <>Masuk ke dashboard <span>→</span></>}
        </button>
      </form>
    </>
  );
}

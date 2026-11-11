"use client";

import { useFormStatus } from "react-dom";

export default function CreateUserButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button primary full create-user-button" type="submit" disabled={pending} aria-live="polite">
      {pending ? <><span className="loading-spinner" aria-hidden="true" /> Membuat akun...</> : <>Buat akun <span>→</span></>}
    </button>
  );
}

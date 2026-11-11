"use client";

import { useFormStatus } from "react-dom";

type SetUserStatusButtonProps = { active: boolean };

export default function SetUserStatusButton({ active }: SetUserStatusButtonProps) {
  const { pending } = useFormStatus();
  const label = active ? "Bekukan" : "Aktifkan";

  return (
    <button
      className={`button user-action ${active ? "button-freeze" : "button-unfreeze"}`}
      type="submit"
      disabled={pending}
      aria-live="polite"
    >
      {pending ? <><span className="loading-spinner" aria-hidden="true" /> Memproses...</> : label}
    </button>
  );
}

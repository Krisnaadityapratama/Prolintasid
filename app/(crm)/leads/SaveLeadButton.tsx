"use client";

import { useFormStatus } from "react-dom";

type SaveLeadButtonProps = { label: string };

export default function SaveLeadButton({ label }: SaveLeadButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button className="button primary" type="submit" disabled={pending}>
      {pending && <span className="loading-spinner" aria-hidden="true" />}
      {pending ? "Menyimpan..." : label} <span>→</span>
    </button>
  );
}

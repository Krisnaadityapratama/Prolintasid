"use client";

import { useId, useRef } from "react";

type ConfirmActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  triggerLabel: string;
  triggerClassName: string;
  triggerAriaLabel?: string;
  triggerTitle?: string;
  title: string;
  description: string;
  confirmLabel: string;
};

export default function ConfirmAction({
  action,
  fields,
  triggerLabel,
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
  title,
  description,
  confirmLabel,
}: ConfirmActionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const actionFormRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <>
      <button
        className={triggerClassName}
        type="button"
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <form action={action} ref={actionFormRef} hidden>
        {Object.entries(fields ?? {}).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <dialog className="confirm-dialog" ref={dialogRef} role="alertdialog" aria-labelledby={titleId} aria-describedby={descriptionId}>
        <div className="confirm-icon">!</div>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="confirm-actions">
          <button className="button secondary" type="button" onClick={() => dialogRef.current?.close()}>
            Batal
          </button>
          <button
            className="button confirm-danger"
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              actionFormRef.current?.requestSubmit();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}

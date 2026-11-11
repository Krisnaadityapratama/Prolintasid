import Link from "next/link";
import { redirect } from "next/navigation";
import { addLeadOption, deleteLeadOption } from "@/app/actions";
import ConfirmAction from "@/app/components/ConfirmAction";
import { getViewer } from "@/lib/auth";
import { OPTION_GROUPS } from "@/lib/crm";
import { getLeadOptionRows } from "@/lib/leads";

type OptionsPageProps = { searchParams: Promise<{ notice?: string; error?: string }> };

export default async function OptionsPage({ searchParams }: OptionsPageProps) {
  const [viewer, params, rows] = await Promise.all([getViewer(), searchParams, getLeadOptionRows()]);
  if (viewer.role !== "owner" && viewer.role !== "admin") redirect("/");

  const byCategory = new Map<string, typeof rows>();
  for (const row of rows) {
    const group = byCategory.get(row.category) ?? [];
    group.push(row);
    byCategory.set(row.category, group);
  }

  return (
    <>
      <header className="page-header">
        <div><div className="eyebrow">PENGATURAN FORM LEAD</div><h1>Pilihan form</h1><p>Tambahkan pilihan untuk dipakai bersama pada form lead tim.</p></div>
        <Link className="button secondary" href="/">← Dashboard</Link>
      </header>
      {params.error && <div className="alert error">{params.error}</div>}
      {params.notice && <div className="alert success">{params.notice}</div>}
      <div className="options-intro"><span className="options-info">i</span><p>Perubahan langsung tersimpan di Supabase dan tersedia bagi semua anggota. Tahap pipeline tetap sebagai pilihan sistem agar alur laporan tetap konsisten.</p></div>
      <div className="option-groups">
        {OPTION_GROUPS.map((category) => {
          const items = byCategory.get(category.key) ?? [];
          return (
            <section className="panel option-group" key={category.key}>
              <div className="option-group-head">
                <div><div className="eyebrow">PILIHAN FORM</div><h2>{category.label}<span className="subtle-count">{items.length}</span></h2></div>
              </div>
              <div className="option-chips">
                {items.map((item) => (
                  <div className="option-chip-item" key={item.id}>
                    <span className="option-chip">{item.label}</span>
                    <ConfirmAction
                      action={deleteLeadOption}
                      fields={{ id: item.id }}
                      triggerLabel="×"
                      triggerClassName="option-delete"
                      triggerAriaLabel={`Hapus pilihan ${item.label}`}
                      triggerTitle={`Hapus ${item.label}`}
                      title="Hapus pilihan ini?"
                      description={`Pilihan “${item.label}” tidak akan muncul lagi pada form lead baru. Data lead lama tetap tersimpan.`}
                      confirmLabel="Ya, hapus pilihan"
                    />
                  </div>
                ))}
                {!items.length && <span className="option-empty">Belum ada pilihan. Tambahkan pilihan pertama.</span>}
              </div>
              <form action={addLeadOption} className="option-add-form">
                <input type="hidden" name="category" value={category.key} />
                <label className="sr-only" htmlFor={`option-${category.key}`}>Pilihan baru untuk {category.label}</label>
                <input id={`option-${category.key}`} name="label" maxLength={80} required placeholder={`Tambah pilihan ${category.label.toLowerCase()}...`} />
                <button className="button primary" type="submit"><span>＋</span> Tambah</button>
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}

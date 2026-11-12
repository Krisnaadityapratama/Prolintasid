import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteLead } from "@/app/actions";
import ConfirmAction from "@/app/components/ConfirmAction";
import { getViewer } from "@/lib/auth";
import { formatCurrency, stageLabel } from "@/lib/crm";
import { getLead } from "@/lib/leads";

type LeadDetailProps = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function LeadDetailPage({ params, searchParams }: LeadDetailProps) {
  const [{ id }, { error }, viewer] = await Promise.all([params, searchParams, getViewer()]);
  const lead = await getLead(id);
  if (!lead) notFound();
  const canEdit = lead.created_by === viewer.id;
  const details = [
    ["PIC", lead.pic], ["Jabatan", lead.job_title], ["Telepon", lead.phone], ["Email", lead.email],
    ["Industri", lead.industry], ["Komoditas", lead.commodity], ["Moda", lead.modes.join(", ")],
    ["Layanan", lead.services.join(", ")], ["Asal", lead.origin], ["Tujuan", lead.destination],
    ["Volume", lead.volume ? `${lead.volume} ${lead.unit ?? ""}` : null], ["Incoterm", lead.incoterm],
    ["Frekuensi", lead.frequency], ["Sumber", lead.source], ["Prospek", lead.temperature],
    ["Follow-up", lead.follow_up ? new Date(`${lead.follow_up}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : null],
    ["Alasan gagal", lead.lost_reason],
    ["Catatan", lead.notes],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <>
      <div className="detail-back"><Link className="text-link" href="/leads">← Kembali ke Daftar Leads</Link></div>
      {error && <div className="alert error">{error}</div>}
      <section className="panel detail-hero">
        <div className="detail-company-mark">{lead.company.slice(0, 1).toUpperCase()}</div>
        <div className="detail-title"><div className="eyebrow">{lead.industry || "PELUANG PENJUALAN"}</div><h1>{lead.company}</h1><div className="detail-subtitle">{lead.pic || "Kontak belum diisi"}{lead.job_title ? ` · ${lead.job_title}` : ""}</div></div>
        <div className="detail-actions">{canEdit ? <Link className="button secondary" href={`/leads/${lead.id}/edit`}>Ubah lead</Link> : <span className="readonly-note">Hanya pembuat yang dapat mengubah</span>}</div>
      </section>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel detail-panel"><div className="panel-heading"><div><div className="eyebrow">INFORMASI</div><h2>Detail lead</h2></div><span className={`status-pill status-${lead.stage}`}>{stageLabel(lead.stage)}</span></div>
            <div className="detail-fields">{details.map(([label, value]) => <div className="detail-field" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          </section>
        </div>
        <aside className="detail-side">
          <section className="panel value-panel"><div className="eyebrow">NILAI ESTIMASI</div><strong>{formatCurrency(lead.estimated_value)}</strong><small>{lead.frequency || "Nilai peluang"}</small></section>
          <section className="panel owner-panel"><div className="eyebrow">DIBUAT OLEH</div><div className="creator-large"><span className="user-avatar">{(lead.creator?.full_name || lead.creator?.email || "?").slice(0, 1).toUpperCase()}</span><div><strong>{lead.creator?.full_name || "Pengguna"}</strong><small>{lead.creator?.email}</small></div></div><small className="created-date">Dibuat {new Date(lead.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</small></section>
          {canEdit && <section className="panel danger-panel"><div><strong>Hapus lead</strong><small>Penghapusan tidak dapat dibatalkan.</small></div><ConfirmAction
            action={deleteLead}
            fields={{ id: lead.id }}
            triggerLabel="Hapus"
            triggerClassName="button danger"
            title="Hapus lead ini?"
            description={`Lead ${lead.company} akan dihapus permanen dan tidak dapat dipulihkan.`}
            confirmLabel="Ya, hapus lead"
          /></section>}
        </aside>
      </div>
    </>
  );
}

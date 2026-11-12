import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { formatCurrency, isActive, STAGES, stageLabel } from "@/lib/crm";

type LeadsPageProps = { searchParams: Promise<{ q?: string; stage?: string; notice?: string; error?: string }> };

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const [leads, params] = await Promise.all([getLeads(), searchParams]);
  const query = params.q?.trim().toLowerCase() ?? "";
  const selectedStage = params.stage ?? "all";
  const filtered = leads.filter((lead) => {
    const matchesStage = selectedStage === "all" ||
      (selectedStage === "aktif" ? isActive(lead.stage) : lead.stage === selectedStage);
    const searchable = [lead.company, lead.pic, lead.commodity, lead.origin, lead.destination, lead.notes, lead.creator?.full_name]
      .filter(Boolean).join(" ").toLowerCase();
    return matchesStage && (!query || searchable.includes(query));
  });

  return (
    <>
      <header className="page-header">
        <div><div className="eyebrow">SALES PIPELINE</div><h1>Daftar Leads</h1><p>Semua peluang tim, terlihat oleh seluruh pengguna.</p></div>
        <Link className="button primary" href="/leads/new"><span>＋</span> Tambah lead</Link>
      </header>
      {params.error && <div className="alert error">{params.error}</div>}
      {params.notice && <div className="alert success">{params.notice}</div>}
      <section className="panel leads-panel">
        <form className="filter-bar" action="/leads">
          <label className="search-field"><span>⌕</span><input type="search" name="q" defaultValue={params.q} placeholder="Cari perusahaan, PIC, komoditas, rute..." /></label>
          <select aria-label="Filter tahap" name="stage" defaultValue={selectedStage}>
            <option value="all">Semua tahap</option><option value="aktif">Lead aktif</option>
            {STAGES.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}
          </select>
          <button className="button secondary" type="submit">Terapkan</button>
        </form>
        <div className="list-count"><strong>{filtered.length}</strong> lead ditampilkan <span>·</span> {leads.length} total</div>
        {filtered.length ? <div className="table-wrap"><table className="leads-table"><thead><tr><th>Perusahaan / rute</th><th>Kontak</th><th>Tahap</th><th>Follow-up</th><th>Pembuat</th><th>Nilai estimasi</th></tr></thead><tbody>
          {filtered.map((lead) => <tr key={lead.id}>
            <td><Link className="company-cell" href={`/leads/${lead.id}`}>{lead.company}<small>{lead.origin || "—"} {lead.origin && lead.destination ? "→" : ""} {lead.destination || ""}</small></Link></td>
            <td>{lead.pic || "—"}<small className="table-sub">{lead.phone || lead.email || "Kontak belum diisi"}</small></td>
            <td><span className={`status-pill status-${lead.stage}`}>{stageLabel(lead.stage)}</span></td>
            <td>{lead.follow_up ? new Date(`${lead.follow_up}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
            <td><span className="creator-cell"><span className="mini-avatar">{(lead.creator?.full_name || lead.creator?.email || "?").slice(0, 1).toUpperCase()}</span>{lead.creator?.full_name || lead.creator?.email || "—"}</span></td>
            <td>{formatCurrency(lead.estimated_value)}</td>
          </tr>)}
        </tbody></table></div> : <div className="empty-state"><strong>{leads.length ? "Tidak ada lead yang cocok" : "Belum ada lead"}</strong><small>{leads.length ? "Coba ubah kata kunci atau filter tahap." : "Tambahkan peluang pertama Anda untuk mulai mengisi pipeline."}</small>{!leads.length && <Link className="button secondary" href="/leads/new">Tambah lead</Link>}</div>}
      </section>
    </>
  );
}

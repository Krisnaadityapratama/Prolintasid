import Link from "next/link";
import { getLeads } from "@/lib/leads";
import { formatCurrency, isActive, stageLabel } from "@/lib/crm";

function daysUntil(value: string) {
  const date = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const leads = await getLeads();
  const active = leads.filter((lead) => isActive(lead.stage));
  const won = leads.filter((lead) => lead.stage === "won");
  const lost = leads.filter((lead) => lead.stage === "lost");
  const closed = won.length + lost.length;
  const overdue = active.filter((lead) => lead.follow_up && daysUntil(lead.follow_up) < 0);
  const dueToday = active.filter((lead) => lead.follow_up && daysUntil(lead.follow_up) === 0);
  const pipeline = active.reduce((sum, lead) => sum + Number(lead.estimated_value || 0), 0);
  const upcoming = active
    .filter((lead) => lead.follow_up)
    .sort((a, b) => (a.follow_up ?? "").localeCompare(b.follow_up ?? ""))
    .slice(0, 5);
  const stageCounts = ["baru", "hubungi", "kualifikasi", "penawaran", "nego", "won", "lost"]
    .map((stage) => ({ stage, count: leads.filter((lead) => lead.stage === stage).length }));

  return (
    <>
      <header className="page-header">
        <div><div className="eyebrow">RINGKASAN PENJUALAN</div><h1>Dashboard</h1><p>Pantau pipeline dan tindak lanjut tim Anda.</p></div>
        <Link className="button primary" href="/leads/new"><span>＋</span> Tambah lead</Link>
      </header>
      <section className="metric-grid">
        <article className="metric-card"><div className="metric-label">Lead aktif <span className="metric-icon blue">↗</span></div><strong>{active.length}</strong><small>dari {leads.length} total leads</small></article>
        <article className="metric-card"><div className="metric-label">Potensi pipeline <span className="metric-icon violet">◇</span></div><strong className="currency">{formatCurrency(pipeline)}</strong><small>nilai dari lead aktif</small></article>
        <article className="metric-card"><div className="metric-label">Win rate <span className="metric-icon green">✓</span></div><strong>{closed ? `${Math.round(won.length / closed * 100)}%` : "—"}</strong><small>{won.length} deal · {lost.length} gagal</small></article>
        <article className="metric-card"><div className="metric-label">Perlu follow-up <span className="metric-icon orange">◷</span></div><strong>{overdue.length + dueToday.length}</strong><small>{overdue.length} terlambat · {dueToday.length} hari ini</small></article>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">JAGA MOMENTUM</div><h2>Follow-up berikutnya</h2></div><Link className="text-link" href="/leads">Lihat semua <span>→</span></Link></div>
          {upcoming.length ? <div className="follow-list">{upcoming.map((lead) => {
            const days = daysUntil(lead.follow_up!);
            return <Link className="follow-row" href={`/leads/${lead.id}`} key={lead.id}>
              <span className="company-avatar">{lead.company.slice(0, 1).toUpperCase()}</span>
              <span className="follow-main"><strong>{lead.company}</strong><small>{lead.creator?.full_name || lead.creator?.email || "Tim"}{lead.origin && lead.destination ? ` · ${lead.origin} → ${lead.destination}` : ""}</small></span>
              <span className={`due-tag ${days < 0 ? "overdue" : days === 0 ? "today" : ""}`}>{days < 0 ? `${-days} hari lewat` : days === 0 ? "Hari ini" : days === 1 ? "Besok" : new Date(`${lead.follow_up}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
            </Link>;
          })}</div> : <div className="empty-state"><span>◷</span><strong>Belum ada jadwal follow-up</strong><small>Tambahkan tanggal follow-up pada lead untuk melihat pengingat di sini.</small></div>}
        </section>
        <section className="panel pipeline-panel">
          <div className="panel-heading"><div><div className="eyebrow">PROGRES PENJUALAN</div><h2>Pipeline per tahap</h2></div><Link className="icon-link" href="/leads" aria-label="Buka leads">↗</Link></div>
          <div className="stage-list">{stageCounts.map(({ stage, count }) => {
            const percent = leads.length ? count / leads.length * 100 : 0;
            return <div className="stage-row" key={stage}><div><span>{stageLabel(stage)}</span><b>{count}</b></div><div className="progress-track"><span className={`stage-progress s-${stage}`} style={{ width: `${percent}%` }} /></div></div>;
          })}</div>
        </section>
      </div>
      <section className="panel recent-panel">
        <div className="panel-heading"><div><div className="eyebrow">AKTIVITAS TERBARU</div><h2>Leads terbaru</h2></div><Link className="text-link" href="/leads">Buka daftar <span>→</span></Link></div>
        {leads.length ? <div className="table-wrap"><table><thead><tr><th>Perusahaan</th><th>PIC</th><th>Tahap</th><th>Pembuat</th><th>Nilai estimasi</th></tr></thead><tbody>
          {leads.slice(0, 5).map((lead) => <tr key={lead.id}><td><Link className="company-cell" href={`/leads/${lead.id}`}>{lead.company}<small>{lead.industry || "Industri belum diisi"}</small></Link></td><td>{lead.pic || "—"}</td><td><span className={`status-pill status-${lead.stage}`}>{stageLabel(lead.stage)}</span></td><td>{lead.creator?.full_name || lead.creator?.email || "—"}</td><td>{formatCurrency(lead.estimated_value)}</td></tr>)}
        </tbody></table></div> : <div className="empty-state"><strong>Belum ada lead</strong><small>Mulai dengan menambahkan peluang penjualan pertama.</small><Link className="button secondary" href="/leads/new">Tambah lead</Link></div>}
      </section>
    </>
  );
}

import Link from "next/link";
import { saveLead } from "@/app/actions";
import type { Lead, LeadOptions } from "@/lib/crm";
import { STAGES } from "@/lib/crm";
import SaveLeadButton from "./SaveLeadButton";

type LeadFormProps = { lead?: Lead; error?: string; options: LeadOptions };

function options(items: readonly string[]) {
  return items.map((item) => <option value={item} key={item}>{item}</option>);
}

function MultiSelect({ name, label, values, selected = [] }: { name: string; label: string; values: readonly string[]; selected?: string[] }) {
  return <fieldset className="field"><legend>{label}</legend><div className="choice-grid">
    {values.map((value) => <label className="choice" key={value}><input type="checkbox" name={name} value={value} defaultChecked={selected.includes(value)} /><span>{value}</span></label>)}
  </div></fieldset>;
}

export default function LeadForm({ lead, error, options: items }: LeadFormProps) {
  return (
    <>
      <header className="page-header form-header"><div><div className="eyebrow">DATA PELUANG</div><h1>{lead ? "Ubah lead" : "Tambah lead"}</h1><p>Lengkapi informasi perusahaan, kebutuhan, dan tindak lanjut.</p></div><Link className="button secondary" href={lead ? `/leads/${lead.id}` : "/leads"}>Batal</Link></header>
      {error && <div className="alert error">{error}</div>}
      <form action={saveLead} className="lead-form">
        {lead && <input type="hidden" name="id" value={lead.id} />}
        <section className="form-section"><div className="form-section-title"><span>01</span><div><h2>Informasi perusahaan</h2><p>Data perusahaan dan kontak utama.</p></div></div>
          <div className="form-fields">
            <label className="field wide">Nama perusahaan <b>*</b><input name="company" required defaultValue={lead?.company} placeholder="Contoh: PT Samudra Nusantara" /></label>
            <label className="field">Nama PIC<input name="pic" defaultValue={lead?.pic ?? ""} placeholder="Nama kontak" /></label>
            <label className="field">Jabatan<input name="job_title" defaultValue={lead?.job_title ?? ""} placeholder="Contoh: Procurement Manager" /></label>
            <label className="field">Nomor telepon / WhatsApp<input name="phone" type="tel" defaultValue={lead?.phone ?? ""} placeholder="08xx xxxx xxxx" /></label>
            <label className="field">Email<input name="email" type="email" defaultValue={lead?.email ?? ""} placeholder="nama@perusahaan.com" /></label>
            <label className="field wide">Industri<select name="industry" defaultValue={lead?.industry ?? ""}><option value="">Pilih industri</option>{options(items.industries)}</select></label>
          </div>
        </section>
        <section className="form-section"><div className="form-section-title"><span>02</span><div><h2>Kebutuhan kargo</h2><p>Rute, moda, dan detail pengiriman.</p></div></div>
          <div className="form-fields">
            <label className="field wide">Komoditas / barang<input name="commodity" defaultValue={lead?.commodity ?? ""} placeholder="Contoh: kopi robusta, komponen elektronik" /></label>
            <MultiSelect name="modes" label="Moda angkutan" values={items.modes} selected={lead?.modes} />
            <MultiSelect name="services" label="Layanan" values={items.services} selected={lead?.services} />
            <label className="field">Asal (POL)<input name="origin" defaultValue={lead?.origin ?? ""} placeholder="Kota / pelabuhan asal" /></label>
            <label className="field">Tujuan (POD)<input name="destination" defaultValue={lead?.destination ?? ""} placeholder="Kota / pelabuhan tujuan" /></label>
            <label className="field">Estimasi volume<input name="volume" type="number" min="0" step="any" defaultValue={lead?.volume ?? ""} placeholder="0" /></label>
            <label className="field">Satuan<select name="unit" defaultValue={lead?.unit ?? "TEU"}>{options(items.units)}</select></label>
            <label className="field">Incoterm<select name="incoterm" defaultValue={lead?.incoterm ?? ""}><option value="">Belum diketahui</option>{options(items.incoterms)}</select></label>
            <label className="field">Frekuensi pengiriman<select name="frequency" defaultValue={lead?.frequency ?? ""}><option value="">Pilih frekuensi</option>{options(items.frequencies)}</select></label>
          </div>
        </section>
        <section className="form-section"><div className="form-section-title"><span>03</span><div><h2>Peluang & tindak lanjut</h2><p>Nilai estimasi, tahap, dan langkah berikutnya.</p></div></div>
          <div className="form-fields">
            <label className="field">Estimasi nilai (Rp)<input name="estimated_value" type="number" min="0" step="1" defaultValue={lead?.estimated_value ?? 0} placeholder="0" /></label>
            <label className="field">Sumber lead<select name="source" defaultValue={lead?.source ?? ""}><option value="">Pilih sumber</option>{options(items.sources)}</select></label>
            <label className="field">Tahap pipeline<select name="stage" defaultValue={lead?.stage ?? "baru"}>{STAGES.map((stage) => <option value={stage.value} key={stage.value}>{stage.label}</option>)}</select></label>
            <label className="field">Prospek<select name="temperature" defaultValue={lead?.temperature ?? "Hangat"}><option value="">Pilih prospek</option>{options(items.temperatures)}</select></label>
            <label className="field">Alasan gagal<select name="lost_reason" defaultValue={lead?.lost_reason ?? ""}><option value="">Pilih alasan jika gagal</option>{options(items.lost_reasons)}</select></label>
            <label className="field">Tanggal follow-up<input type="date" name="follow_up" defaultValue={lead?.follow_up ?? ""} /></label>
            <label className="field wide">Catatan<textarea name="notes" rows={4} defaultValue={lead?.notes ?? ""} placeholder="Hasil meeting, kebutuhan khusus, kompetitor, atau rate yang diminta..." /></label>
          </div>
        </section>
        <div className="form-footer"><span>Lead ini akan tercatat atas nama akun Anda.</span><SaveLeadButton label={lead ? "Simpan perubahan" : "Simpan lead"} /></div>
      </form>
    </>
  );
}

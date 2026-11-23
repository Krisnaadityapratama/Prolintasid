"use client";

import { useState } from "react";
import { strToU8, zipSync } from "fflate";
import type { Lead } from "@/lib/crm";
import { stageLabel } from "@/lib/crm";

type LeadExportButtonsProps = { filters: { q: string; stage: string; area: string } };
type ExportValue = string | number;

const headers = [
  "ID lead", "Nama perusahaan", "PIC", "Jabatan", "Telepon", "Email", "Alamat perusahaan", "Area perusahaan",
  "Industri", "Komoditas", "Moda angkutan", "Layanan", "Asal", "Tujuan", "Volume", "Satuan volume",
  "Incoterm", "Frekuensi", "Nilai estimasi", "Sumber lead", "Tahap", "Prospek", "Follow-up", "Catatan",
  "Alasan lead gagal", "Ditutup pada", "ID user pembuat", "ID profil pembuat", "Nama pembuat", "Email pembuat",
  "Dibuat pada", "Diperbarui pada",
];

async function loadExportLeads(filters: LeadExportButtonsProps["filters"]) {
  const search = new URLSearchParams(filters);
  const response = await fetch(`/api/leads/export?${search.toString()}`, { cache: "no-store" });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
      ? result.error
      : "Gagal memuat data untuk ekspor.";
    throw new Error(message);
  }
  if (!Array.isArray(result)) throw new Error("Respons data ekspor tidak valid.");
  return result as Lead[];
}

function formatFollowUp(value: string | null) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

function getExportRows(leads: Lead[]): ExportValue[][] {
  const text = (value: string | null) => value || "—";
  const list = (values: string[]) => values.length ? values.join(", ") : "—";

  return leads.map((lead) => [
    lead.id,
    lead.company,
    text(lead.pic),
    text(lead.job_title),
    text(lead.phone),
    text(lead.email),
    text(lead.company_address),
    text(lead.company_area),
    text(lead.industry),
    text(lead.commodity),
    list(lead.modes),
    list(lead.services),
    text(lead.origin),
    text(lead.destination),
    lead.volume ?? "—",
    text(lead.unit),
    text(lead.incoterm),
    text(lead.frequency),
    lead.estimated_value,
    text(lead.source),
    stageLabel(lead.stage),
    text(lead.temperature),
    formatFollowUp(lead.follow_up),
    text(lead.notes),
    text(lead.lost_reason),
    text(lead.closed_at),
    lead.created_by,
    text(lead.creator?.id ?? null),
    text(lead.creator?.full_name ?? null),
    text(lead.creator?.email ?? null),
    lead.created_at,
    lead.updated_at,
  ]);
}

function downloadFile(content: BlobPart, type: string, extension: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `daftar-leads-${new Date().toISOString().slice(0, 10)}.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportCsv(rows: ExportValue[][]) {
  const escapeCell = (value: ExportValue) => {
    const text = String(value);
    const safeText = typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
  };
  const content = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  downloadFile(`\uFEFF${content}`, "text/csv;charset=utf-8", "csv");
}

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let name = "";
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function exportExcel(rows: ExportValue[][]) {
  const worksheetRows = [headers, ...rows];
  const sheetRows = worksheetRows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const reference = `${columnName(columnIndex + 1)}${rowIndex + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${reference}"><v>${value}</v></c>`;
      }
      return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
    }).join("");
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join("");
  const filterRange = `A1:${columnName(headers.length)}${worksheetRows.length}`;
  const files = {
    "[Content_Types].xml": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
    "_rels/.rels": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    "xl/workbook.xml": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Daftar Leads" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    "xl/_rels/workbook.xml.rels": strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
    "xl/worksheets/sheet1.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData><autoFilter ref="${filterRange}"/></worksheet>`),
  };
  const workbook = zipSync(files);
  const buffer = new ArrayBuffer(workbook.byteLength);
  new Uint8Array(buffer).set(workbook);
  downloadFile(buffer, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx");
}

export default function LeadExportButtons({ filters }: LeadExportButtonsProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function runExport(exporter: () => void | Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await exporter();
    } catch (cause) {
      setError(cause instanceof Error ? `Ekspor gagal: ${cause.message}` : "Ekspor gagal. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="export-controls">
      <div className="export-buttons" aria-label="Ekspor daftar leads">
        <button className="button secondary" type="button" disabled={busy} onClick={() => void runExport(async () => exportCsv(getExportRows(await loadExportLeads(filters))))}>CSV</button>
        <button className="button secondary" type="button" disabled={busy} onClick={() => void runExport(async () => exportExcel(getExportRows(await loadExportLeads(filters))))}>Excel</button>
      </div>
      {error && <span className="export-error" role="alert">{error}</span>}
    </div>
  );
}

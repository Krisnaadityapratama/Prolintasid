"use client";

import { useState } from "react";
import { strToU8, zipSync } from "fflate";
import type { LeadSummary } from "@/lib/crm";
import { formatCurrency, stageLabel } from "@/lib/crm";

type LeadExportButtonsProps = { leads: LeadSummary[] };
type ExportValue = string | number;

const headers = ["Perusahaan / rute", "Area", "Kontak", "Tahap", "Follow-up", "Pembuat", "Nilai estimasi"];

function formatFollowUp(value: string | null) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
    : "—";
}

function getExportRows(leads: LeadSummary[]): ExportValue[][] {
  return leads.map((lead) => {
    const route = [lead.origin, lead.destination].filter(Boolean).join(" - ") || "—";
    const contactDetails = lead.phone || lead.email || "Kontak belum diisi";
    return [
      `${lead.company} (${route})`,
      lead.company_area || "—",
      `${lead.pic || "—"} (${contactDetails})`,
      stageLabel(lead.stage),
      formatFollowUp(lead.follow_up),
      lead.creator?.full_name || lead.creator?.email || "—",
      lead.estimated_value,
    ];
  });
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

async function exportPdf(rows: ExportValue[][]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  document.setFontSize(14);
  document.text("Daftar Leads", 12, 14);
  autoTable(document, {
    head: [headers],
    body: rows.map((row) => row.map((value, index) => index === 6 ? formatCurrency(value) : String(value))),
    startY: 19,
    margin: { left: 12, right: 12 },
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [39, 101, 153] },
  });
  document.save(`daftar-leads-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function LeadExportButtons({ leads }: LeadExportButtonsProps) {
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

  const rows = getExportRows(leads);
  return (
    <div className="export-controls">
      <div className="export-buttons" aria-label="Ekspor daftar leads">
        <button className="button secondary" type="button" disabled={busy || !leads.length} onClick={() => void runExport(() => exportPdf(rows))}>PDF</button>
        <button className="button secondary" type="button" disabled={busy || !leads.length} onClick={() => void runExport(() => exportCsv(rows))}>CSV</button>
        <button className="button secondary" type="button" disabled={busy || !leads.length} onClick={() => void runExport(() => exportExcel(rows))}>Excel</button>
      </div>
      {error && <span className="export-error" role="alert">{error}</span>}
    </div>
  );
}

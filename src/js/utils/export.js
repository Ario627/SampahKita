import { formatDateTime } from './dates.js';
import { getLocationLabel } from './query.js';
import { PRIORITY, STATUS } from './status.js';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportsToCsv(reports) {
  const header = ['ID', 'Judul', 'Lokasi', 'Kategori', 'Status', 'Prioritas', 'Dibuat', 'Diperbarui'];
  const rows = reports.map((report) => [
    report.id,
    report.title,
    getLocationLabel(report),
    report.category,
    STATUS[report.status]?.label ?? report.status,
    PRIORITY[report.priority]?.label ?? report.priority,
    formatDateTime(report.createdAt),
    formatDateTime(report.updatedAt),
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
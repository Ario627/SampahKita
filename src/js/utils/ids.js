import { getWibYear } from './dates.js';

export function nextReportId(reports) {
  const prefix = `SK-${getWibYear()}-`;
  const highest = reports.reduce((max, report) => {
    if (!report || typeof report.id !== 'string' || !report.id.startsWith(prefix)) return max;
    const value = Number.parseInt(report.id.slice(prefix.length), 10);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

export function historyEntryId(reportId, sequence) {
  return `H-${reportId}-${sequence}`;
}

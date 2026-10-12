import { LOCATION_OTHER } from '../config.js';

const PRIORITY_WEIGHT = { HIGH: 3, MEDIUM: 2, LOW: 1 };

function timeOf(value) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function getLocationLabel(report) {
  if (!report) return '';
  if (report.location === LOCATION_OTHER) return report.customLocation || LOCATION_OTHER;
  return report.location || LOCATION_OTHER;
}

export function filterReports(reports, filters = {}) {
  const query = String(filters.query ?? '').trim().toLowerCase();
  const status = filters.status ?? 'ALL';
  const category = filters.category ?? 'ALL';
  const priority = filters.priority ?? 'ALL';
  return reports.filter((report) => {
    if (!report) return false;
    if (status !== 'ALL' && report.status !== status) return false;
    if (category !== 'ALL' && report.category !== category) return false;
    if (priority !== 'ALL' && report.priority !== priority) return false;
    if (!query) return true;
    const haystack = [
      report.id,
      report.title,
      getLocationLabel(report),
      report.category,
      report.description,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function sortReports(reports, mode = 'newest') {
  const copy = [...reports];
  switch (mode) {
    case 'oldest':
      return copy.sort((a, b) => timeOf(a.createdAt) - timeOf(b.createdAt));
    case 'updated':
      return copy.sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt));
    case 'priority':
      return copy.sort(
        (a, b) =>
          (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0) ||
          timeOf(b.createdAt) - timeOf(a.createdAt),
      );
    default:
      return copy.sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
  }
}

export function countByStatus(reports) {
  const counts = { ALL: reports.length };
  for (const report of reports) {
    if (!report) continue;
    counts[report.status] = (counts[report.status] ?? 0) + 1;
  }
  return counts;
}

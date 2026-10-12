import { initShell } from '../app.js';
import { CATEGORIES, LOCATIONS, LOCATION_OTHER } from '../config.js';
import { getReports, subscribe } from '../services/report-store.js';
import { countByStatus, getLocationLabel, sortReports } from '../utils/query.js';
import { STATUS, STATUS_ORDER, calculateDashboardStats } from '../utils/status.js';
import { renderEmptyState, renderReportMini } from '../ui/components.js';
import { clear, el, qs } from '../utils/dom.js';
import { formatNumber } from '../utils/format.js';

initShell();

const statsTarget = qs('#hero-stats');
const distTarget = qs('#dist-list');
const recentTarget = qs('#recent-list');
const recentMeta = qs('#recent-meta');
const areaTarget = qs('#area-grid');
const categoryTarget = qs('#category-bars');
const trendTarget = qs('#trend-chart');
const OPEN_STATUS = new Set(['SUBMITTED', 'REVIEWED', 'IN_PROGRESS']);
const DAY_MS = 86400000;
const WIB_OFFSET_MS = 420 * 60000;

function animateBar(fill, count, total) {
  window.requestAnimationFrame(() => {
    if (count > 0) fill.style.width = `${Math.max(Math.round((count / total) * 100), 8)}%`;
    else fill.style.width = '0%';
  });
}

function renderStats(reports) {
  const stats = calculateDashboardStats(reports);
  const cells = [
    { label: 'Laporan tercatat', value: stats.total },
    { label: 'Menunggu tindakan', value: stats.needsAttention },
    { label: 'Prioritas tinggi', value: stats.highPriority },
    { label: 'Selesai', value: stats.resolved },
  ];
  clear(statsTarget);
  for (const cell of cells) {
    statsTarget.append(
      el('div', {}, [
        el('span', { class: 'hero-stat-label', text: cell.label }),
        el('span', { class: 'hero-stat-value mt-1.5 block', text: formatNumber(cell.value) }),
      ]),
    );
  }
}

function renderDistribution(reports) {
  const counts = countByStatus(reports);
  const total = Math.max(1, reports.length);
  clear(distTarget);
  for (const status of STATUS_ORDER) {
    const count = counts[status] ?? 0;
    const fill = el('span', { class: 'dist-fill' });
    distTarget.append(
      el('div', { class: 'dist-row', dataset: { status } }, [
        el('span', { class: 'glyph', dataset: { status }, attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'dist-label', text: STATUS[status].label }),
        el('span', { class: 'dist-count', text: formatNumber(count) }),
        el('span', { class: 'dist-track', attrs: { 'aria-hidden': 'true' } }, [fill]),
      ]),
    );
    animateBar(fill, count, total);
  }
}

function renderStatusCounts(reports) {
  const counts = countByStatus(reports);
  for (const status of STATUS_ORDER) {
    const node = qs(`[data-status-count="${status}"]`);
    if (node) node.textContent = `${formatNumber(counts[status] ?? 0)} laporan saat ini`;
  }
}

function renderRecent(reports) {
  const latest = sortReports(reports, 'newest').slice(0, 3);
  clear(recentTarget);
  if (latest.length === 0) {
    recentTarget.append(
      renderEmptyState({
        title: 'Belum ada laporan.',
        message: 'Tiga laporan terbaru akan tampil di sini.',
        actionLabel: 'Buat laporan',
        actionHref: 'report.html',
      }),
    );
    recentMeta.textContent = 'Belum ada laporan tersimpan di browser ini.';
    return;
  }
  for (const report of latest) recentTarget.append(renderReportMini(report));
  recentMeta.textContent = `${formatNumber(reports.length)} laporan tersimpan di browser ini — data contoh simulasi.`;
}

function buildAreaStats(reports) {
  const map = new Map();
  for (const location of LOCATIONS) {
    if (location === LOCATION_OTHER) continue;
    map.set(location, { count: 0, open: 0 });
  }
  for (const report of reports) {
    const label = getLocationLabel(report) || LOCATION_OTHER;
    const entry = map.get(label) ?? { count: 0, open: 0 };
    entry.count += 1;
    if (OPEN_STATUS.has(report.status)) entry.open += 1;
    map.set(label, entry);
  }
  return [...map.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], 'id'));
}

function renderAreas(reports) {
  clear(areaTarget);
  for (const [label, stats] of buildAreaStats(reports)) {
    const statusText =
      stats.count === 0
        ? 'Belum ada laporan'
        : stats.open > 0
          ? `${formatNumber(stats.open)} perlu tindakan`
          : 'Tidak ada yang terbuka';
    areaTarget.append(
      el(
        'a',
        {
          class: 'area-tile',
          dataset: { empty: String(stats.count === 0) },
          href: `reports.html?q=${encodeURIComponent(label)}`,
          attrs: { title: `Lihat laporan lokasi ${label}` },
        },
        [
          el('span', { class: 'area-name', text: label }),
          el('span', { class: 'area-count', text: formatNumber(stats.count) }),
          el('span', { class: 'area-open', dataset: { open: String(stats.open > 0) }, text: statusText }),
        ],
      ),
    );
  }
}

function renderCategories(reports) {
  const counts = new Map(CATEGORIES.map((category) => [category, 0]));
  for (const report of reports) {
    if (counts.has(report.category)) counts.set(report.category, counts.get(report.category) + 1);
  }
  const max = Math.max(1, ...counts.values());
  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || CATEGORIES.indexOf(a[0]) - CATEGORIES.indexOf(b[0]),
  );
  clear(categoryTarget);
  for (const [category, count] of sorted) {
    const fill = el('span', { class: 'cat-fill' });
    categoryTarget.append(
      el(
        'a',
        {
          class: 'cat-row',
          href: `reports.html?category=${encodeURIComponent(category)}`,
          attrs: { title: `Lihat laporan kategori ${category}` },
        },
        [
          el('span', { class: 'cat-name', text: category }),
          el('span', { class: 'cat-count', text: formatNumber(count) }),
          el('span', { class: 'cat-track', attrs: { 'aria-hidden': 'true' } }, [fill]),
        ],
      ),
    );
    animateBar(fill, count, max);
  }
}

function wibDayKey(value) {
  const shifted = new Date(new Date(value).getTime() + WIB_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${shifted.getUTCMonth() + 1}-${shifted.getUTCDate()}`;
}

function renderTrend(reports) {
  const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' });
  const fullDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * DAY_MS);
    days.push({ key: wibDayKey(date), label: weekday.format(date), full: fullDate.format(date), count: 0 });
  }
  for (const report of reports) {
    const entry = days.find((day) => day.key === wibDayKey(report.createdAt));
    if (entry) entry.count += 1;
  }
  const max = Math.max(1, ...days.map((day) => day.count));
  clear(trendTarget);
  for (const day of days) {
    const fill = el('span', { class: 'trend-fill' });
    trendTarget.append(
      el('div', { class: 'trend-col', attrs: { title: `${day.label} ${day.full} — ${day.count} laporan` } }, [
        el('span', { class: 'trend-count', text: day.count > 0 ? formatNumber(day.count) : '' }),
        el('span', { class: 'trend-track', attrs: { 'aria-hidden': 'true' } }, [fill]),
        el('span', { class: 'trend-label', text: day.label }),
      ]),
    );
    window.requestAnimationFrame(() => {
      fill.style.height = day.count > 0 ? `${Math.max(Math.round((day.count / max) * 100), 12)}%` : '0%';
    });
  }
}

function render() {
  const reports = getReports();
  renderStats(reports);
  renderDistribution(reports);
  renderStatusCounts(reports);
  renderRecent(reports);
  renderAreas(reports);
  renderCategories(reports);
  renderTrend(reports);
}

render();
subscribe(render);

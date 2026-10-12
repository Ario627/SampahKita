import { el } from '../utils/dom.js';
import { daysSince, formatDate, formatDateTime, relativeTime } from '../utils/dates.js';
import { formatNumber } from '../utils/format.js';
import { PRIORITY, STATUS, priorityLabel } from '../utils/status.js';
import { getLocationLabel } from '../utils/query.js';

const PUBLIC_COLUMNS = ['ID', 'Laporan', 'Kategori', 'Status', 'Dibuat', 'Aksi'];
const STAFF_COLUMNS = ['ID', 'Laporan', 'Kategori', 'Status', 'Prioritas', 'Dibuat', 'Aksi'];

function detailHref(report) {
  return `report-detail.html?id=${encodeURIComponent(report.id)}`;
}

export function renderStatusBadge(status) {
  const meta = STATUS[status] ?? STATUS.SUBMITTED;
  return el('span', { class: 'badge', dataset: { status: meta.value } }, [
    el('span', { class: 'glyph', dataset: { status: meta.value }, attrs: { 'aria-hidden': 'true' } }),
    el('span', { text: meta.label }),
  ]);
}

export function renderPriorityChip(priority, extraClass = '') {
  const meta = PRIORITY[priority] ?? PRIORITY.MEDIUM;
  return el('span', { class: `prio ${extraClass}`.trim(), dataset: { priority: meta.value } }, [
    el('span', { text: `Prioritas ${meta.label}` }),
  ]);
}

export function renderStatusLine(status, extraClass = '') {
  const meta = STATUS[status] ?? STATUS.SUBMITTED;
  return el('span', { class: `inline-flex items-center gap-2 ${extraClass}`.trim() }, [
    el('span', { class: 'glyph', dataset: { status: meta.value }, attrs: { 'aria-hidden': 'true' } }),
    el('span', {
      class: 'font-mono text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink',
      text: meta.label,
    }),
  ]);
}

export function renderReportMini(report) {
  return el(
    'a',
    {
      class:
        'group flex items-start gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-b-0 hover:bg-fern/60',
      href: detailHref(report),
    },
    [
      el('span', {
        class: 'glyph mt-1.5',
        dataset: { status: report.status },
        attrs: { 'aria-hidden': 'true' },
      }),
      el('span', { class: 'min-w-0 flex-1' }, [
        el('span', { class: 'row-title block text-[0.95rem] transition-colors group-hover:text-moss', text: report.title }),
        el('span', { class: 'row-sub block', text: `${report.id} · ${relativeTime(report.createdAt)}` }),
      ]),
      el('span', {
        class: 'link-arrow-mark mt-1 font-mono text-[0.8rem] text-ink-faint transition-all group-hover:translate-x-1 group-hover:text-moss',
        text: '→',
        attrs: { 'aria-hidden': 'true' },
      }),
    ],
  );
}

export function renderLedgerHead(variant = 'public') {
  const columns = variant === 'staff' ? STAFF_COLUMNS : PUBLIC_COLUMNS;
  const head = el('div', {
    class: `ledger-head ${variant === 'staff' ? 'ledger-grid-staff' : 'ledger-grid-public'}`,
    attrs: { 'aria-hidden': 'true' },
  });
  for (const column of columns) head.append(el('span', { text: column }));
  return head;
}

export function renderReportRow(report, options = {}) {
  const { variant = 'public', onManage = null } = options;
  const staff = variant === 'staff';
  const titleLink = el('a', { href: detailHref(report), text: report.title });
  const mobilePriority = renderPriorityChip(report.priority, 'md:hidden');
  const openStatus =
    report.status === 'SUBMITTED' || report.status === 'REVIEWED' || report.status === 'IN_PROGRESS';
  const staleDays = openStatus ? daysSince(report.updatedAt) : 0;
  const staleBadge =
    staff && staleDays >= 2 ? el('span', { class: 'row-age', text: `Menganggur ${staleDays} hari` }) : null;
  const action = staff
    ? el('button', {
        type: 'button',
        class: 'btn btn-ghost btn-sm mt-3 w-full md:mt-0 md:w-auto',
        text: 'Kelola',
        on: onManage ? { click: () => onManage(report.id) } : {},
      })
    : el('a', { class: 'link-arrow mt-3 md:mt-0', href: detailHref(report) }, [
        el('span', { text: 'Detail' }),
        el('span', { class: 'link-arrow-mark', text: '→', attrs: { 'aria-hidden': 'true' } }),
      ]);
  return el(
    'article',
    { class: `ledger-row ${staff ? 'ledger-grid-staff' : 'ledger-grid-public'}` },
    [
      el('div', { class: 'flex items-baseline justify-between gap-3 md:hidden' }, [
        el('span', { class: 'cell-id', text: report.id }),
        el('time', {
          class: 'cell-date',
          attrs: { datetime: report.createdAt },
          text: relativeTime(report.createdAt),
        }),
      ]),
      el('span', { class: 'cell-id hidden md:inline', text: report.id }),
      el('div', { class: 'mt-2.5 min-w-0 md:mt-0' }, [
        el('h3', { class: 'row-title' }, [titleLink]),
        el('p', { class: 'row-sub', text: `${getLocationLabel(report)} · ${report.category}` }),
        el('p', { class: 'row-excerpt' }, [el('span', { text: report.description })]),
      ]),
      el('span', {
        class: 'hidden truncate font-mono text-[0.64rem] font-bold uppercase tracking-[0.08em] text-ink-soft md:block',
        text: report.category,
        attrs: { title: report.category },
      }),
      el('div', { class: 'mt-3 flex flex-wrap items-center gap-2 md:mt-0' }, [
        renderStatusBadge(report.status),
        mobilePriority,
        staleBadge,
      ]),
      staff
        ? el('span', { class: 'hidden md:inline-flex' }, [renderPriorityChip(report.priority)])
        : null,
      el('time', {
        class: 'cell-date hidden md:inline',
        attrs: { datetime: report.createdAt, title: formatDateTime(report.createdAt) },
        text: formatDate(report.createdAt),
      }),
      action,
    ],
  );
}

export function renderReportList(reports, options = {}) {
  const list = el('div', { class: 'ledger' });
  list.append(renderLedgerHead(options.variant ?? 'public'));
  for (const report of reports) {
    list.append(renderReportRow(report, options));
  }
  return list;
}

export function renderReportTimeline(history = []) {
  const items = [...history].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );
  const list = el('ol', { class: 'timeline' });
  for (const entry of items) {
    const meta = STATUS[entry.status] ?? STATUS.SUBMITTED;
    list.append(
      el('li', { class: 'timeline-item' }, [
        el('span', { class: 'timeline-node' }, [
          el('span', { class: 'glyph', dataset: { status: meta.value }, attrs: { 'aria-hidden': 'true' } }),
        ]),
        el('div', { class: 'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1' }, [
          el('span', {
            class: 'font-mono text-[0.64rem] font-bold uppercase tracking-[0.1em] text-ink',
            text: meta.label,
          }),
          el('time', {
            class: 'cell-date',
            attrs: { datetime: entry.changedAt },
            text: formatDateTime(entry.changedAt),
          }),
        ]),
        entry.note ? el('p', { class: 'mt-1.5 text-[0.85rem] leading-relaxed text-ink-soft', text: entry.note }) : null,
        el('p', {
          class: 'mt-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-faint',
          text: `Dicatat oleh ${entry.actor === 'PETUGAS' ? 'petugas' : 'sistem'}`,
        }),
      ]),
    );
  }
  return list;
}

export function renderStatCell({ key, label, value, active = false, onClick = null, extraClass = '' }) {
  return el(
    'button',
    {
      type: 'button',
      class: `stat-cell ${extraClass}`.trim(),
      dataset: { status: key, active: String(active) },
      attrs: { 'aria-pressed': String(active) },
      on: onClick ? { click: () => onClick(key) } : {},
    },
    [
      el('span', { class: 'stat-value', text: formatNumber(value) }),
      el('span', { class: 'stat-label', text: label }),
    ],
  );
}

export function renderEmptyState({ title, message, actionLabel = '', actionHref = null, onAction = null }) {
  const actions = [];
  if (actionLabel) {
    actions.push(
      actionHref
        ? el('a', { class: 'btn btn-primary', href: actionHref, text: actionLabel })
        : el('button', {
            type: 'button',
            class: 'btn btn-primary',
            text: actionLabel,
            on: onAction ? { click: onAction } : {},
          }),
    );
  }
  return el('div', { class: 'empty-state' }, [
    el('h2', { class: 'font-display text-[1.35rem]', text: title }),
    el('p', { class: 'mx-auto mt-2.5 max-w-md text-[0.88rem] leading-relaxed text-ink-soft', text: message }),
    actions.length ? el('div', { class: 'mt-6 flex flex-wrap justify-center gap-3' }, actions) : null,
  ]);
}

export function renderMetaItem(label, value) {
  const valueNode = value instanceof Node ? value : el('span', { text: String(value ?? '') });
  return el('div', { class: 'border-t border-line py-3' }, [
    el('dt', { class: 'eyebrow', text: label }),
    el('dd', { class: 'mt-1 text-[0.9rem] font-medium leading-snug' }, [valueNode]),
  ]);
}

export function renderSectionTitle(eyebrowText, title) {
  return el('div', {}, [
    el('p', { class: 'eyebrow', text: eyebrowText }),
    el('h2', { class: 'section-title', text: title }),
  ]);
}

export { priorityLabel };

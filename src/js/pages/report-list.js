import { initShell } from '../app.js';
import { CATEGORIES } from '../config.js';
import { getFollowedIds, getReports, subscribe } from '../services/report-store.js';
import { countByStatus, filterReports, sortReports } from '../utils/query.js';
import { STATUS, STATUS_ORDER } from '../utils/status.js';
import { renderEmptyState, renderReportList } from '../ui/components.js';
import { clear, debounce, el, qs } from '../utils/dom.js';
import { formatNumber } from '../utils/format.js';

initShell();

const searchInput = qs('#search-input');
const statusChips = qs('#status-chips');
const categoryFilter = qs('#category-filter');
const sortFilter = qs('#sort-filter');
const clearButton = qs('#clear-filters');
const resultCount = qs('#result-count');
const listTarget = qs('#report-list');

const SORT_MODES = ['newest', 'oldest', 'priority', 'updated'];

const state = readParams();

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    query: params.get('q') ?? '',
    status: STATUS[status] ? status : 'ALL',
    category: CATEGORIES.includes(category) ? category : 'ALL',
    sort: SORT_MODES.includes(sort) ? sort : 'newest',
    followed: params.get('followed') === '1',
  };
}

function isFiltering() {
  return (
    state.query.trim() !== '' ||
    state.status !== 'ALL' ||
    state.category !== 'ALL' ||
    state.sort !== 'newest' ||
    state.followed
  );
}

function syncParams() {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set('q', state.query.trim());
  if (state.status !== 'ALL') params.set('status', state.status);
  if (state.category !== 'ALL') params.set('category', state.category);
  if (state.sort !== 'newest') params.set('sort', state.sort);
  if (state.followed) params.set('followed', '1');
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
  window.history.replaceState(null, '', url);
}

function renderChips(reports) {
  const counts = countByStatus(reports);
  const entries = [
    { value: 'ALL', label: 'Semua' },
    ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS[status].label })),
  ];
  clear(statusChips);
  for (const entry of entries) {
    const button = el(
      'button',
      {
        type: 'button',
        class: 'chip',
        dataset: { value: entry.value },
        attrs: { 'aria-pressed': String(state.status === entry.value) },
        on: {
          click: () => {
            state.status = entry.value;
            render();
            const target = qs(`[data-value="${entry.value}"]`, statusChips);
            if (target) target.focus();
          },
        },
      },
      [
        el('span', { text: entry.label }),
        el('span', { class: 'chip-count', text: formatNumber(counts[entry.value] ?? 0) }),
      ],
    );
    statusChips.append(button);
  }
  const followedIds = new Set(getFollowedIds());
  statusChips.append(
    el(
      'button',
      {
        type: 'button',
        class: 'chip',
        attrs: {
          'aria-pressed': String(state.followed),
          title: 'Tampilkan hanya laporan yang kamu pantau',
        },
        on: {
          click: () => {
            state.followed = !state.followed;
            render();
          },
        },
      },
      [
        el('span', { text: 'Dipantau' }),
        el('span', { class: 'chip-count', text: formatNumber(followedIds.size) }),
      ],
    ),
  );
}

function clearFilters() {
  state.query = '';
  state.status = 'ALL';
  state.category = 'ALL';
  state.sort = 'newest';
  state.followed = false;
  searchInput.value = '';
  categoryFilter.value = 'ALL';
  sortFilter.value = 'newest';
  render();
  searchInput.focus();
}

function render() {
  const all = getReports();
  renderChips(all);
  const followedIds = new Set(getFollowedIds());
  const source = state.followed ? all.filter((report) => followedIds.has(report.id)) : all;
  const filtered = sortReports(filterReports(source, state), state.sort);
  resultCount.textContent = `Menampilkan ${formatNumber(filtered.length)} dari ${formatNumber(all.length)} laporan`;
  clear(listTarget);
  if (all.length === 0) {
    listTarget.append(
      renderEmptyState({
        title: 'Belum ada laporan.',
        message: 'Saat ada yang melaporkan masalah kebersihan, laporan akan muncul di sini lengkap dengan status penanganannya.',
        actionLabel: 'Buat laporan',
        actionHref: 'report.html',
      }),
    );
  } else if (state.followed && source.length === 0) {
    listTarget.append(
      renderEmptyState({
        title: 'Belum ada laporan dipantau.',
        message: 'Buka detail laporan lalu tekan tombol Pantau untuk mengikuti perkembangannya di sini.',
        actionLabel: 'Tampilkan semua laporan',
        onAction: clearFilters,
      }),
    );
  } else if (filtered.length === 0) {
    listTarget.append(
      renderEmptyState({
        title: 'Tidak ada laporan yang cocok.',
        message: 'Coba ubah kata kunci pencarian atau bersihkan filter untuk melihat semua laporan.',
        actionLabel: 'Bersihkan filter',
        onAction: clearFilters,
      }),
    );
  } else {
    listTarget.append(renderReportList(filtered, { variant: 'public' }));
  }
  clearButton.hidden = !isFiltering();
  syncParams();
}

for (const category of CATEGORIES) categoryFilter.append(el('option', { value: category, text: category }));

searchInput.value = state.query;
categoryFilter.value = state.category;
sortFilter.value = state.sort;

searchInput.addEventListener(
  'input',
  debounce(() => {
    state.query = searchInput.value;
    render();
  }, 200),
);

categoryFilter.addEventListener('change', () => {
  state.category = categoryFilter.value;
  render();
});

sortFilter.addEventListener('change', () => {
  state.sort = sortFilter.value;
  render();
});

clearButton.addEventListener('click', clearFilters);

render();
subscribe(render);

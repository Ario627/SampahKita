import { confirmDialog, initShell, toast } from '../app.js';
import { CATEGORIES } from '../config.js';
import {
  applyStaffUpdate,
  clearAllReports,
  getReportById,
  getReports,
  getSettings,
  setMode,
  subscribe,
} from '../services/report-store.js';
import { filterReports, sortReports } from '../utils/query.js';
import { downloadCsv, reportsToCsv } from '../utils/export.js';
import {
  PRIORITY,
  PRIORITY_ORDER,
  STATUS,
  STATUS_ORDER,
  calculateDashboardStats,
  nextStatuses,
} from '../utils/status.js';
import { renderEmptyState, renderReportList, renderStatCell } from '../ui/components.js';
import { clear, debounce, el, qs } from '../utils/dom.js';
import { formatNumber } from '../utils/format.js';

initShell();

const gate = qs('#staff-gate');
const app = qs('#staff-app');
const statGrid = qs('#stat-grid');
const searchInput = qs('#search-input');
const statusFilter = qs('#status-filter');
const categoryFilter = qs('#category-filter');
const priorityFilter = qs('#priority-filter');
const sortFilter = qs('#sort-filter');
const clearButton = qs('#clear-filters');
const exportButton = qs('#export-button');
const resultCount = qs('#result-count');
const listTarget = qs('#staff-list');
const drawer = qs('#manage-dialog');
const drawerBody = qs('#drawer-body');
const drawerTitle = qs('#drawer-title');

const SORT_MODES = ['newest', 'oldest', 'priority', 'updated'];

const STAFF_ERRORS = {
  NOT_FOUND: 'Laporan tidak ditemukan. Mungkin diubah di tab lain — tutup panel lalu muat ulang halaman.',
  INVALID_TRANSITION: 'Transisi status tidak valid. Tutup panel lalu muat ulang halaman.',
  REASON_REQUIRED: 'Alasan penolakan wajib diisi minimal 10 karakter.',
  REOPEN_NOTE_REQUIRED: 'Membuka kembali laporan selesai memerlukan catatan alasan.',
  NO_CHANGES: 'Belum ada perubahan untuk disimpan.',
  INVALID_PRIORITY: 'Prioritas tidak dikenali.',
  NOTE_TOO_LONG: 'Catatan terlalu panjang. Persingkat sedikit.',
  STORAGE_FAILED: 'Gagal menyimpan ke penyimpanan browser. Ruang mungkin penuh.',
  INVALID_DATA: 'Data laporan tidak lengkap.',
};

const state = {
  query: '',
  status: 'ALL',
  category: 'ALL',
  priority: 'ALL',
  sort: 'newest',
};

let managingId = null;
let selectedStatus = 'SUBMITTED';
let selectedPriority = 'MEDIUM';
let suppressExternal = false;

function fillSelect(select, entries) {
  clear(select);
  for (const entry of entries) select.append(el('option', { value: entry.value, text: entry.label }));
}

function isFiltering() {
  return state.query.trim() !== '' || state.status !== 'ALL' || state.category !== 'ALL' || state.priority !== 'ALL';
}

function syncGate() {
  const isStaff = getSettings().mode === 'staff';
  gate.hidden = isStaff;
  app.hidden = !isStaff;
  if (isStaff) render();
}

function renderStats(reports) {
  const stats = calculateDashboardStats(reports);
  clear(statGrid);
  statGrid.append(
    renderStatCell({
      key: 'ALL',
      label: 'Total laporan',
      value: stats.total,
      active: state.status === 'ALL',
      onClick: setStatusFilter,
    }),
  );
  for (const status of STATUS_ORDER) {
    statGrid.append(
      renderStatCell({
        key: status,
        label: STATUS[status].label,
        value: stats.byStatus[status],
        active: state.status === status,
        onClick: setStatusFilter,
      }),
    );
  }
  statGrid.append(
    renderStatCell({
      key: 'HIGH',
      label: 'Prioritas tinggi',
      value: stats.highPriority,
      active: state.priority === 'HIGH',
      onClick: () => toggleHighFilter(),
      extraClass: 'col-span-2 sm:col-span-1',
    }),
  );
}

function toggleHighFilter() {
  state.priority = state.priority === 'HIGH' ? 'ALL' : 'HIGH';
  priorityFilter.value = state.priority;
  render();
}

function setStatusFilter(key) {
  state.status = key === 'HIGH' ? 'ALL' : key;
  statusFilter.value = state.status;
  render();
}

function renderList(reports) {
  const filtered = sortReports(filterReports(reports, state), state.sort);
  resultCount.textContent = `Menampilkan ${formatNumber(filtered.length)} dari ${formatNumber(reports.length)} laporan`;
  clear(listTarget);
  if (reports.length === 0) {
    listTarget.append(
      renderEmptyState({
        title: 'Belum ada laporan untuk dikelola.',
        message: 'Laporan baru akan muncul di sini. Muat data demo lewat tombol di bawah.',
        actionLabel: 'Reset data demo',
        onAction: () => {
          const resetButton = qs('[data-action="reset-demo"]');
          if (resetButton) resetButton.click();
        },
      }),
    );
  } else if (filtered.length === 0) {
    listTarget.append(
      renderEmptyState({
        title: 'Tidak ada laporan yang cocok.',
        message: 'Ubah kata kunci atau bersihkan filter agar seluruh laporan terlihat kembali.',
        actionLabel: 'Bersihkan filter',
        onAction: clearFilters,
      }),
    );
  } else {
    listTarget.append(renderReportList(filtered, { variant: 'staff', onManage: openManage }));
  }
  clearButton.hidden = !isFiltering();
}

function render() {
  if (getSettings().mode !== 'staff') return;
  const reports = getReports();
  renderStats(reports);
  renderList(reports);
}

function clearFilters() {
  state.query = '';
  state.status = 'ALL';
  state.category = 'ALL';
  state.priority = 'ALL';
  state.sort = 'newest';
  searchInput.value = '';
  statusFilter.value = 'ALL';
  categoryFilter.value = 'ALL';
  priorityFilter.value = 'ALL';
  sortFilter.value = 'newest';
  render();
  searchInput.focus();
}

function noteFieldConfig(report) {
  const isReject = selectedStatus === 'REJECTED' && report.status !== 'REJECTED';
  const isReopen = report.status === 'RESOLVED' && selectedStatus === 'IN_PROGRESS';
  if (isReject) {
    return {
      label: 'Alasan penolakan · wajib',
      hint: 'Ditampilkan terbuka ke pelapor.',
      placeholder: 'Contoh: lokasi berada di luar area pengelolaan sekolah.',
    };
  }
  if (isReopen) {
    return {
      label: 'Alasan dibuka kembali · wajib',
      hint: 'Jelaskan mengapa perlu ditangani kembali.',
      placeholder: 'Contoh: kondisi muncul kembali setelah hujan deras.',
    };
  }
  return {
    label: 'Catatan tindak lanjut · opsional',
    hint: 'Terlihat oleh pelapor di halaman detail.',
    placeholder: 'Contoh: penanganan dijadwalkan besok pagi.',
  };
}

function renderDrawer(report) {
  drawerTitle.textContent = `${report.id} — ${report.title}`;
  clear(drawerBody);

  const noteConfig = noteFieldConfig(report);
  const noteLabel = el('span', { text: noteConfig.label });
  const noteHint = el('p', { class: 'hint mt-1.5', text: noteConfig.hint });
  const noteInput = el('textarea', {
    class: 'input mt-2',
    attrs: { id: 'drawer-note', placeholder: noteConfig.placeholder, maxlength: '300' },
  });
  const errorBox = el('div', { class: 'error-summary mt-4', attrs: { role: 'alert' } });
  errorBox.hidden = true;

  function refreshNoteField() {
    const config = noteFieldConfig(report);
    noteLabel.textContent = config.label;
    noteHint.textContent = config.hint;
    noteInput.placeholder = config.placeholder;
  }

  const statusChoices = [
    { value: report.status, label: `${STATUS[report.status].label} · tanpa perubahan` },
    ...nextStatuses(report.status).map((status) => ({ value: status, label: STATUS[status].label })),
  ];

  const statusOptions = statusChoices.map((choice) =>
    el('label', { class: 'option' }, [
      el('input', {
        type: 'radio',
        name: 'drawer-status',
        value: choice.value,
        class: 'mt-0.5 accent-moss',
        checked: choice.value === selectedStatus,
        on: {
          change: () => {
            selectedStatus = choice.value;
            refreshNoteField();
          },
        },
      }),
      el('span', { class: 'min-w-0' }, [
        el('span', {
          class: 'block font-mono text-[0.66rem] font-bold uppercase tracking-[0.1em]',
          text: choice.label,
        }),
        choice.value !== report.status
          ? el('span', {
              class: 'mt-1 block text-[0.78rem] leading-snug text-ink-soft',
              text: STATUS[choice.value].description,
            })
          : null,
      ]),
    ]),
  );

  if (nextStatuses(report.status).length === 0) {
    statusOptions.push(
      el('p', {
        class: 'hint',
        text: 'Status ini bersifat final. Kamu masih dapat menambah catatan atau mengubah prioritas.',
      }),
    );
  }

  const priorityOptions = PRIORITY_ORDER.map((priority) =>
    el('label', { class: 'option' }, [
      el('input', {
        type: 'radio',
        name: 'drawer-priority',
        value: priority,
        class: 'mt-0.5 accent-moss',
        checked: priority === selectedPriority,
        on: {
          change: () => {
            selectedPriority = priority;
          },
        },
      }),
      el('span', { class: 'font-mono text-[0.66rem] font-bold uppercase tracking-[0.1em]', text: PRIORITY[priority].label }),
    ]),
  );

  const saveButton = el('button', {
    type: 'button',
    class: 'btn btn-primary w-full',
    text: 'Simpan perubahan',
    on: { click: () => handleSave(report, noteInput, errorBox) },
  });

  drawerBody.append(
    el('div', { class: 'space-y-6' }, [
      el('section', {}, [
        el('p', { class: 'eyebrow', text: 'Ubah status' }),
        el('div', { class: 'mt-3 space-y-2' }, statusOptions),
      ]),
      el('section', { class: 'border-t border-line pt-6' }, [
        el('p', { class: 'eyebrow', text: 'Prioritas' }),
        el('div', { class: 'mt-3 space-y-2' }, priorityOptions),
        el('p', { class: 'hint mt-2.5', text: 'Dinilai dari kondisi aktual, bukan kategori saja.' }),
      ]),
      el('section', { class: 'border-t border-line pt-6' }, [
        el('label', { class: 'field-label', attrs: { for: 'drawer-note' } }, [noteLabel]),
        noteInput,
        noteHint,
        errorBox,
        el('div', { class: 'mt-5 flex flex-col gap-2.5 sm:flex-row' }, [
          saveButton,
          el('button', {
            type: 'button',
            class: 'btn btn-ghost sm:w-auto',
            text: 'Tutup',
            on: { click: () => drawer.close() },
          }),
        ]),
      ]),
      el('section', { class: 'border-t border-line pt-6' }, [
        el('p', { class: 'eyebrow', text: 'Riwayat laporan' }),
        el('ul', { class: 'mt-3 space-y-2.5' }, [
          ...[...report.history]
            .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime())
            .reverse()
            .map((entry) =>
              el('li', { class: 'flex items-start gap-3' }, [
                el('span', { class: 'glyph mt-1', dataset: { status: entry.status }, attrs: { 'aria-hidden': 'true' } }),
                el('span', { class: 'min-w-0' }, [
                  el('span', { class: 'block text-[0.82rem] leading-snug text-ink-soft', text: entry.note || STATUS[entry.status]?.label }),
                  el('span', { class: 'hint', text: entry.changedAt }),
                ]),
              ]),
            ),
        ]),
      ]),
    ]),
  );
}

async function handleSave(report, noteInput, errorBox) {
  const fresh = getReportById(report.id);
  if (!fresh) {
    errorBox.textContent = STAFF_ERRORS.NOT_FOUND;
    errorBox.hidden = false;
    return;
  }
  const statusChanged = selectedStatus !== fresh.status;
  if (statusChanged && selectedStatus === 'REJECTED') {
    const confirmed = await confirmDialog({
      title: 'Tolak laporan ini?',
      message: 'Laporan akan ditandai tidak dapat ditindaklanjuti dan alasanmu ditampilkan kepada pelapor.',
      confirmLabel: 'Ya, tolak laporan',
      tone: 'danger',
    });
    if (!confirmed) return;
  }
  if (statusChanged && fresh.status === 'RESOLVED' && selectedStatus === 'IN_PROGRESS') {
    const confirmed = await confirmDialog({
      title: 'Buka kembali laporan ini?',
      message: 'Laporan yang sudah selesai akan kembali berstatus sedang ditangani. Catatan alasan wajib diisi.',
      confirmLabel: 'Ya, buka kembali',
    });
    if (!confirmed) return;
  }
  suppressExternal = true;
  try {
    const updated = applyStaffUpdate(fresh.id, {
      status: selectedStatus,
      priority: selectedPriority,
      note: noteInput.value,
    });
    toast(`Laporan ${updated.id} diperbarui — status: ${STATUS[updated.status].label}.`, { tone: 'success' });
    drawer.close();
  } catch (error) {
    const message = STAFF_ERRORS[error.message] ?? 'Perubahan gagal disimpan. Coba lagi.';
    errorBox.textContent = message;
    errorBox.hidden = false;
    toast(message, { tone: 'error' });
  } finally {
    suppressExternal = false;
  }
}

function openManage(reportId) {
  const report = getReportById(reportId);
  if (!report) {
    toast('Laporan tidak ditemukan. Mungkin diubah di tab lain.', { tone: 'error' });
    render();
    return;
  }
  managingId = report.id;
  selectedStatus = report.status;
  selectedPriority = report.priority;
  renderDrawer(report);
  drawer.showModal();
}

qs('[data-action="activate-staff"]')?.addEventListener('click', () => {
  setMode('staff');
  toast('Mode petugas aktif. Ini simulasi, bukan autentikasi.');
  syncGate();
});

qs('[data-action="empty-reports"]')?.addEventListener('click', async () => {
  const confirmed = await confirmDialog({
    title: 'Kosongkan semua laporan?',
    message:
      'Seluruh laporan di browser ini akan dihapus untuk menguji tampilan kosong. Tombol reset data demo ada di footer untuk memuat ulang contoh.',
    confirmLabel: 'Ya, kosongkan',
    tone: 'danger',
  });
  if (!confirmed) return;
  try {
    suppressExternal = true;
    clearAllReports();
    toast('Semua laporan dikosongkan. Reset data demo tersedia di footer.', { tone: 'success' });
  } catch {
    toast('Gagal menyimpan perubahan.', { tone: 'error' });
  } finally {
    suppressExternal = false;
  }
});

drawer.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target && target.closest('[data-drawer-close]')) drawer.close();
});

fillSelect(statusFilter, [
  { value: 'ALL', label: 'Semua status' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS[status].label })),
]);
fillSelect(categoryFilter, [
  { value: 'ALL', label: 'Semua kategori' },
  ...CATEGORIES.map((category) => ({ value: category, label: category })),
]);
fillSelect(priorityFilter, [
  { value: 'ALL', label: 'Semua prioritas' },
  ...PRIORITY_ORDER.map((priority) => ({ value: priority, label: PRIORITY[priority].label })),
]);
fillSelect(sortFilter, [
  { value: 'newest', label: 'Terbaru dibuat' },
  { value: 'oldest', label: 'Terlama dibuat' },
  { value: 'priority', label: 'Prioritas tertinggi' },
  { value: 'updated', label: 'Terakhir diperbarui' },
]);

searchInput.addEventListener(
  'input',
  debounce(() => {
    state.query = searchInput.value;
    render();
  }, 200),
);

statusFilter.addEventListener('change', () => {
  state.status = statusFilter.value;
  render();
});

categoryFilter.addEventListener('change', () => {
  state.category = categoryFilter.value;
  render();
});

priorityFilter.addEventListener('change', () => {
  state.priority = priorityFilter.value;
  render();
});

sortFilter.addEventListener('change', () => {
  state.sort = sortFilter.value;
  render();
});

clearButton.addEventListener('click', clearFilters);

exportButton.addEventListener('click', () => {
  const filtered = sortReports(filterReports(getReports(), state), state.sort);
  if (filtered.length === 0) {
    toast('Tidak ada laporan untuk diekspor pada filter ini.', { tone: 'error' });
    return;
  }
  downloadCsv(`sampahkita-laporan-${new Date().toISOString().slice(0, 10)}.csv`, reportsToCsv(filtered));
  toast(`${filtered.length} laporan diekspor ke CSV.`, { tone: 'success' });
});

subscribe(() => {
  render();
  if (drawer.open && !suppressExternal) {
    drawer.close();
    toast('Data laporan berubah dari luar panel ini. Panel ditutup agar tidak menimpa perubahan.', { tone: 'info' });
  }
});

syncGate();

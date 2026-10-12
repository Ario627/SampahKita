import { initShell, toast } from '../app.js';
import { getReportById, isFollowed, subscribe, toggleFollow } from '../services/report-store.js';
import { STATUS } from '../utils/status.js';
import { getLocationLabel } from '../utils/query.js';
import {
  renderEmptyState,
  renderMetaItem,
  renderPriorityChip,
  renderReportTimeline,
  renderStatusBadge,
} from '../ui/components.js';
import { clear, el, qs } from '../utils/dom.js';
import { formatDateTime } from '../utils/dates.js';

initShell();

const root = qs('#detail-root');
const reportId = new URLSearchParams(window.location.search).get('id');

function sectionLabel(text) {
  return el('h2', { class: 'font-mono text-[0.64rem] font-bold uppercase tracking-[0.16em] text-ink-soft', text });
}

function renderPhotoBlock(report) {
  if (!report.photoDataUrl) {
    return el('div', { class: 'note-block' }, [el('p', { text: 'Tidak ada foto pada laporan ini.' })]);
  }
  const button = el('button', {
    type: 'button',
    class: 'photo-frame block w-full cursor-zoom-in transition-shadow hover:shadow-[4px_4px_0_0_var(--color-line-strong)]',
    attrs: { 'aria-label': `Perbesar foto laporan ${report.id}` },
    on: { click: () => openLightbox(report) },
  });
  button.append(el('img', { src: report.photoDataUrl, alt: `Foto laporan ${report.id}` }));
  return el('div', {}, [
    button,
    el('p', { class: 'hint mt-2', text: 'Klik untuk memperbesar.' }),
  ]);
}

function openLightbox(report) {
  const dialog = el('dialog', { class: 'dialog w-[min(94vw,54rem)]' });
  dialog.append(
    el('figure', { class: 'p-3 sm:p-4' }, [
      el('img', {
        src: report.photoDataUrl,
        alt: `Foto laporan ${report.id}`,
        class: 'max-h-[76vh] w-full bg-ink/5 object-contain',
      }),
      el('figcaption', { class: 'mt-3 flex flex-wrap items-center justify-between gap-3' }, [
        el('span', { class: 'hint', text: `Foto laporan ${report.id} — disimpan lokal di browser ini.` }),
        el('button', {
          type: 'button',
          class: 'btn btn-ghost btn-sm',
          text: 'Tutup',
          on: { click: () => dialog.close() },
        }),
      ]),
    ]),
  );
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

function renderError(title, message) {
  return el('div', {}, [
    renderEmptyState({
      title,
      message,
      actionLabel: 'Kembali ke daftar laporan',
      actionHref: 'reports.html',
    }),
    el('div', { class: 'mt-6 flex justify-center' }, [
      el('a', { class: 'btn btn-ghost', href: 'report.html', text: 'Buat laporan baru' }),
    ]),
  ]);
}

function renderDetail(report) {
  const meta = STATUS[report.status] ?? STATUS.SUBMITTED;
  const followed = isFollowed(report.id);
  const followButton = el('button', {
    type: 'button',
    class: 'btn btn-ghost btn-sm mt-5',
    attrs: { 'aria-pressed': String(followed) },
    text: followed ? 'Sedang dipantau' : 'Pantau laporan',
    on: {
      click: () => {
        const next = toggleFollow(report.id);
        toast(
          next ? `${report.id} ditambahkan ke daftar pantauan.` : `${report.id} berhenti dipantau.`,
          { tone: 'success' },
        );
      },
    },
  });
  const left = el('div', { class: 'min-w-0 space-y-9' }, [
    el('div', {}, [
      el('div', {}, [renderStatusBadge(report.status)]),
      el('h1', { class: 'mt-4 font-display text-[1.7rem] leading-tight sm:text-[2.15rem]', text: report.title }),
      el('dl', { class: 'mt-7 grid gap-x-8 sm:grid-cols-2' }, [
        renderMetaItem('Lokasi', getLocationLabel(report)),
        renderMetaItem('Kategori', report.category),
        renderMetaItem('Pelapor', report.reporterName || 'Tidak dicantumkan'),
        renderMetaItem('Dibuat', formatDateTime(report.createdAt)),
        renderMetaItem('Diperbarui', formatDateTime(report.updatedAt)),
      ]),
    ]),
    el('section', {}, [
      sectionLabel('Deskripsi'),
      el('p', {
        class: 'mt-3 whitespace-pre-line text-[0.92rem] leading-relaxed text-ink-soft',
        text: report.description,
      }),
    ]),
    report.extraNote
      ? el('section', {}, [
          sectionLabel('Catatan tambahan pelapor'),
          el('div', { class: 'note-block mt-3', text: report.extraNote }),
        ])
      : null,
    el('section', {}, [sectionLabel('Foto laporan'), el('div', { class: 'mt-3' }, [renderPhotoBlock(report)])]),
    report.staffNote && report.staffNote !== report.rejectionReason
      ? el('section', {}, [
          sectionLabel('Catatan petugas'),
          el('div', { class: 'staff-note mt-3' }, [
            el('p', { class: 'text-[0.88rem] leading-relaxed', text: report.staffNote }),
          ]),
        ])
      : null,
    report.status === 'REJECTED'
      ? el('section', {}, [
          sectionLabel('Tidak dapat ditindaklanjuti'),
          el('div', { class: 'rejection-block mt-3' }, [
            el('p', {
              class: 'text-[0.88rem] leading-relaxed text-rust',
              text: report.rejectionReason || 'Alasan penolakan tidak tersedia.',
            }),
            el('p', {
              class: 'mt-2.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-rust/80',
              text: `Diperbarui ${formatDateTime(report.updatedAt)}`,
            }),
          ]),
        ])
      : null,
  ]);

  const right = el('div', { class: 'space-y-8' }, [
    el('section', { class: 'card p-5' }, [
      sectionLabel('Status saat ini'),
      el('div', { class: 'mt-3' }, [renderStatusBadge(report.status)]),
      el('p', { class: 'mt-3 text-[0.85rem] leading-relaxed text-ink-soft', text: meta.description }),
      el('div', { class: 'mt-4 flex flex-wrap items-center gap-3' }, [
        renderPriorityChip(report.priority),
        report.status === 'RESOLVED' || report.status === 'REJECTED'
          ? el('span', {
              class: 'stamp',
              dataset: { tone: report.status === 'RESOLVED' ? 'moss' : 'rust' },
              text: report.status === 'RESOLVED' ? 'Selesai' : 'Ditolak',
            })
          : null,
      ]),
      followButton,
    ]),
    el('section', { class: 'card p-5' }, [
      sectionLabel('Riwayat penanganan'),
      el('div', { class: 'mt-5' }, [renderReportTimeline(report.history)]),
    ]),
  ]);

  return el('div', {}, [
    el('article', { class: 'card' }, [
      el('div', { class: 'flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-paper-deep px-5 py-3' }, [
        el('span', { class: 'cell-id', text: report.id }),
        el('span', { class: 'cell-date', text: `ID unik · dibuat ${formatDateTime(report.createdAt)}` }),
      ]),
      el('div', { class: 'grid gap-10 p-5 sm:p-7 lg:grid-cols-[1.3fr_1fr]' }, [left, right]),
    ]),
    el('div', { class: 'mt-8 flex flex-wrap gap-3 border-t border-line pt-6' }, [
      el('a', { class: 'btn btn-ghost', href: 'reports.html', text: 'Kembali ke daftar' }),
      el('a', { class: 'btn btn-quiet', href: 'report.html', text: 'Buat laporan baru' }),
      el('button', { type: 'button', class: 'btn btn-quiet', text: 'Salin tautan', on: { click: copyShareLink } }),
    ]),
  ]);
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    toast('Tautan laporan disalin.', { tone: 'success' });
  } catch {
    toast('Tidak dapat menyalin otomatis. Salin dari bilah alamat browser.', { tone: 'error' });
  }
}

function render() {
  clear(root);
  if (!reportId) {
    root.append(
      renderError(
        'Tautan tidak memuat ID laporan.',
        'Buka detail dari halaman daftar laporan agar ID-nya ikut terbawa pada tautan.',
      ),
    );
    return;
  }
  const report = getReportById(reportId);
  if (!report) {
    root.append(
      renderError(
        `Laporan ${reportId} tidak ditemukan.`,
        'Tautannya mungkin salah, atau data demo sudah direset.',
      ),
    );
    return;
  }
  root.append(renderDetail(report));
}

render();
subscribe(render);

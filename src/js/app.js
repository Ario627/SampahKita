import { el, qs } from './utils/dom.js';
import {
  getSettings,
  isStorageAvailable,
  resetDemoData,
  setMode,
  subscribe,
} from './services/report-store.js';

let toastTotal = 0;

export function initShell() {
  markActiveNav();
  renderModeSwitch();
  mountToastHost();
  mountStorageBanner();
  fillCurrentYear();
  document.addEventListener('click', handleGlobalClick);
  subscribe(renderModeSwitch);
}

function handleGlobalClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const modeButton = target.closest('[data-mode]');
  if (modeButton) {
    applyMode(modeButton.dataset.mode);
    return;
  }
  const resetButton = target.closest('[data-action="reset-demo"]');
  if (resetButton) requestResetDemo();
}

function currentPage() {
  return document.body?.dataset?.page ?? '';
}

function applyMode(mode) {
  setMode(mode);
  if (mode === 'staff' && currentPage() !== 'staff') {
    window.location.href = 'staff.html';
    return;
  }
  if (mode === 'student' && currentPage() === 'staff') {
    window.location.href = 'reports.html';
    return;
  }
  toast(mode === 'staff' ? 'Mode petugas aktif. Ini simulasi, bukan autentikasi.' : 'Mode siswa aktif (simulasi).');
}

function renderModeSwitch() {
  const settings = getSettings();
  const buttons = document.querySelectorAll('[data-mode]');
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === settings.mode));
  }
}

function markActiveNav() {
  const page = currentPage();
  if (!page) return;
  const links = document.querySelectorAll('[data-nav]');
  for (const link of links) {
    if (link.dataset.nav === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

function fillCurrentYear() {
  const nodes = document.querySelectorAll('[data-current-year]');
  const year = String(new Date().getFullYear());
  for (const node of nodes) node.textContent = year;
}

async function requestResetDemo() {
  const confirmed = await confirmDialog({
    title: 'Reset data demo?',
    message:
      'Semua laporan di browser ini akan digantikan data contoh awal. Laporan yang kamu buat akan hilang dan tidak bisa dikembalikan.',
    confirmLabel: 'Ya, reset data',
    tone: 'danger',
  });
  if (!confirmed) return;
  try {
    resetDemoData();
    toast('Data demo dikembalikan ke kondisi awal.', { tone: 'success' });
  } catch {
    toast('Gagal menulis ke penyimpanan browser. Coba kosongkan ruang penyimpanan.', { tone: 'error' });
  }
}

export function toast(message, options = {}) {
  const { tone = 'info', duration = 4600 } = options;
  mountToastHost();
  const host = qs('#toast-host');
  const dismiss = () => node.remove();
  const node = el(
    'div',
    { class: 'toast', dataset: { tone }, attrs: { role: tone === 'error' ? 'alert' : 'status' } },
    [
      el('p', { class: 'toast-message', text: message }),
      el('button', {
        type: 'button',
        class: 'toast-close',
        text: 'Tutup',
        attrs: { 'aria-label': 'Tutup pemberitahuan' },
        on: { click: dismiss },
      }),
    ],
  );
  host.append(node);
  toastTotal += 1;
  if (toastTotal > 3) {
    const first = host.firstElementChild;
    if (first && first !== node) first.remove();
  }
  window.setTimeout(dismiss, duration);
}

function mountToastHost() {
  if (qs('#toast-host')) return;
  document.body.append(el('div', { class: 'toast-host', attrs: { id: 'toast-host', 'aria-live': 'polite' } }));
}

function mountStorageBanner() {
  if (isStorageAvailable()) return;
  const banner = el('div', { class: 'border-b border-rust bg-rust-tint px-5 py-2.5 text-center' }, [
    el('p', {
      class: 'font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] text-rust',
      text: 'Penyimpanan browser tidak tersedia — data tidak akan tersimpan setelah halaman ditutup.',
    }),
  ]);
  document.body.prepend(banner);
}

export function confirmDialog(options = {}) {
  const {
    title = 'Konfirmasi',
    message = '',
    confirmLabel = 'Lanjutkan',
    cancelLabel = 'Batal',
    tone = 'default',
  } = options;
  return new Promise((resolve) => {
    const root = el('dialog', { class: 'dialog' });
    const confirmButton = el('button', {
      type: 'button',
      class: tone === 'danger' ? 'btn btn-danger' : 'btn btn-primary',
      text: confirmLabel,
    });
    const cancelButton = el('button', { type: 'button', class: 'btn btn-ghost', text: cancelLabel });
    let settled = false;
    const close = (value) => {
      if (settled) return;
      settled = true;
      root.close();
      root.remove();
      resolve(value);
    };
    confirmButton.addEventListener('click', () => close(true));
    cancelButton.addEventListener('click', () => close(false));
    root.addEventListener('cancel', (event) => {
      event.preventDefault();
      close(false);
    });
    root.addEventListener('click', (event) => {
      if (event.target === root) close(false);
    });
    root.append(
      el('div', { class: 'p-5 sm:p-6' }, [
        el('p', { class: 'eyebrow', text: tone === 'danger' ? 'Tindakan berbahaya' : 'Konfirmasi' }),
        el('h2', { class: 'mt-2 font-display text-[1.25rem] leading-snug', text: title }),
        el('p', { class: 'mt-3 text-[0.86rem] leading-relaxed text-ink-soft', text: message }),
        el('div', { class: 'mt-6 flex flex-wrap justify-end gap-3' }, [cancelButton, confirmButton]),
      ]),
    );
    document.body.append(root);
    root.showModal();
    if (tone === 'danger') cancelButton.focus();
    else confirmButton.focus();
  });
}

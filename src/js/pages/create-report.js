import { confirmDialog, initShell, toast } from '../app.js';
import { CATEGORIES, LIMITS, LOCATIONS, LOCATION_OTHER } from '../config.js';
import { createReport } from '../services/report-store.js';
import { clear, el, qs, qsa, setHidden } from '../utils/dom.js';
import { formatBytes } from '../utils/format.js';
import { preparePhoto } from '../utils/photo.js';
import { validateReportForm } from '../utils/validation.js';

initShell();

const form = qs('#report-form');
const formPanel = qs('#form-panel');
const successPanel = qs('#success-panel');
const locationSelect = qs('#location');
const customLocationWrap = qs('#custom-location-wrap');
const customLocationInput = qs('#custom-location');
const categoryGroup = qs('#category-group');
const nicknameInput = qs('#nickname');
const titleInput = qs('#title');
const descriptionInput = qs('#description');
const extraNoteInput = qs('#extra-note');
const titleCounter = qs('#title-counter');
const descriptionCounter = qs('#description-counter');
const extraNoteCounter = qs('#extra-note-counter');
const photoInput = qs('#photo-input');
const photoPreview = qs('#photo-preview');
const photoError = qs('#photo-error');
const formSummary = qs('#form-summary');
const summaryList = qs('#form-summary-list');
const submitButton = qs('#submit-button');
const clearButton = qs('#clear-button');
const successId = qs('#success-id');
const successLink = qs('#success-link');
const successAgain = qs('#success-again');

const FIELD_ORDER = ['location', 'customLocation', 'category', 'title', 'description', 'nickname', 'extraNote'];
const FIELD_IDS = {
  location: 'location',
  customLocation: 'custom-location',
  category: 'category-group',
  title: 'title',
  description: 'description',
  nickname: 'nickname',
  extraNote: 'extra-note',
};

let photoPayload = null;
let submitting = false;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildCategoryChips() {
  clear(categoryGroup);
  for (const category of CATEGORIES) {
    const inputId = `category-${slugify(category)}`;
    categoryGroup.append(
      el('label', { class: 'relative block' }, [
        el('input', {
          type: 'radio',
          name: 'category',
          id: inputId,
          value: category,
          class: 'chip-input sr-only',
        }),
        el('span', { class: 'chip w-full justify-center sm:w-auto', text: category }),
      ]),
    );
  }
}

function syncCustomLocation() {
  const isOther = locationSelect.value === LOCATION_OTHER;
  setHidden(customLocationWrap, !isOther);
  if (!isOther) customLocationInput.value = '';
}

function updateCounter(input, counter, max) {
  const length = input.value.trim().length;
  counter.textContent = `${length}/${max}`;
  counter.dataset.warn = String(length > max);
}

function renderPhotoPreview(payload) {
  clear(photoPreview);
  const rows = [
    el('div', { class: 'photo-frame' }, [
      el('img', { src: payload.dataUrl, alt: 'Pratinjau foto laporan', attrs: { loading: 'lazy' } }),
    ]),
    el('div', { class: 'mt-3 flex flex-wrap items-center justify-between gap-3' }, [
      el('div', { class: 'min-w-0' }, [
        el('p', { class: 'truncate font-mono text-[0.66rem] font-bold text-ink', text: payload.name, attrs: { title: payload.name } }),
        el('p', { class: 'hint mt-1' }, [
          `${payload.width}×${payload.height} px · ${formatBytes(payload.bytes)} tersimpan`,
        ]),
      ]),
      el('button', {
        type: 'button',
        class: 'btn btn-ghost btn-sm',
        text: 'Hapus foto',
        on: { click: removePhoto },
      }),
    ]),
  ];
  if (payload.originalBytes > payload.bytes) {
    rows.splice(
      1,
      0,
      el('p', {
        class: 'hint mt-2',
        text: `Diperkecil otomatis dari ${formatBytes(payload.originalBytes)} agar muat penyimpanan browser.`,
      }),
    );
  }
  for (const row of rows) photoPreview.append(row);
  photoPreview.hidden = false;
}

function removePhoto() {
  photoPayload = null;
  photoInput.value = '';
  clear(photoPreview);
  photoPreview.hidden = true;
  setHidden(photoError, true);
}

function showPhotoError(message) {
  photoError.textContent = message;
  setHidden(photoError, false);
}

function clearFieldErrors() {
  setHidden(formSummary, true);
  clear(summaryList);
  for (const id of Object.values(FIELD_IDS)) {
    const node = qs(`#${id}`);
    if (node) node.removeAttribute('aria-invalid');
  }
  for (const error of qsa('.field-error')) setHidden(error, true);
}

function renderFieldErrors(errors) {
  for (const [field, message] of Object.entries(errors)) {
    const errorNode = qs(`#${field}-error`);
    if (errorNode) {
      errorNode.textContent = message;
      setHidden(errorNode, false);
    }
    const inputNode = qs(`#${FIELD_IDS[field] ?? field}`);
    if (inputNode) inputNode.setAttribute('aria-invalid', 'true');
  }
  clear(summaryList);
  for (const field of FIELD_ORDER) {
    if (!errors[field]) continue;
    summaryList.append(
      el('li', {}, [
        el('a', {
          class: 'underline decoration-rust decoration-2 underline-offset-2',
          href: `#${FIELD_IDS[field]}`,
          text: errors[field],
          on: { click: () => focusField(field) },
        }),
      ]),
    );
  }
  setHidden(formSummary, false);
}

function focusField(field) {
  if (field === 'category') {
    const first = qs('input[name="category"]', categoryGroup);
    if (first) first.focus();
    return;
  }
  const node = qs(`#${FIELD_IDS[field] ?? field}`);
  if (node) node.focus();
}

function focusFirstError(errors) {
  const first = FIELD_ORDER.find((field) => errors[field]);
  if (first) focusField(first);
}

function collectFormData() {
  const checkedCategory = qs('input[name="category"]:checked', categoryGroup);
  return {
    nickname: nicknameInput.value,
    location: locationSelect.value,
    customLocation: locationSelect.value === LOCATION_OTHER ? customLocationInput.value : '',
    category: checkedCategory ? checkedCategory.value : '',
    title: titleInput.value,
    description: descriptionInput.value,
    extraNote: extraNoteInput.value,
  };
}

function isFormDirty() {
  const data = collectFormData();
  const filled = Object.values(data).some((value) => String(value).trim().length > 0);
  return filled || Boolean(photoPayload);
}

function resetForm() {
  form.reset();
  removePhoto();
  clearFieldErrors();
  syncCustomLocation();
  updateCounter(titleInput, titleCounter, LIMITS.title.max);
  updateCounter(descriptionInput, descriptionCounter, LIMITS.description.max);
  updateCounter(extraNoteInput, extraNoteCounter, LIMITS.extraNote.max);
}

function showSuccess(report) {
  setHidden(formPanel, true);
  setHidden(successPanel, false);
  successId.textContent = report.id;
  successLink.href = `report-detail.html?id=${encodeURIComponent(report.id)}`;
  successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToForm() {
  resetForm();
  setHidden(successPanel, true);
  setHidden(formPanel, false);
  locationSelect.focus();
}

function handleCreateError(error) {
  if (error.message === 'STORAGE_FAILED' && photoPayload) {
    clear(summaryList);
    summaryList.append(
      el('li', {}, [
        'Penyimpanan browser penuh sehingga foto tidak muat disimpan. ',
        el('button', {
          type: 'button',
          class: 'underline decoration-rust decoration-2 underline-offset-2',
          text: 'Kirim ulang tanpa foto',
          on: {
            click: () => {
              removePhoto();
              form.requestSubmit();
            },
          },
        }),
      ]),
    );
    formSummary.hidden = false;
    formSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Penyimpanan penuh. Coba kirim tanpa foto atau hapus laporan lama.', { tone: 'error' });
    return;
  }
  const message =
    error.message === 'STORAGE_FAILED'
      ? 'Gagal menyimpan ke penyimpanan browser. Ruang mungkin penuh atau diblokir.'
      : 'Terjadi kendala saat menyimpan laporan. Coba lagi.';
  toast(message, { tone: 'error' });
}

for (const location of LOCATIONS) locationSelect.append(el('option', { value: location, text: location }));
buildCategoryChips();
syncCustomLocation();
updateCounter(titleInput, titleCounter, LIMITS.title.max);
updateCounter(descriptionInput, descriptionCounter, LIMITS.description.max);
updateCounter(extraNoteInput, extraNoteCounter, LIMITS.extraNote.max);

locationSelect.addEventListener('change', () => {
  syncCustomLocation();
  if (locationSelect.value === LOCATION_OTHER) customLocationInput.focus();
});

titleInput.addEventListener('input', () => updateCounter(titleInput, titleCounter, LIMITS.title.max));
descriptionInput.addEventListener('input', () =>
  updateCounter(descriptionInput, descriptionCounter, LIMITS.description.max),
);
extraNoteInput.addEventListener('input', () =>
  updateCounter(extraNoteInput, extraNoteCounter, LIMITS.extraNote.max),
);

photoInput.addEventListener('change', async () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  setHidden(photoError, true);
  photoPreview.hidden = false;
  clear(photoPreview);
  photoPreview.append(el('p', { class: 'hint', text: 'Memproses foto…' }));
  try {
    const payload = await preparePhoto(file);
    photoPayload = payload;
    renderPhotoPreview(payload);
  } catch (error) {
    photoPayload = null;
    photoInput.value = '';
    photoPreview.hidden = true;
    showPhotoError(error.message);
  }
});

clearButton.addEventListener('click', async () => {
  if (!isFormDirty()) {
    resetForm();
    return;
  }
  const confirmed = await confirmDialog({
    title: 'Bersihkan formulir?',
    message: 'Semua isian dan foto yang belum dikirim akan dihapus dari formulir ini.',
    confirmLabel: 'Ya, bersihkan',
  });
  if (confirmed) resetForm();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (submitting) return;
  const candidate = collectFormData();
  const { valid, errors, values } = validateReportForm(candidate);
  clearFieldErrors();
  if (!valid) {
    renderFieldErrors(errors);
    focusFirstError(errors);
    toast('Beberapa isian perlu diperbaiki sebelum laporan dikirim.', { tone: 'error' });
    return;
  }
  submitting = true;
  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitButton.textContent = 'Menyimpan…';
  try {
    const report = createReport({
      ...values,
      reporterName: values.nickname,
      photoDataUrl: photoPayload ? photoPayload.dataUrl : '',
    });
    showSuccess(report);
    toast(`Laporan ${report.id} tersimpan di browser ini.`, { tone: 'success' });
  } catch (error) {
    handleCreateError(error);
  } finally {
    submitting = false;
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.textContent = 'Kirim laporan';
  }
});

successAgain.addEventListener('click', backToForm);

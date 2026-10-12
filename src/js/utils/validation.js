import { CATEGORIES, LIMITS, LOCATIONS, LOCATION_OTHER, PHOTO_TYPES } from '../config.js';
import { formatBytes } from './format.js';

export function validateReportForm(data = {}) {
  const values = {
    nickname: String(data.nickname ?? '').trim(),
    location: String(data.location ?? ''),
    customLocation: String(data.customLocation ?? '').trim(),
    category: String(data.category ?? ''),
    title: String(data.title ?? '').trim(),
    description: String(data.description ?? '').trim(),
    extraNote: String(data.extraNote ?? '').trim(),
  };
  const errors = {};

  if (!values.location) errors.location = 'Pilih lokasi kejadian.';
  else if (!LOCATIONS.includes(values.location)) errors.location = 'Lokasi tidak dikenali.';
  else if (values.location === LOCATION_OTHER && values.customLocation.length < 3) {
    errors.customLocation = 'Tulis nama lokasi minimal 3 karakter.';
  }

  if (!values.category) errors.category = 'Pilih kategori masalah.';
  else if (!CATEGORIES.includes(values.category)) errors.category = 'Kategori tidak dikenali.';

  if (values.title.length < LIMITS.title.min) errors.title = `Judul minimal ${LIMITS.title.min} karakter.`;
  else if (values.title.length > LIMITS.title.max) errors.title = `Judul maksimal ${LIMITS.title.max} karakter.`;

  if (values.description.length < LIMITS.description.min) {
    errors.description = `Deskripsi minimal ${LIMITS.description.min} karakter.`;
  } else if (values.description.length > LIMITS.description.max) {
    errors.description = `Deskripsi maksimal ${LIMITS.description.max} karakter.`;
  }

  if (values.nickname.length > LIMITS.nickname.max) {
    errors.nickname = `Nama panggilan maksimal ${LIMITS.nickname.max} karakter.`;
  }

  if (values.extraNote.length > LIMITS.extraNote.max) {
    errors.extraNote = `Catatan tambahan maksimal ${LIMITS.extraNote.max} karakter.`;
  }

  return { valid: Object.keys(errors).length === 0, errors, values };
}

export function validatePhotoFile(file) {
  if (!(file instanceof File)) return { ok: false, error: 'Berkas tidak dikenali.' };
  if (!PHOTO_TYPES.includes(file.type)) {
    return { ok: false, error: 'Hanya berkas gambar JPG, PNG, atau WebP.' };
  }
  if (file.size > LIMITS.photo.maxBytes) {
    return {
      ok: false,
      error: `Ukuran foto ${formatBytes(file.size)} melebihi batas ${formatBytes(LIMITS.photo.maxBytes)}.`,
    };
  }
  return { ok: true, error: '' };
}

export function validateStaffNote(text, options = {}) {
  const { required = false, min = 0, label = 'Catatan', max = LIMITS.staffNote.max } = options;
  const value = String(text ?? '').trim();
  if (required && value.length < Math.max(min, 1)) {
    const minimum = Math.max(min, 1);
    return { ok: false, value, error: `${label} wajib diisi minimal ${minimum} karakter.` };
  }
  if (value.length > max) {
    return { ok: false, value, error: `${label} maksimal ${max} karakter.` };
  }
  return { ok: true, value, error: '' };
}

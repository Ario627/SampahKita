const WIB_OFFSET_MINUTES = 420;
const TIME_ZONE = 'Asia/Jakarta';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TIME_ZONE,
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function toWibIso(date) {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MINUTES * 60000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}+07:00`;
}

export function nowISO() {
  return toWibIso(new Date());
}

export function isoFromNow(offset = {}) {
  const { days = 0, hours = 0, minutes = 0 } = offset;
  const totalMinutes = (days * 24 + hours) * 60 + minutes;
  return toWibIso(new Date(Date.now() - totalMinutes * 60000));
}

export function getWibYear() {
  return new Date(Date.now() + WIB_OFFSET_MINUTES * 60000).getUTCFullYear();
}

export function isValidDateString(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

export function formatDate(value) {
  if (!isValidDateString(value)) return 'Tanggal tidak valid';
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value) {
  if (!isValidDateString(value)) return 'Tanggal tidak valid';
  return dateTimeFormatter.format(new Date(value));
}

export function relativeTime(value) {
  if (!isValidDateString(value)) return 'Tanggal tidak valid';
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60000) return 'baru saja';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'kemarin';
  if (days < 7) return `${days} hari lalu`;
  return formatDate(value);
}

export function daysSince(value) {
  if (!isValidDateString(value)) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${numberFormatter.format(Math.max(1, Math.round(bytes / 1024)))} KB`;
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
}

import { LIMITS } from '../config.js';
import { validatePhotoFile } from './validation.js';

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Foto tidak bisa dibaca. Coba berkas lain.'));
    };
    image.src = url;
  });
}

function drawToDataUrl(image, maxEdge, quality) {
  const width = image.naturalWidth || 1;
  const height = image.naturalHeight || 1;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { dataUrl, width: targetWidth, height: targetHeight };
}

export function estimateDataUrlBytes(dataUrl) {
  const base64 = typeof dataUrl === 'string' ? dataUrl.split(',')[1] ?? '' : '';
  return Math.round((base64.length * 3) / 4);
}

export async function preparePhoto(file) {
  const check = validatePhotoFile(file);
  if (!check.ok) throw new Error(check.error);
  const image = await loadImage(file);
  const attempts = [
    { edge: LIMITS.photo.maxEdge, quality: LIMITS.photo.quality },
    { edge: 1024, quality: 0.66 },
    { edge: 840, quality: 0.58 },
  ];
  let result = null;
  for (const attempt of attempts) {
    result = drawToDataUrl(image, attempt.edge, attempt.quality);
    if (result.dataUrl.length <= LIMITS.photo.targetChars) break;
  }
  return {
    dataUrl: result.dataUrl,
    width: result.width,
    height: result.height,
    bytes: estimateDataUrlBytes(result.dataUrl),
    originalBytes: file.size,
    name: file.name,
  };
}

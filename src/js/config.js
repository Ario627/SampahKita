export const APP = {
  name: 'SampahKita',
  tagline: 'Log kebersihan sekolah',
  version: '1.0.0',
};

export const STORAGE_KEYS = {
  reports: 'sampahkita.reports.v1',
  settings: 'sampahkita.settings.v1',
  corruptSuffix: '.corrupt',
};

export const LOCATIONS = [
  'Area kelas',
  'Koridor',
  'Halaman sekolah',
  'Kantin',
  'Lapangan',
  'Toilet',
  'Tempat parkir',
  'Area tempat sampah',
  'Lainnya',
];

export const LOCATION_OTHER = 'Lainnya';

export const CATEGORIES = [
  'Sampah menumpuk',
  'Tempat sampah penuh',
  'Sampah berserakan',
  'Sampah tidak dipilah',
  'Bau tidak sedap',
  'Lainnya',
];

export const CATEGORY_OTHER = 'Lainnya';

export const LIMITS = {
  nickname: { max: 40 },
  title: { min: 5, max: 80 },
  description: { min: 10, max: 500 },
  extraNote: { max: 200 },
  staffNote: { max: 300 },
  rejectionReason: { min: 10, max: 300 },
  photo: {
    maxBytes: 3 * 1024 * 1024,
    maxEdge: 1280,
    quality: 0.72,
    targetChars: 1800000,
  },
};

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

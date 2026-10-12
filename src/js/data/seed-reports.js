import { getWibYear, isoFromNow } from '../utils/dates.js';

const YEAR = getWibYear();

function makeId(index) {
  return `SK-${YEAR}-${String(index).padStart(3, '0')}`;
}

function build(seed) {
  const id = makeId(seed.index);
  const createdAt = isoFromNow(seed.created);
  const updatedAt = isoFromNow(seed.updated);
  return {
    id,
    title: seed.title,
    description: seed.description,
    location: seed.location,
    customLocation: seed.customLocation ?? '',
    category: seed.category,
    photoDataUrl: '',
    reporterName: seed.reporterName ?? '',
    status: seed.status,
    priority: seed.priority,
    createdAt,
    updatedAt,
    staffNote: seed.staffNote ?? '',
    rejectionReason: seed.rejectionReason ?? '',
    extraNote: seed.extraNote ?? '',
    history: seed.history.map((entry, position) => ({
      id: `H-${id}-${position + 1}`,
      status: entry.status,
      note: entry.note,
      changedAt: isoFromNow(entry.ago),
      actor: entry.actor,
    })),
  };
}

const SEEDS = [
  {
    index: 1,
    created: { hours: 6 },
    updated: { hours: 6 },
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    title: 'Tempat sampah kantin penuh sejak pagi',
    description:
      'Tempat sampah di dekat kantin sudah penuh dan beberapa bungkus makanan mulai menumpuk di atasnya. Kondisinya seperti ini sejak sebelum jam istirahat pertama.',
    location: 'Kantin',
    category: 'Tempat sampah penuh',
    reporterName: 'Rani',
    history: [{ status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 6 } }],
  },
  {
    index: 2,
    created: { hours: 27 },
    updated: { hours: 27 },
    status: 'SUBMITTED',
    priority: 'HIGH',
    title: 'Tumpukan kantong sampah di sudut halaman',
    description:
      'Ada sekitar enam kantong sampah menumpuk di sudut halaman dekat pagar. Sebagian kantong sudah robek dan isinya mulai berserakan tertiup angin.',
    location: 'Halaman sekolah',
    category: 'Sampah menumpuk',
    reporterName: 'Dimas',
    history: [{ status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 27 } }],
  },
  {
    index: 3,
    created: { hours: 76 },
    updated: { hours: 21 },
    status: 'REVIEWED',
    priority: 'MEDIUM',
    title: 'Sampah kelas tidak dipilah selama sepekan',
    description:
      'Sampah dari kelas kami tercampur antara plastik, kertas, dan sisa makanan. Pemilahan tidak berjalan sejak pekan lalu karena tidak ada tempat terpisah.',
    location: 'Area kelas',
    category: 'Sampah tidak dipilah',
    reporterName: 'Sari',
    staffNote: 'Sudah ditinjau. Petugas akan mengecek jadwal pemilahan dan ketersediaan tempat terpisah.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 76 } },
      {
        status: 'REVIEWED',
        note: 'Laporan ditinjau dan menunggu penjadwalan.',
        actor: 'PETUGAS',
        ago: { hours: 21 },
      },
    ],
  },
  {
    index: 4,
    created: { hours: 98 },
    updated: { hours: 50 },
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    title: 'Bau tidak sedap dari saluran dekat toilet',
    description:
      'Bau tidak sedap menyengat dari saluran air di samping toilet. Muncul terutama saat siang hari dan tercium sampai ke koridor terdekat.',
    location: 'Toilet',
    category: 'Bau tidak sedap',
    reporterName: 'Bagas',
    staffNote:
      'Pembersihan saluran dan penyemprotan sudah dijadwalkan pagi ini. Menunggu konfirmasi petugas jadwal.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 98 } },
      {
        status: 'REVIEWED',
        note: 'Laporan ditinjau, prioritas dinaikkan karena mengganggu area belajar.',
        actor: 'PETUGAS',
        ago: { hours: 90 },
      },
      { status: 'IN_PROGRESS', note: 'Penanganan dijadwalkan pagi ini.', actor: 'PETUGAS', ago: { hours: 50 } },
    ],
  },
  {
    index: 5,
    created: { hours: 122 },
    updated: { hours: 74 },
    status: 'IN_PROGRESS',
    priority: 'LOW',
    title: 'Sampah berserakan setelah kegiatan lapangan',
    description:
      'Setelah kegiatan olahraga, banyak cup minuman dan plastik berserakan di pinggir lapangan. Tidak ada tempat sampah dalam jarak dekat.',
    location: 'Lapangan',
    category: 'Sampah berserakan',
    reporterName: '',
    staffNote:
      'Penyisiran area lapangan masuk jadwal rutin berikutnya. Pertimbangan penambahan tempat sampah akan dibahas.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 122 } },
      {
        status: 'REVIEWED',
        note: 'Ditinjau, prioritas rendah karena tidak mengganggu aktivitas.',
        actor: 'PETUGAS',
        ago: { hours: 114 },
      },
      { status: 'IN_PROGRESS', note: 'Masuk daftar penanganan rutin.', actor: 'PETUGAS', ago: { hours: 74 } },
    ],
  },
  {
    index: 6,
    created: { hours: 190 },
    updated: { hours: 144 },
    status: 'RESOLVED',
    priority: 'MEDIUM',
    title: 'Tempat sampah koridor lantai dua meluap',
    description:
      'Tempat sampah di koridor lantai dua sudah meluap sampai ke lantai. Bau mulai muncul dan jalur koridor jadi sedikit terganggu.',
    location: 'Koridor',
    category: 'Tempat sampah penuh',
    reporterName: 'Nadia',
    staffNote: 'Tempat sampah sudah diganti dan area dibersihkan. Mohon dicek kembali bila kondisi terulang.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 190 } },
      { status: 'REVIEWED', note: 'Ditinjau, penanganan dijadwalkan.', actor: 'PETUGAS', ago: { hours: 180 } },
      {
        status: 'IN_PROGRESS',
        note: 'Penggantian tempat sampah diproses.',
        actor: 'PETUGAS',
        ago: { hours: 168 },
      },
      {
        status: 'RESOLVED',
        note: 'Selesai ditangani. Tempat sampah baru sudah terpasang.',
        actor: 'PETUGAS',
        ago: { hours: 144 },
      },
    ],
  },
  {
    index: 7,
    created: { hours: 240 },
    updated: { hours: 168 },
    status: 'RESOLVED',
    priority: 'HIGH',
    title: 'Tumpukan sampah di belakang area tempat sampah',
    description:
      'Sampah menumpuk di belakang deretan tempat sampah sampai mengenai dinding gudang. Sebagian sudah dibawa hewan dan berserakan.',
    location: 'Area tempat sampah',
    category: 'Sampah menumpuk',
    reporterName: 'Fajar',
    staffNote: 'Sampah diangkut ke TPS dan area disemprot. Selesai.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 240 } },
      {
        status: 'REVIEWED',
        note: 'Ditinjau dan diprioritaskan tinggi karena berdekatan dengan gudang.',
        actor: 'PETUGAS',
        ago: { hours: 235 },
      },
      {
        status: 'IN_PROGRESS',
        note: 'Pengangkutan ke TPS dijadwalkan.',
        actor: 'PETUGAS',
        ago: { hours: 200 },
      },
      {
        status: 'RESOLVED',
        note: 'Pengangkutan selesai, area sudah disemprot.',
        actor: 'PETUGAS',
        ago: { hours: 168 },
      },
    ],
  },
  {
    index: 8,
    created: { hours: 214 },
    updated: { hours: 192 },
    status: 'REJECTED',
    priority: 'LOW',
    title: 'Sampah di trotoar seberang gerbang',
    description:
      'Trotoar di seberang gerbang sekolah penuh dedaunan dan kemasan plastik. Terlihat setiap pagi saat jam berangkat.',
    location: 'Lainnya',
    customLocation: 'Trotoar seberang gerbang sekolah',
    category: 'Lainnya',
    reporterName: 'Intan',
    rejectionReason:
      'Lokasi berada di luar lingkungan sekolah dan bukan area yang dikelola pihak sekolah. Silakan laporkan ke pengelola jalan setempat.',
    history: [
      { status: 'SUBMITTED', note: 'Laporan dibuat.', actor: 'SYSTEM', ago: { hours: 214 } },
      {
        status: 'REJECTED',
        note: 'Lokasi di luar area sekolah sehingga tidak dapat ditindaklanjuti.',
        actor: 'PETUGAS',
        ago: { hours: 192 },
      },
    ],
  },
];

export function createSeedReports() {
  return SEEDS.map(build);
}

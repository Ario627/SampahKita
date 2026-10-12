export const STATUS = {
  SUBMITTED: {
    value: 'SUBMITTED',
    label: 'Baru Dilaporkan',
    description: 'Laporan tersimpan dan menunggu peninjauan petugas.',
  },
  REVIEWED: {
    value: 'REVIEWED',
    label: 'Telah Ditinjau',
    description: 'Petugas sudah membaca laporan dan menilai kelanjutannya.',
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: 'Sedang Ditangani',
    description: 'Penanganan di lokasi sedang berjalan.',
  },
  RESOLVED: {
    value: 'RESOLVED',
    label: 'Selesai',
    description: 'Masalah sudah ditangani dan laporan ditutup.',
  },
  REJECTED: {
    value: 'REJECTED',
    label: 'Tidak Dapat Ditindaklanjuti',
    description: 'Laporan tidak dapat diproses. Alasan penolakan selalu ditampilkan.',
  },
};

export const STATUS_ORDER = ['SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export const TRANSITIONS = {
  SUBMITTED: ['REVIEWED', 'REJECTED'],
  REVIEWED: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['IN_PROGRESS'],
  REJECTED: [],
};

export function canTransition(from, to) {
  const allowed = TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

export function nextStatuses(from) {
  const allowed = TRANSITIONS[from];
  return Array.isArray(allowed) ? [...allowed] : [];
}

export function statusLabel(value) {
  return STATUS[value]?.label ?? 'Status tidak dikenal';
}

export const PRIORITY = {
  LOW: { value: 'LOW', label: 'Rendah' },
  MEDIUM: { value: 'MEDIUM', label: 'Sedang' },
  HIGH: { value: 'HIGH', label: 'Tinggi' },
};

export const PRIORITY_ORDER = ['LOW', 'MEDIUM', 'HIGH'];

export function priorityLabel(value) {
  return PRIORITY[value]?.label ?? 'Sedang';
}

export function calculateDashboardStats(reports = []) {
  const byStatus = Object.fromEntries(STATUS_ORDER.map((status) => [status, 0]));
  let highPriority = 0;
  for (const report of reports) {
    if (!report) continue;
    const status = STATUS[report.status] ? report.status : 'SUBMITTED';
    byStatus[status] += 1;
    if (report.priority === 'HIGH') highPriority += 1;
  }
  const needsAttention = byStatus.SUBMITTED + byStatus.REVIEWED + byStatus.IN_PROGRESS;
  return {
    total: reports.length,
    byStatus,
    highPriority,
    needsAttention,
    resolved: byStatus.RESOLVED,
  };
}

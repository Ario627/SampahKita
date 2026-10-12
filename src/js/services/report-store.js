import { LIMITS, STORAGE_KEYS } from '../config.js';
import { createSeedReports } from '../data/seed-reports.js';
import { nowISO } from '../utils/dates.js';
import { historyEntryId, nextReportId } from '../utils/ids.js';
import { PRIORITY, STATUS, canTransition } from '../utils/status.js';

const listeners = new Set();

export function isStorageAvailable() {
  try {
    const probe = '__sampahkita_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readKey(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function parseReports() {
  const raw = readKey(STORAGE_KEYS.reports);
  if (raw === null) return { missing: true, corrupt: false, value: null };
  try {
    return { missing: false, corrupt: false, value: JSON.parse(raw) };
  } catch {
    try {
      window.localStorage.setItem(STORAGE_KEYS.reports + STORAGE_KEYS.corruptSuffix, raw);
    } catch {
      return { missing: false, corrupt: true, value: null };
    }
    return { missing: false, corrupt: true, value: null };
  }
}

function sanitizeHistory(report, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [
      {
        id: historyEntryId(report.id, 1),
        status: report.status,
        note: 'Laporan dibuat.',
        changedAt: report.createdAt,
        actor: 'SYSTEM',
      },
    ];
  }
  return entries
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, index) => ({
      id: typeof entry.id === 'string' && entry.id ? entry.id : historyEntryId(report.id, index + 1),
      status: STATUS[entry.status] ? entry.status : report.status,
      note: typeof entry.note === 'string' ? entry.note : '',
      changedAt: typeof entry.changedAt === 'string' ? entry.changedAt : report.createdAt,
      actor: entry.actor === 'PETUGAS' ? 'PETUGAS' : 'SYSTEM',
    }))
    .sort((a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime());
}

function sanitizeReport(report) {
  if (!report || typeof report !== 'object') return null;
  if (typeof report.id !== 'string' || !report.id.trim()) return null;
  if (typeof report.title !== 'string' || !report.title.trim()) return null;
  const createdAt = typeof report.createdAt === 'string' ? report.createdAt : nowISO();
  const clean = {
    id: report.id,
    title: report.title.trim(),
    description: typeof report.description === 'string' ? report.description : '',
    location: typeof report.location === 'string' ? report.location : '',
    customLocation: typeof report.customLocation === 'string' ? report.customLocation : '',
    category: typeof report.category === 'string' ? report.category : '',
    photoDataUrl: typeof report.photoDataUrl === 'string' ? report.photoDataUrl : '',
    reporterName: typeof report.reporterName === 'string' ? report.reporterName : '',
    status: STATUS[report.status] ? report.status : 'SUBMITTED',
    priority: PRIORITY[report.priority] ? report.priority : 'MEDIUM',
    createdAt,
    updatedAt: typeof report.updatedAt === 'string' ? report.updatedAt : createdAt,
    staffNote: typeof report.staffNote === 'string' ? report.staffNote : '',
    rejectionReason: typeof report.rejectionReason === 'string' ? report.rejectionReason : '',
    extraNote: typeof report.extraNote === 'string' ? report.extraNote : '',
  };
  clean.history = sanitizeHistory(clean, report.history);
  return clean;
}

function ensureSeeded() {
  const parsed = parseReports();
  if (!parsed.corrupt && !parsed.missing && Array.isArray(parsed.value)) {
    return parsed.value.map(sanitizeReport).filter(Boolean);
  }
  const seeded = createSeedReports();
  writeKey(STORAGE_KEYS.reports, seeded);
  return seeded;
}

function emit() {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      continue;
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === STORAGE_KEYS.reports || event.key === STORAGE_KEYS.settings) emit();
  });
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getReports() {
  return ensureSeeded();
}

export function saveReports(reports) {
  const ok = writeKey(STORAGE_KEYS.reports, reports);
  if (ok) emit();
  return ok;
}

export function getReportById(id) {
  if (!id) return null;
  return getReports().find((report) => report.id === id) ?? null;
}

export function createReport(payload = {}) {
  const reports = getReports();
  const id = nextReportId(reports);
  const timestamp = nowISO();
  const report = {
    id,
    title: String(payload.title ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    location: String(payload.location ?? '').trim(),
    customLocation: String(payload.customLocation ?? '').trim(),
    category: String(payload.category ?? '').trim(),
    photoDataUrl: typeof payload.photoDataUrl === 'string' ? payload.photoDataUrl : '',
    reporterName: String(payload.reporterName ?? '').trim(),
    extraNote: String(payload.extraNote ?? '').trim(),
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    createdAt: timestamp,
    updatedAt: timestamp,
    staffNote: '',
    rejectionReason: '',
    history: [
      {
        id: historyEntryId(id, 1),
        status: 'SUBMITTED',
        note: 'Laporan dibuat.',
        changedAt: timestamp,
        actor: 'SYSTEM',
      },
    ],
  };
  if (!report.title || !report.location || !report.category) throw new Error('INVALID_DATA');
  const next = [...reports, report];
  if (!saveReports(next)) throw new Error('STORAGE_FAILED');
  return report;
}

export function applyStaffUpdate(id, changes = {}) {
  const reports = getReports();
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) throw new Error('NOT_FOUND');
  const report = reports[index];

  if (changes.priority !== undefined && !PRIORITY[changes.priority]) throw new Error('INVALID_PRIORITY');
  if (changes.status !== undefined && !STATUS[changes.status]) throw new Error('INVALID_TRANSITION');

  const targetStatus = STATUS[changes.status] ? changes.status : report.status;
  const targetPriority = PRIORITY[changes.priority] ? changes.priority : report.priority;
  const note = typeof changes.note === 'string' ? changes.note.trim() : '';
  const statusChanged = targetStatus !== report.status;
  const priorityChanged = targetPriority !== report.priority;
  const hasNote = note.length > 0;

  if (!statusChanged && !priorityChanged && !hasNote) throw new Error('NO_CHANGES');
  if (statusChanged && !canTransition(report.status, targetStatus)) throw new Error('INVALID_TRANSITION');
  if (statusChanged && targetStatus === 'REJECTED' && note.length < LIMITS.rejectionReason.min) {
    throw new Error('REASON_REQUIRED');
  }
  if (statusChanged && report.status === 'RESOLVED' && targetStatus === 'IN_PROGRESS' && !hasNote) {
    throw new Error('REOPEN_NOTE_REQUIRED');
  }
  if (hasNote && note.length > LIMITS.staffNote.max) throw new Error('NOTE_TOO_LONG');

  const timestamp = nowISO();
  const parts = [];
  if (statusChanged) parts.push(`Status diubah ke ${STATUS[targetStatus].label}.`);
  if (priorityChanged) parts.push(`Prioritas diubah ke ${PRIORITY[targetPriority].label}.`);
  const entry = {
    id: historyEntryId(report.id, report.history.length + 1),
    status: targetStatus,
    note: hasNote ? note : parts.join(' ') || 'Pembaruan oleh petugas.',
    changedAt: timestamp,
    actor: 'PETUGAS',
  };
  const updated = {
    ...report,
    status: targetStatus,
    priority: targetPriority,
    staffNote: hasNote ? note : report.staffNote,
    rejectionReason: targetStatus === 'REJECTED' ? note : report.rejectionReason,
    updatedAt: timestamp,
    history: [...report.history, entry],
  };
  const next = [...reports];
  next[index] = updated;
  if (!saveReports(next)) throw new Error('STORAGE_FAILED');
  return updated;
}

export function updateReportStatus(id, status, note = '') {
  return applyStaffUpdate(id, { status, note });
}

export function updateReportPriority(id, priority) {
  return applyStaffUpdate(id, { priority });
}

export function resetDemoData() {
  const seeded = createSeedReports();
  if (!writeKey(STORAGE_KEYS.reports, seeded)) throw new Error('STORAGE_FAILED');
  emit();
  return seeded;
}

export function clearAllReports() {
  if (!writeKey(STORAGE_KEYS.reports, [])) throw new Error('STORAGE_FAILED');
  emit();
  return [];
}

export function getSettings() {
  const fallback = { mode: 'student', followed: [] };
  const raw = readKey(STORAGE_KEYS.settings);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return {
      mode: parsed.mode === 'staff' ? 'staff' : 'student',
      followed: Array.isArray(parsed.followed)
        ? parsed.followed.filter((value) => typeof value === 'string')
        : [],
    };
  } catch {
    return fallback;
  }
}

function saveSettings(settings) {
  writeKey(STORAGE_KEYS.settings, settings);
  emit();
  return settings;
}

export function setMode(mode) {
  return saveSettings({ ...getSettings(), mode: mode === 'staff' ? 'staff' : 'student' });
}

export function getFollowedIds() {
  return getSettings().followed;
}

export function isFollowed(id) {
  return getFollowedIds().includes(id);
}

export function toggleFollow(id) {
  const settings = getSettings();
  const followed = new Set(settings.followed);
  if (followed.has(id)) followed.delete(id);
  else followed.add(id);
  saveSettings({ ...settings, followed: [...followed] });
  return followed.has(id);
}

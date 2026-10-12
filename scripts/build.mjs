import { cp, mkdir, rm } from 'node:fs/promises';

const OUT_DIR = 'dist';
const ENTRIES = [
  'index.html',
  'report.html',
  'reports.html',
  'report-detail.html',
  'staff.html',
  'src/assets',
  'src/js',
  'src/css/output.css',
];

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

for (const entry of ENTRIES) {
  await cp(entry, `${OUT_DIR}/${entry}`, { recursive: true });
}

console.log(`Build deploy siap: ${ENTRIES.length} entri disalin ke ${OUT_DIR}/`);

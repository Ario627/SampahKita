# SampahKita

Aplikasi web statis untuk **pelaporan dan pemantauan penanganan sampah di lingkungan sekolah**. Siswa melaporkan masalah kebersihan, petugas meninjau dan memperbarui status penanganan, dan pelapor dapat memantau perkembangannya lewat status serta riwayat laporan.

> **Penting — ini prototipe simulasi.**
> Tidak ada backend, database server, autentikasi, maupun sinkronisasi antarperangkat. Semua data disimpan di `localStorage` browser yang sama. Laporan **tidak terkirim ke petugas sungguhan**, dan pemilih mode petugas hanyalah simulasi antarmuka, bukan kontrol keamanan.

## Fitur

**Siswa**

- Beranda dengan ringkasan laporan, papan pantau distribusi status, sebaran per area, kategori terbanyak, dan tren 7 hari
- Form laporan: lokasi, kategori, judul, deskripsi, foto opsional, catatan tambahan
- Validasi ramah pengguna: error di dekat field, ringkasan error, autofokus ke field bermasalah, pencegahan submit ganda
- Preview foto dengan pengecilan otomatis agar muat penyimpanan browser
- Daftar laporan dengan pencarian (ID, judul, lokasi, kategori), filter status/kategori, dan sorting
- Pantau laporan: tandai laporan untuk diikuti, lalu filter "Dipantau" di daftar
- Detail laporan: status, catatan petugas, alasan penolakan, foto (dengan lightbox), timeline riwayat, dan tombol salin tautan

**Petugas (simulasi)**

- Dashboard dengan statistik dinamis dari data (bukan angka hardcoded)
- Pencarian, filter status/kategori/prioritas, dan sorting terbaru/terlama/prioritas/terakhir diperbarui
- Kartu "Prioritas tinggi" berfungsi sebagai filter cepat
- Indikator "menganggur N hari" pada laporan terbuka yang lama tidak diperbarui
- Panel kelola: ubah status lewat transisi valid, tetapkan prioritas, tulis catatan tindak lanjut
- Penolakan laporan wajib disertai alasan dan dikonfirmasi lewat dialog
- Membuka kembali laporan selesai adalah aksi eksplisit dengan catatan wajib
- Ekspor CSV sesuai filter yang sedang aktif
- Setiap perubahan memperbarui timestamp, menambah riwayat, dan menyegarkan statistik

## Menjalankan proyek

Butuh **Node.js 18+** (untuk build Tailwind) dan server statis sederhana. Aplikasi memakai ES modules, jadi **jangan** dibuka lewat `file://` — gunakan server lokal.

```bash
npm install        # pasang Tailwind CSS + CLI (devDependency)
npm run build      # kompilasi src/css/input.css -> src/css/output.css
npm run serve      # jalankan server lokal di http://localhost:5173
```

`src/css/output.css` ikut disertakan di repositori, jadi aplikasi tetap bisa dijalankan tanpa build asalkan Tailwind sudah pernah dikompilasi. Selama pengembangan, gunakan:

```bash
npm run watch      # Tailwind rebuild otomatis saat file berubah
```

Tailwind dipilih dengan sengaja: CLI resmi (`@tailwindcss/cli`) dengan versi terkunci di `package.json`, tanpa CDN, tanpa aset eksternal selain Google Fonts (Fraunces, Instrument Sans, Space Mono).

## Struktur proyek

```text
sampahkita/
├── index.html                 # Beranda
├── report.html                # Form buat laporan
├── reports.html               # Daftar laporan (pencarian + filter)
├── report-detail.html         # Detail + timeline (butuh ?id=)
├── staff.html                 # Dashboard petugas
├── package.json
├── src/
│   ├── css/
│   │   ├── input.css          # Token desain + komponen (Tailwind v4)
│   │   └── output.css         # Hasil build
│   ├── assets/images/
│   │   └── favicon.svg
│   └── js/
│       ├── app.js             # Shell: nav, mode, toast, dialog konfirmasi
│       ├── config.js          # Lokasi, kategori, batas validasi, kunci storage
│       ├── data/seed-reports.js
│       ├── services/report-store.js
│       ├── ui/components.js   # Badge, baris tabel, timeline, kartu statistik
│       ├── utils/             # dates, ids, validation, query, photo, status, dom, format
│       └── pages/             # home, create-report, report-list, report-detail, staff-dashboard
└── dist/                      # (opsional) hanya jika memakai setup build lain
```

## Alur singkat

**Siswa:** buka beranda → buat laporan → isi lokasi/kategori/judul/deskripsi (± foto) → validasi → laporan tersimpan dengan ID unik (`SK-<tahun>-<urut>`) → buka detail dan pantau status.

**Petugas:** aktifkan mode petugas → lihat statistik → cari/filter → buka panel kelola → ubah status melalui transisi valid + tulis catatan → simpan → daftar, statistik, dan riwayat langsung berubah.

## Status dan prioritas

| Value         | Label UI                     | Makna                                             |
| ------------- | ---------------------------- | ------------------------------------------------- |
| `SUBMITTED`   | Baru Dilaporkan              | Laporan dikirim dan menunggu peninjauan           |
| `REVIEWED`    | Telah Ditinjau               | Petugas sudah melihat laporan                     |
| `IN_PROGRESS` | Sedang Ditangani             | Penanganan sedang berlangsung                     |
| `RESOLVED`    | Selesai                      | Masalah sudah ditangani                           |
| `REJECTED`    | Tidak Dapat Ditindaklanjuti  | Tidak dapat diproses; alasan wajib diisi          |

Alur normal: `SUBMITTED → REVIEWED → IN_PROGRESS → RESOLVED`. `REJECTED` adalah cabang dari dua status awal. Transisi lain ditolak oleh service penyimpanan, dan membuka kembali laporan selesai memerlukan catatan alasan.

Prioritas (`LOW` / `MEDIUM` / `HIGH`) ditetapkan manual oleh petugas — bukan hasil AI, dan tidak disimpulkan hanya dari kategori.

## Penyimpanan data

- Key: `sampahkita.reports.v1` dan `sampahkita.settings.v1` (mode + daftar laporan yang dipantau)
- Data demo (8 laporan, berbagai status) dimuat otomatis saat pertama kali dibuka
- JSON rusak ditangani: isi lama diselamatkan ke `sampahkita.reports.v1.corrupt`, lalu data demo dimuat ulang
- Kegagalan baca/tulis dan storage penuh ditangani dengan pesan yang jelas; jika penyimpanan diblokir, banner peringatan muncul di atas halaman
- Tombol **Reset data demo** (footer) dan **Kosongkan data** (dashboard petugas) selalu meminta konfirmasi

**Batasan:** `localStorage` hanya tersedia pada browser/origin yang sama. Jika siswa dan petugas memakai perangkat berbeda, perubahan **tidak tersinkron**. Ini bukan sinkronisasi real-time dan tidak menyamar sebagai demikian.

## Privasi dan keamanan

- Tidak ada data pribadi yang diminta; nama panggilan sepenuhnya opsional
- Nama pelapor tidak ditampilkan di daftar publik, hanya di halaman detail
- Semua teks pengguna dirender lewat `textContent` — tidak pernah sebagai HTML mentah
- Foto dibatasi 3 MB, hanya JPG/PNG/WebP, dikecilkan sebelum disimpan
- Tidak ada API key atau secret di frontend
- Untuk penggunaan sungguhan dibutuhkan backend, autentikasi, otorisasi, validasi sisi server, dan kebijakan pengelolaan data

## Aksesibilitas

- HTML semantik (`header`, `nav`, `main`, `section`, `article`, `form`, `footer`)
- Setiap input punya label, error dilekatkan ke field, fokus keyboard terlihat
- Status tidak dibedakan hanya lewat warna — ada label teks dan bentuk glyph berbeda per status
- Skip link, `aria-live` untuk hasil filter dan toast, dialog konfirmasi dengan fokus terkelola
- Menghormati `prefers-reduced-motion`

## Roadmap

- **V1 (sekarang):** MVP statis interaktif — validasi, localStorage, statistik dinamis, filter, pencarian, update status, riwayat, preview foto, reset demo
- **V2 (di luar cakupan):** backend, database bersama, autentikasi petugas, unggah foto, sinkronisasi lintas perangkat, audit log
- **V3 (opsional):** notifikasi, peta lokasi, ringkasan tren kebersihan, prioritas berbasis aturan — hanya jika manfaatnya jelas

## Deskripsi singkat (untuk presentasi)

**SampahKita** adalah aplikasi web pelaporan dan pemantauan penanganan sampah di lingkungan sekolah. Siswa dapat melaporkan sampah menumpuk atau masalah kebersihan dengan lokasi, kategori, deskripsi, dan foto opsional. Petugas dapat meninjau laporan, menentukan prioritas, memperbarui status penanganan, serta menambahkan catatan tindak lanjut. Siswa dapat memantau perkembangan laporan melalui status dan riwayat yang ditampilkan sistem. Dibangun sebagai prototype statis menggunakan HTML, Tailwind CSS, dan JavaScript dengan mock data serta localStorage — backend, database bersama, autentikasi, dan sinkronisasi antarperangkat merupakan pengembangan lanjutan.

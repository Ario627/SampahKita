# SampahKita — Product & Technical Specification

**Tujuan dokumen:** sumber kebenaran bagi coding AI untuk membangun prototype web SampahKita.

- **Produk:** aplikasi pelaporan dan pemantauan penanganan sampah di sekolah.
- **Pengguna:** Siswa dan Petugas.
- **Stack MVP:** HTML semantik, Tailwind CSS, JavaScript ES modules, mock data, localStorage.
- **Bahasa UI:** Bahasa Indonesia.
- **Tidak ada pada MVP:** backend, database server, autentikasi sungguhan, API, AI/ML, peta eksternal, push notification, sinkronisasi lintas perangkat.

## 1. Instruksi untuk coding AI

Bangun aplikasi statis interaktif sesuai spesifikasi ini. Utamakan alur laporan yang berfungsi, komponen yang dapat digunakan ulang, tampilan responsif, aksesibilitas, dan kode modular.

**Wajib**
1. Gunakan HTML semantik, Tailwind CSS, dan JavaScript modular.
2. Implementasikan mode Siswa dan mode Petugas dalam satu aplikasi.
3. Gunakan satu sumber data localStorage yang dipakai oleh kedua mode.
4. Siswa membuat laporan → laporan tersimpan → petugas melihat laporan → petugas mengubah status → perubahan terlihat pada detail/daftar laporan.
5. Semua tombol dan kontrol yang terlihat harus berfungsi.
6. Sediakan mock data, empty states, validasi, error feedback, dan README.
7. Jangan meminta informasi pribadi yang tidak diperlukan.
8. Beri label bahwa data merupakan simulasi.

**Jangan dilakukan**
- Jangan membuat backend, database server, atau mengklaim data tersinkron antarperangkat.
- Jangan membuat login sungguhan; pemilih mode hanya simulasi.
- Jangan mengklaim laporan dikirim ke petugas nyata.
- Jangan menambahkan AI/ML, peta, geolocation, email, WhatsApp, atau push notification pada MVP.
- Jangan merender teks yang dimasukkan pengguna sebagai HTML mentah.
- Jangan membuat tombol dekoratif tanpa fungsi.
- Jangan menumpuk seluruh aplikasi dalam satu file JavaScript besar.

Jika ada detail minor yang belum ditentukan, pilih solusi sederhana yang konsisten dengan dokumen ini.

## 2. Ringkasan Produk

**SampahKita** membantu siswa melaporkan sampah menumpuk atau masalah kebersihan di lingkungan sekolah. Petugas dapat meninjau laporan, menentukan prioritas, memperbarui status penanganan, dan menambahkan catatan. Siswa dapat melihat status serta riwayat laporan.

Masalah yang ditangani:
- Siswa tidak tahu cara melaporkan masalah kebersihan.
- Laporan lisan dapat terlupakan atau kehilangan detail lokasi.
- Petugas sulit mengurutkan beberapa laporan.
- Pelapor tidak mengetahui apakah laporan sudah ditinjau atau diselesaikan.
- Tidak ada ringkasan sederhana tentang jumlah laporan dan statusnya.

**Definisi inti:** pelaporan masalah kebersihan + pengelolaan laporan oleh petugas + pemantauan status penanganan.

SampahKita tidak otomatis mengetahui kondisi sekolah. Data berasal dari input pengguna dan pembaruan petugas. Pada MVP, data hanya disimpan pada browser yang sama.

## 3. Pengguna dan hak akses

### Siswa
- Melihat beranda dan daftar laporan.
- Membuat laporan dengan lokasi, kategori, judul, deskripsi, dan foto opsional.
- Membuka detail laporan.
- Melihat status dan timeline penanganan.
- Mencari dan memfilter laporan.

Tidak perlu login. Nama panggilan boleh opsional. Jangan meminta NIS, nomor telepon, alamat rumah, atau data pribadi yang tidak relevan.

### Petugas
- Melihat seluruh laporan demo.
- Melihat statistik status.
- Mencari, memfilter, dan mengurutkan laporan.
- Membuka detail.
- Mengubah status laporan.
- Menambahkan catatan tindak lanjut.
- Menolak laporan dengan alasan yang jelas.
- Melihat riwayat perubahan.

Mode petugas hanyalah simulasi UI dan bukan kontrol keamanan. Versi produksi kelak memerlukan autentikasi dan otorisasi.

## 4. Fitur dan halaman

### Beranda — `index.html`
- Logo/nama SampahKita.
- Headline: “Bersama jaga lingkungan sekolah tetap bersih”.
- CTA “Buat Laporan” dan “Lihat Laporan”.
- Ringkasan total laporan dan status.
- Beberapa laporan terbaru.
- Cara kerja 3 langkah: laporkan → petugas menangani → pantau status.

### Buat laporan — `report.html`
Field wajib:
- Lokasi.
- Kategori.
- Judul singkat.
- Deskripsi.

Field opsional:
- Nama panggilan.
- Foto.
- Catatan tambahan.

Lokasi demo yang dapat diedit di satu file konfigurasi:
- Area kelas
- Koridor
- Halaman sekolah
- Kantin
- Lapangan
- Toilet
- Tempat parkir
- Area tempat sampah
- Lainnya

Jika memilih “Lainnya”, tampilkan input lokasi manual. Ini contoh generik, bukan daftar lokasi yang sudah diverifikasi.

Kategori:
- Sampah menumpuk
- Tempat sampah penuh
- Sampah berserakan
- Sampah tidak dipilah
- Bau tidak sedap
- Lainnya

Validasi:
- Lokasi dan kategori wajib.
- Judul 5–80 karakter.
- Deskripsi 10–500 karakter.
- Foto opsional; hanya gambar dan maksimal 3 MB.
- Tampilkan error di dekat field terkait dan jangan menghapus input jika validasi gagal.
- Cegah submit ganda.

Foto hanya untuk demo lokal. Tampilkan preview; jika disimpan ke localStorage, batasi ukuran dan beri pesan jika terlalu besar. Jangan mengklaim foto diunggah ke server.

### Daftar laporan — `reports.html`
Setiap kartu menampilkan ID, judul, lokasi, kategori, tanggal, status, prioritas (jika ada), cuplikan deskripsi, dan tombol detail.

Filter:
- Semua
- Baru Dilaporkan
- Sedang Ditangani
- Selesai

Pencarian dapat mencocokkan ID, judul, lokasi, dan kategori. Jangan tampilkan data pribadi pelapor secara terbuka.

### Detail laporan — `report-detail.html?id=...`
Tampilkan ID, judul, status, lokasi, kategori, deskripsi, foto jika ada, waktu dibuat/diubah, catatan petugas yang layak ditampilkan, dan timeline. Jika ID tidak ditemukan, tampilkan error state dengan tombol kembali.

### Dashboard petugas — `staff.html`
Kartu statistik dinamis:
- Total laporan
- Baru Dilaporkan
- Sedang Ditangani
- Selesai
- Opsional: prioritas tinggi

Daftar laporan memiliki pencarian, filter status/kategori/prioritas, sorting terbaru/terlama atau prioritas, dan tombol kelola. Pada desktop boleh memakai tabel; pada ponsel gunakan kartu/list responsif.

Detail pengelolaan memungkinkan petugas membaca laporan, memperbarui status, menambahkan catatan, dan menulis alasan ketika menolak laporan. Setiap perubahan harus mengubah timestamp, menambahkan history, menyimpan data, memperbarui statistik/daftar, dan menampilkan feedback.

## 5. Status dan prioritas

Status internal:

| Value | Label UI | Makna |
|---|---|---|
| `SUBMITTED` | Baru Dilaporkan | Laporan dikirim dan menunggu peninjauan |
| `REVIEWED` | Telah Ditinjau | Petugas sudah melihat laporan |
| `IN_PROGRESS` | Sedang Ditangani | Penanganan sedang berlangsung |
| `RESOLVED` | Selesai | Petugas menyatakan masalah sudah ditangani |
| `REJECTED` | Tidak Dapat Ditindaklanjuti | Tidak dapat diproses; alasan wajib |

Alur normal: `SUBMITTED → REVIEWED → IN_PROGRESS → RESOLVED`. `REJECTED` adalah jalur alternatif dari status awal/ditinjau. Jangan izinkan transisi acak. Membuka kembali laporan selesai harus merupakan aksi eksplisit dengan catatan.

Prioritas:
- `LOW` — Rendah
- `MEDIUM` — Sedang
- `HIGH` — Tinggi

Prioritas dipilih petugas secara manual pada MVP, bukan hasil AI. Gunakan pertimbangan kondisi aktual; kategori saja tidak cukup untuk menyimpulkan risiko.

## 6. Model data

Contoh objek laporan:

```js
{
  id: "SK-2026-001",
  title: "Sampah menumpuk dekat tempat sampah",
  description: "Terlihat beberapa kantong sampah menumpuk di samping tempat sampah.",
  location: "Halaman sekolah",
  customLocation: "",
  category: "Sampah menumpuk",
  photoDataUrl: "",
  reporterName: "Siswa",
  status: "SUBMITTED",
  priority: "MEDIUM",
  createdAt: "2026-10-12T08:15:00+07:00",
  updatedAt: "2026-10-12T08:15:00+07:00",
  staffNote: "",
  rejectionReason: "",
  history: [{
    id: "H-SK-2026-001-1",
    status: "SUBMITTED",
    note: "Laporan dibuat.",
    changedAt: "2026-10-12T08:15:00+07:00",
    actor: "SYSTEM"
  }]
}
```

Tanggal di atas contoh saja. Gunakan waktu saat ini ketika membuat laporan baru. ID harus unik dan stabil; generator harus mencegah duplikasi.

Aturan:
- `createdAt` tidak berubah.
- `updatedAt` berubah setiap laporan diperbarui.
- Setiap perubahan status menambah item history.
- Riwayat harus ditampilkan secara kronologis konsisten.
- Data demo harus ditandai sebagai simulasi.
- Jangan menyimpan data pribadi yang tidak diperlukan.

## 7. localStorage

Gunakan key:
- `sampahkita.reports.v1`
- `sampahkita.settings.v1`

Buat service dengan fungsi seperti:
- `getReports()`
- `saveReports(reports)`
- `createReport(payload)`
- `getReportById(id)`
- `updateReportStatus(id, status, note)`
- `resetDemoData()`

Tangani JSON rusak, storage penuh, dan kegagalan baca/tulis. Tombol reset data demo harus meminta konfirmasi. Semua halaman wajib membaca sumber data yang sama.

**Batasan:** localStorage hanya tersedia pada browser/origin yang sama. Jika siswa dan petugas menggunakan perangkat berbeda, perubahan tidak akan tersinkron. Ini harus disebutkan di README dan jangan disamarkan sebagai real-time.

## 8. Alur pengguna

### Siswa
```text
Buka SampahKita
 → Buat laporan
 → Pilih lokasi dan kategori
 → Isi judul/deskripsi
 → Tambah foto opsional
 → Validasi
 → Buat ID dan timestamp
 → Simpan ke localStorage
 → Tampilkan konfirmasi dan tautan detail
```

### Petugas
```text
Buka dashboard
 → Lihat statistik
 → Cari/filter laporan
 → Buka detail
 → Tinjau informasi
 → Ubah status dan/atau catatan
 → Validasi transisi
 → Simpan timestamp dan history
 → Render ulang daftar dan statistik
```

### Pelacakan
```text
Buka detail laporan
 → Lihat status terbaru
 → Baca riwayat
 → Pahami apakah menunggu, ditangani, atau selesai
```

## 9. Struktur proyek

Gunakan vanilla HTML/CSS/JS dengan ES modules:

```text
sampahkita/
├── index.html
├── report.html
├── reports.html
├── report-detail.html
├── staff.html
├── README.md
├── package.json
├── src/
│   ├── css/input.css
│   ├── js/
│   │   ├── app.js
│   │   ├── config.js
│   │   ├── data/seed-reports.js
│   │   ├── services/report-store.js
│   │   ├── utils/dates.js
│   │   ├── utils/ids.js
│   │   ├── utils/validation.js
│   │   ├── utils/status.js
│   │   └── pages/
│   │       ├── home.js
│   │       ├── create-report.js
│   │       ├── report-list.js
│   │       ├── report-detail.js
│   │       └── staff-dashboard.js
│   └── assets/images/
└── dist/
```

`dist/` hanya digunakan jika Tailwind dikompilasi. Pilih satu setup Tailwind yang benar-benar bisa dijalankan:
- CDN untuk prototype cepat; atau
- Tailwind CLI dengan konfigurasi build yang jelas.

Jangan mencampur setup yang bertentangan. Jika memakai ES modules/import, jalankan melalui local development server, bukan membuka HTML dengan `file://`.

## 10. Fungsi JavaScript yang disarankan

- `renderReportCard(report)`
- `renderReportList(reports)`
- `renderStatusBadge(status)`
- `renderReportTimeline(history)`
- `filterReports(reports, filters)`
- `sortReports(reports, sortMode)`
- `validateReportForm(formData)`
- `createReport(payload)`
- `updateReportStatus(reportId, newStatus, note)`
- `calculateDashboardStats(reports)`
- `formatDateTime(dateString)`
- `getReports()`
- `saveReports(reports)`

Gunakan fungsi kecil dengan tanggung jawab jelas. Utamakan `textContent` dan pembuatan elemen DOM yang aman. Jangan menyisipkan teks pengguna langsung ke `innerHTML`.

## 11. Data demo

Sediakan 5–8 laporan demo dengan status beragam: baru, ditinjau, sedang ditangani, selesai, dan ditolak dengan alasan sopan. Variasikan lokasi dan kategori. Jangan menggunakan nama lengkap siswa sungguhan atau data sensitif.

Jika belum ada laporan, tampilkan empty state dengan tombol untuk membuat laporan. Sediakan reset demo untuk mengembalikan data awal.

## 12. Design direction

Arah visual: bersih, ramah, modern, dan sesuai lingkungan sekolah.

- Warna utama: hijau, untuk kebersihan dan aksi positif.
- Warna pendukung: putih/off-white, abu-abu lembut, hijau muda.
- Tipografi sans-serif yang mudah dibaca.
- Kartu dengan radius moderat, border halus, shadow ringan.
- Ikon konsisten untuk lokasi, laporan, status, dan petugas.
- Animasi ringan saja; jangan mengorbankan keterbacaan.
- Mobile-first; formulir satu kolom di ponsel.
- Dashboard boleh memakai sidebar di desktop, navigasi ringkas di ponsel.
- Gunakan `header`, `nav`, `main`, `section`, `article`, `form`, dan `footer`.
- Setiap input memiliki label, fokus keyboard terlihat, status tidak hanya dibedakan dengan warna, dan gambar memiliki alt text.

Komponen UI:
- Header/navigation
- Stat card
- Report card
- Status badge
- Report form
- Photo preview
- Filter/search toolbar
- Report timeline
- Staff status editor
- Empty state
- Confirmation dialog
- Toast/feedback message

## 13. Error cases

Tangani:
1. Field wajib kosong.
2. Judul/deskripsi terlalu panjang.
3. File bukan gambar atau melebihi batas.
4. ID laporan tidak ditemukan.
5. localStorage rusak atau gagal ditulis.
6. Filter tidak menghasilkan data.
7. Transisi status tidak valid.
8. Penolakan tanpa alasan.
9. Laporan selesai dibuka kembali.
10. Foto tidak tersedia.
11. Belum ada laporan.
12. Submit diklik berulang kali.
13. Tanggal tidak valid.

Jangan biarkan error membuat halaman kosong tanpa penjelasan.

## 14. Privasi dan keamanan

- Jangan meminta data pribadi yang tidak diperlukan.
- Jangan memasukkan API key atau secret ke frontend.
- Pemilih mode petugas bukan autentikasi.
- localStorage dapat diubah oleh pengguna perangkat dan bukan penyimpanan aman.
- Jangan tampilkan nama pelapor pada daftar publik.
- Batasi ukuran foto.
- Jangan render deskripsi sebagai HTML mentah.
- Untuk penggunaan sungguhan, butuhkan backend, autentikasi, otorisasi, validasi server, serta kebijakan pengelolaan data.

## 15. Acceptance criteria

### Siswa
- [ ] Beranda menjelaskan tujuan produk.
- [ ] Form laporan dapat dibuka dan divalidasi.
- [ ] Lokasi, kategori, judul, dan deskripsi wajib.
- [ ] Foto opsional memiliki preview dan validasi.
- [ ] Submit valid menghasilkan ID unik.
- [ ] Laporan baru muncul di daftar dan detail.
- [ ] Detail menampilkan status dan timeline.
- [ ] Data tetap ada setelah refresh di browser yang sama.

### Petugas
- [ ] Statistik dihitung dari data, bukan angka hardcoded.
- [ ] Pencarian/filter/sorting berfungsi.
- [ ] Petugas dapat membuka detail.
- [ ] Status dapat diubah melalui transisi valid.
- [ ] Penolakan memerlukan alasan.
- [ ] Perubahan menyimpan timestamp dan history.
- [ ] Statistik dan daftar berubah setelah update.
- [ ] Reset data demo meminta konfirmasi.

### Kualitas
- [ ] Responsif pada ponsel, tablet, dan desktop.
- [ ] Semua tombol utama berfungsi.
- [ ] Ada empty state dan error feedback.
- [ ] Status tidak mengandalkan warna saja.
- [ ] Tidak ada error console pada alur utama.
- [ ] README menjelaskan setup dan batasan localStorage.
- [ ] Tidak ada klaim backend, AI, atau sinkronisasi yang belum dibuat.

## 16. Roadmap

### V0 — UI
Beranda, form, daftar, detail, dashboard petugas, mock data, responsif.

### V1 — Static interactive MVP
Validasi, pembuatan laporan, localStorage, statistik dinamis, filter, pencarian, update status, history, preview foto, reset demo.

### V2 — Backend (di luar scope sekarang)
API, database bersama, autentikasi petugas, upload foto, sinkronisasi lintas perangkat, audit log.

### V3 — Pengembangan opsional
Notifikasi, peta lokasi, ringkasan tren kebersihan, atau prioritas berbasis aturan. Tambahkan hanya jika kebutuhan dan manfaatnya jelas. AI/ML tidak diperlukan untuk membuktikan alur inti.

## 17. Definition of Done

MVP selesai jika:
1. Semua halaman inti berjalan.
2. Siswa dapat membuat laporan dan melihatnya.
3. Petugas dapat mengubah status.
4. Status, timestamp, dan history tersimpan di localStorage.
5. Statistik, pencarian, dan filter berfungsi.
6. UI responsif dan memiliki empty/error states.
7. Data demo ditandai jelas.
8. README berisi instruksi menjalankan proyek.
9. Tidak ada tombol utama yang mati.
10. UI tidak mengklaim laporan diterima petugas nyata atau tersinkron ke perangkat lain.

## 18. Deskripsi untuk README/presentasi

**SampahKita** adalah aplikasi web pelaporan dan pemantauan penanganan sampah di lingkungan sekolah. Siswa dapat melaporkan sampah menumpuk atau masalah kebersihan dengan menyertakan lokasi, kategori, deskripsi, dan foto opsional. Petugas dapat meninjau laporan, menentukan prioritas, memperbarui status penanganan, serta menambahkan catatan tindak lanjut. Siswa dapat memantau perkembangan laporan melalui status dan riwayat yang ditampilkan sistem.

Pada tahap awal, SampahKita dibangun sebagai prototype statis menggunakan HTML, Tailwind CSS, JavaScript, mock data, dan localStorage. Data hanya tersimpan pada browser yang sama; backend, database bersama, autentikasi, dan sinkronisasi antarperangkat merupakan pengembangan lanjutan.

# Product Requirements Document (PRD)
## Aplikasi Pencatatan Keuangan Pribadi — PWA (iPhone-first)

**Versi:** 1.0  
**Tanggal:** Juni 2026  
**Status:** Draft  

---

## 1. Ringkasan Eksekutif

Aplikasi pencatatan keuangan pribadi berbasis Progressive Web App (PWA) yang dirancang dengan pengalaman pengguna iPhone sebagai prioritas utama. Pengguna dapat mencatat pemasukan dan pengeluaran, mengkategorikan transaksi, melihat laporan keuangan, dan mengelola anggaran — semua tanpa perlu menginstal aplikasi native dari App Store.

---

## 2. Latar Belakang & Tujuan

### 2.1 Masalah yang Diselesaikan
- Pengguna kesulitan melacak pengeluaran harian secara konsisten
- Aplikasi keuangan native sering memerlukan akun berbayar atau izin data sensitif yang berlebihan
- Tidak semua pengguna mau mengunduh aplikasi tambahan dari App Store

### 2.2 Tujuan Produk
- Memberikan cara yang cepat dan ringan untuk mencatat transaksi keuangan harian
- Memberikan gambaran kondisi keuangan personal secara visual dan mudah dipahami
- Dapat diakses langsung dari browser Safari iPhone dan ditambahkan ke Home Screen

### 2.3 Metrik Keberhasilan
| Metrik | Target |
|--------|--------|
| Waktu pencatatan transaksi | < 15 detik |
| First Contentful Paint | < 1.5 detik |
| Dapat digunakan offline | ✅ Ya |
| Instalasi ke Home Screen | Didukung penuh |

---

## 3. Pengguna Target (User Persona)

### Persona Utama: "Andi, 26 tahun — Pekerja Kantoran"
- Memiliki iPhone sebagai perangkat utama
- Ingin tahu kemana uang gajinya pergi setiap bulan
- Tidak mau ribet dengan fitur terlalu banyak
- Mengakses keuangan saat santai atau setelah transaksi terjadi
- Belum terbiasa dengan spreadsheet atau aplikasi keuangan kompleks

### Persona Sekunder: "Rina, 34 tahun — Ibu Rumah Tangga"
- Mengelola keuangan keluarga
- Butuh fitur anggaran per kategori (belanja, pendidikan, dll.)
- Lebih sering menggunakan HP dari pada komputer

---

## 4. Fitur & Persyaratan Fungsional

### 4.1 Modul Pencatatan Transaksi *(Prioritas: Wajib)*

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| F-01 | Tambah transaksi | Form cepat: nominal, jenis (pemasukan/pengeluaran), kategori, catatan, tanggal |
| F-02 | Edit transaksi | Ubah data transaksi yang sudah dicatat |
| F-03 | Hapus transaksi | Hapus dengan konfirmasi |
| F-04 | Pilih tanggal | Default hari ini, bisa diubah ke tanggal lain |
| F-05 | Input nominal | Keyboard numerik otomatis tampil saat input nominal |
| F-06 | Catatan opsional | Field teks pendek untuk keterangan tambahan |

### 4.2 Modul Kategori *(Prioritas: Wajib)*

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| C-01 | Kategori bawaan | Makan, Transportasi, Belanja, Hiburan, Kesehatan, Gaji, Bisnis, Lainnya |
| C-02 | Tambah kategori kustom | Pengguna bisa membuat kategori sendiri dengan nama dan ikon emoji |
| C-03 | Edit/hapus kategori | Pengguna bisa mengelola kategori yang ada |

### 4.3 Modul Anggaran (Budget) *(Prioritas: Tinggi)*

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| B-01 | Atur anggaran bulanan | Set batas pengeluaran per kategori per bulan |
| B-02 | Indikator progress | Tampilkan realisasi vs anggaran (bar progress warna) |
| B-03 | Notifikasi melebihi anggaran | Alert saat pengeluaran kategori mendekati atau melewati batas |

### 4.4 Modul Laporan & Ringkasan *(Prioritas: Tinggi)*

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| R-01 | Dashboard ringkasan | Total saldo, pemasukan, pengeluaran bulan ini |
| R-02 | Grafik pengeluaran | Pie chart atau bar chart per kategori |
| R-03 | Riwayat transaksi | Daftar transaksi dengan filter bulan dan kategori |
| R-04 | Laporan bulanan | Perbandingan bulan ini vs bulan sebelumnya |
| R-05 | Ekspor data | Export ke CSV untuk backup atau buka di Excel |

### 4.5 Modul Pengaturan *(Prioritas: Sedang)*

| ID | Fitur | Deskripsi |
|----|-------|-----------|
| S-01 | Mata uang | Pilih mata uang (default: IDR - Rupiah) |
| S-02 | Periode awal bulan | Atur kapan bulan baru dimulai (misal: tgl 25 = gajian) |
| S-03 | Dark mode | Ikuti preferensi sistem iOS |
| S-04 | Backup & restore | Export/import data JSON untuk backup manual |

---

## 5. Persyaratan Non-Fungsional

### 5.1 PWA & iPhone Experience
- **Installable:** File `manifest.json` lengkap dengan icon iOS, splash screen, dan `display: standalone`
- **Offline-first:** Menggunakan Service Worker + Cache API; semua fitur inti berjalan tanpa koneksi internet
- **Add to Home Screen:** Tampilkan prompt instalasi yang ramah pengguna
- **Safe Area:** Mendukung `env(safe-area-inset-*)` untuk iPhone dengan notch dan Dynamic Island
- **Viewport:** Menggunakan `viewport-fit=cover` dan meta viewport yang tepat agar tidak ada area kosong

### 5.2 Performa
- Lighthouse PWA Score: ≥ 90
- First Contentful Paint: < 1.5 detik pada koneksi 4G
- Time to Interactive: < 3 detik
- Ukuran bundle awal: < 200 KB (gzip)

### 5.3 Penyimpanan Data
- Data disimpan secara lokal menggunakan **IndexedDB** (via library Dexie.js)
- Tidak ada server backend — aplikasi sepenuhnya client-side
- Data tidak keluar dari perangkat pengguna (privasi terjaga)

### 5.4 Keamanan & Privasi
- Tidak memerlukan akun atau registrasi
- Tidak ada tracking, analytics pihak ketiga, atau pengiriman data ke server
- Data sensitif tidak disimpan di `localStorage` (gunakan IndexedDB yang lebih aman)

### 5.5 Aksesibilitas
- Ukuran tap target minimum 44×44 pt (standar Apple HIG)
- Kontras warna WCAG AA minimum
- Label ARIA pada elemen interaktif

---

## 6. Desain & UX

### 6.1 Prinsip Desain
- **Simple first:** Satu aksi utama per layar
- **Thumb-friendly:** Elemen penting di bagian bawah layar (zone ibu jari)
- **Native feel:** Menggunakan pola navigasi iOS (tab bar bawah, swipe gesture, modal sheet)

### 6.2 Struktur Navigasi (Tab Bar)

```
┌─────────────────────────────┐
│  [Dashboard] [+] [Riwayat]  │
│  [Anggaran]  [Laporan]      │
└─────────────────────────────┘
```

| Tab | Ikon | Konten |
|-----|------|--------|
| Beranda | 🏠 | Saldo, ringkasan hari ini, transaksi terbaru |
| Tambah | ➕ | Sheet modal untuk input transaksi cepat |
| Riwayat | 📋 | Daftar semua transaksi dengan filter |
| Anggaran | 🎯 | Progress anggaran per kategori |
| Laporan | 📊 | Grafik dan statistik bulanan |

### 6.3 Alur Utama: Tambah Transaksi

```
Tap [+] 
  → Bottom Sheet muncul
    → Pilih: Pengeluaran / Pemasukan
    → Input nominal (keyboard numerik)
    → Pilih kategori (grid ikon)
    → Isi catatan (opsional)
    → Konfirmasi tanggal
    → Tap [Simpan] → Sheet tutup → feedback haptic + animasi
```

### 6.4 Wireframe Halaman Beranda

```
┌─────────────────────────┐
│  Juni 2026              │
│  ┌───────────────────┐  │
│  │  Saldo Bersih     │  │
│  │  Rp 3.250.000     │  │
│  └───────────────────┘  │
│  [Pemasukan] [Pengeluaran]│
│  Rp 5.000.000  Rp 1.750K │
│                           │
│  Transaksi Terbaru        │
│  ○ Makan siang  -15.000  │
│  ○ Gaji         +5.000K  │
│  ○ Grab         -25.000  │
│  [Lihat semua]            │
│                           │
│ [🏠][➕][📋][🎯][📊]     │
└─────────────────────────┘
```

---

## 7. Arsitektur Teknis

### 7.1 Tech Stack yang Direkomendasikan

| Komponen | Pilihan | Alasan |
|----------|---------|--------|
| Framework | React + Vite | Ekosistem luas, build cepat |
| UI Library | shadcn/ui atau Tailwind CSS | Ringan, mudah dikostumisasi |
| Database lokal | Dexie.js (IndexedDB wrapper) | API bersih, performa tinggi |
| Service Worker | Workbox | Caching otomatis, offline support |
| Grafik | Recharts atau Chart.js | Ringan dan responsif |
| Manifest PWA | Vite PWA Plugin | Konfigurasi otomatis |

### 7.2 Struktur Data (Schema IndexedDB)

**Tabel `transactions`**
```
id          : UUID (auto)
amount      : Number (dalam Rupiah)
type        : 'income' | 'expense'
categoryId  : String (FK ke categories)
note        : String (opsional)
date        : Date (YYYY-MM-DD)
createdAt   : Timestamp
```

**Tabel `categories`**
```
id          : UUID (auto)
name        : String
emoji       : String
type        : 'income' | 'expense' | 'both'
isDefault   : Boolean
```

**Tabel `budgets`**
```
id          : UUID (auto)
categoryId  : String
amount      : Number
month       : String (YYYY-MM)
```

**Tabel `settings`**
```
key         : String (PK)
value       : Any
```

### 7.3 File PWA Manifest (`manifest.json`) — Poin Kritis iPhone

```json
{
  "name": "Dompetku",
  "short_name": "Dompetku",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-180.png", "sizes": "180x180", "type": "image/png" }
  ],
  "apple-mobile-web-app-capable": "yes",
  "apple-mobile-web-app-status-bar-style": "default"
}
```

> **Catatan:** Safari iOS memerlukan meta tag `apple-mobile-web-app-capable` dan icon `apple-touch-icon` di HTML `<head>` secara terpisah — tidak cukup hanya manifest.

---

## 8. Batasan & Asumsi

### 8.1 Batasan
- Tidak ada sinkronisasi multi-perangkat (v1.0 — data hanya di satu perangkat)
- Tidak ada fitur berbagi atau kolaborasi
- Tidak ada koneksi ke rekening bank atau e-wallet secara otomatis
- Push Notification terbatas di Safari iOS (hanya iOS 16.4+ yang mendukung Web Push)

### 8.2 Asumsi
- Pengguna menggunakan iPhone dengan iOS 14 ke atas
- Pengguna menambahkan aplikasi ke Home Screen untuk pengalaman terbaik
- Koneksi internet hanya diperlukan saat load pertama; setelah itu offline penuh

---

## 9. Roadmap

### v1.0 — MVP *(Target: 6–8 minggu)*
- [ ] Pencatatan transaksi (tambah, edit, hapus)
- [ ] Kategori bawaan
- [ ] Dashboard ringkasan bulanan
- [ ] Riwayat transaksi
- [ ] PWA installable + offline support
- [ ] Dark mode

### v1.1 — Anggaran & Laporan *(Target: +4 minggu)*
- [ ] Modul anggaran per kategori
- [ ] Grafik pengeluaran (pie chart)
- [ ] Laporan perbandingan bulan
- [ ] Ekspor CSV

### v2.0 — Sinkronisasi *(Target: +3 bulan)*
- [ ] Opsi backup ke Google Drive / iCloud
- [ ] Sinkronisasi antar perangkat (via akun opsional)
- [ ] Kategori kustom dengan foto
- [ ] Rekap tahunan

---

## 10. Risiko

| Risiko | Kemungkinan | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Safari iOS membatasi fitur PWA | Tinggi | Sedang | Uji di Safari iOS secara berkala; gunakan meta tag Apple spesifik |
| Data hilang jika cache dibersihkan | Sedang | Tinggi | Edukasi pengguna untuk backup manual; tawarkan ekspor JSON |
| Performa lambat di iPhone lama | Sedang | Sedang | Optimalkan bundle size; hindari library berat |
| Pengguna bingung cara install PWA | Tinggi | Sedang | Tampilkan panduan "Tambah ke Home Screen" saat pertama buka |

---

## 11. Kriteria Penerimaan (Acceptance Criteria)

Aplikasi dianggap siap rilis v1.0 apabila:

1. ✅ Pengguna dapat mencatat transaksi dalam < 15 detik
2. ✅ Aplikasi berjalan sepenuhnya offline setelah load pertama
3. ✅ Dapat diinstal ke Home Screen iPhone via Safari
4. ✅ Data tersimpan permanen (tidak hilang setelah browser ditutup)
5. ✅ Lighthouse PWA Score ≥ 90 di Chrome DevTools
6. ✅ Tidak ada crash pada iPhone 12 ke atas dengan iOS 15+
7. ✅ Tampilan benar di iPhone SE (layar kecil) hingga iPhone 16 Pro Max

---

*Dokumen ini bersifat living document dan akan diperbarui seiring perkembangan proyek.*

# Istiqomah Grosir Stock v2.7.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.7.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Audio & Navigation](https://img.shields.io/badge/UX-Velvet_Audio_&_Hardware_Back-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

---

## 📥 Unduh Aplikasi Android (.APK)
👉 **[Unduh File APK Istiqomah Stock](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)**  
👉 **[Halaman Rilis GitHub Releases](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases)**

---

## 👥 Matriks Akun Tim & Hak Akses:

| Petugas | Password | Peran (Role) | Ruang Kerja & Lantai |
| :--- | :--- | :--- | :--- |
| **Fahri** | `819` | **ADMIN** | **Semua Lantai (1, 2, 3, 4) + Pusat Kontrol Admin** |
| **Eza** | `123` | **STAFF** | Semua Lantai (1, 2, 3, 4) |
| **Hasan** | `123` | **STAFF** | Semua Lantai (1, 2, 3, 4) |
| **Amal** | `123` | **STAFF** | Semua Lantai (1, 2, 3, 4) |
| **Alfan** | `123` | **STAFF** | Semua Lantai (1, 2, 3, 4) |
| **Zahra** | `123` | **STAFF** | **Lantai 2** (Pakaian) - Workspace Terisolasi |
| **Alfi** | `123` | **STAFF** | **Lantai 2** (Pakaian) - Workspace Terisolasi |
| **Erpan** | `123` | **STAFF** | **Lantai 3 & 4** (Perabotan & Gudang) |
| **Hendra** | `123` | **STAFF** | **Lantai 3 & 4** (Perabotan & Gudang) |

---

## ✨ Pembaruan & Fitur Unggulan (v2.7.0):

1. 🔙 **Fungsi Tombol Kembali HP & Callback Bertingkat (Hardware Back Button)**:
   - **Tutup Pop-up/Modal Terlebih Dahulu**: Jika sedang membuka Scanner, Form Edit, Mutasi Stok, Kelola Jenis, atau Backup, menekan tombol kembali HP otomatis menutup pop-up tersebut tanpa keluar aplikasi.
   - **Kembali ke Halaman Utama**: Jika berada di dalam lantai kerja/admin, tombol kembali akan mengarahkan kembali ke Dashboard Utama (*Home*).
   - **Konfirmasi Keluar Aplikasi**: Jika sudah mentok di halaman utama, aplikasi menampilkan notifikasi dialog konfirmasi *"Apakah Anda Ingin Keluar dari Aplikasi?"* sehingga tidak keluar secara tidak sengaja.

2. 🎵 **Audio Synthesizer Ultra-Smooth & Velvet**:
   - Efek suara dirancang ulang dengan gelombang sinus murni (*pure sine*), filter *lowpass* akustik lembut, dan kurva *attack/decay* velvet yang sangat halus, elegan, dan menenangkan saat digunakan sehari-hari.

3. ⚖️ **Batas Min (0) & Batas Max (Unlimited) Opsional**:
   - Input batas stok minimal dan kapasitas maksimal diletakkan tepat di bawah Stok Awal produk.

4. 🏷️ **Pemilihan Jenis Barang Compact & Rapi**:
   - Filter jenis berbasis dropdown instan dan chip wrap yang responsif di segala ukuran layar.

5. 🔒 **Proteksi Aksi Berisiko Tinggi**:
   - Konfirmasi ketik `"RESET"` untuk reset database dan dialog konfirmasi mode Timpa Semua.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

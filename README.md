# Istiqomah Grosir Stock v2.1.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.1.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Version](https://img.shields.io/badge/Version-v2.1.0-emerald?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Fitur Unggulan Terbaru (v2.1.0):

1. ⚡ **Ultra-Fast Camera Scanner Engine (Tiru Istiqomah-Price)**:
   - Direct hardware `<video>` stream (60 FPS super mulus).
   - Native C++ `window.BarcodeDetector` dengan akselerasi GPU.
   - Pangkas area deteksi (72% × 42% Center Crop) untuk scanning instan tanpa lag.
   - Audio feedback 2-tone harmonis, getaran haptic, senter/torch, zoom hardware, dan tap-to-focus.

2. 🗂️ **Pusat Kontrol Fahri (Dashboard Modular)**:
   - Fitur terpisah ke tombol-tombol khusus yang rapi (*User Manage, History User, Ringkasan Lantai, Telegram, Master DB, Laporan Teks*).
   - Manajemen user: Tambah staf, ubah password, atur hak akses lantai (Lantai 1-4).

3. 📜 **History User (Audit Log Real-Time)**:
   - Rekam otomatis setiap penambahan stok (+), pengurangan (-), koreksi (~), dan hapus barang lengkap dengan nama petugas & waktu.
   - Filter interaktif per Petugas, Lantai, dan Jenis Aksi.
   - Fitur **Unduh CSV (Excel)** dan **Salin Teks Ringkasan** untuk WhatsApp.

4. 🏢 **Multi-Floor Offline-First**:
   - Berjalan 100% offline tanpa perlu koneksi internet atau server backend.
   - Sinkronisasi antar-HP via file JSON atau bot Telegram otomatis.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

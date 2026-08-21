# Istiqomah Grosir Stock v2.2.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.2.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Theme](https://img.shields.io/badge/Aesthetic-Monochrome_Luxury-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Pembaruan & Fitur Unggulan (v2.2.0):

1. 🖤 **Monochrome Luxury & Clean Aesthetics (Bebas Animasi Warna-Warni)**:
   - Menghapus seluruh animasi konfeti pelangi/warna-warni yang mengganggu tema minimalis.
   - Mengganti seluruh animasi dengan transisi mikro monokrom yang elegan: laser sweep silver, flash light lembut, badge monokrom kontras tinggi, dan efek suara akustik velvet yang halus.

2. ⚡ **Ultra-Fast Hardware Camera Scanner (Sesuai Istiqomah-Price)**:
   - Direct hardware `<video>` stream (60 FPS stabil tanpa lag).
   - Deteksi instan dengan native `BarcodeDetector` + Center Crop 70% × 40%.
   - Tombol senter/torch hardware, haptic vibration, dan audio sine beep.

3. 🗂️ **Pusat Kontrol Fahri (Dashboard Super Admin Modular)**:
   - **👥 User Manage**: Tambah staf, edit password, atur izin lantai.
   - **📜 History User**: Log audit real-time setiap mutasi stok lengkap dengan ekspor CSV (Excel) & salin teks WhatsApp.
   - **🏢 Ringkasan 4 Lantai**: Monitoring fisik & jenis barang per lantai kerja.
   - **💬 Telegram & Auto-Backup**: Konfigurasi bot Telegram & cadangan otomatis.
   - **💾 Master Database**: Unduh & pulihkan cadangan master seluruh toko.

4. 📦 **Toping Grosir Presets**:
   - Preset penyesuaian stok grosir (+12 Lusin, +24 Dus, +50, +100).
   - Real-time active probe connectivity (deteksi online/offline instan).

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

# Istiqomah Grosir Stock v3.3.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v3.3.0-2A1A10?style=for-the-badge&logo=android&logoColor=FAF5E8)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v3.3.0/Istiqomah-Grosir-Stock.apk)
[![Theme](https://img.shields.io/badge/Theme-Vintage_Autumn_&_Espresso-8A4F25?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)
[![Offline First](https://img.shields.io/badge/Architecture-Offline--First_Capacitor-C56F1F?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

---

## 📥 Unduh Aplikasi Android (.APK)
👉 **[Unduh File APK Istiqomah Stock v3.3.0](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v3.3.0/Istiqomah-Grosir-Stock.apk)**  
👉 **[Halaman Rilis GitHub Releases](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/tag/v3.3.0)**

---

## 🎨 Tampilan & Desain Bersih (v3.3.0):
- **Palet Warna Coklat Vintage & Ivory-Espresso**: Perpaduan warna Dark Espresso (`#2A1A10`), Ivory Cream (`#FAF5E8`), Autumn Amber (`#C56F1F`), dan Roasted Saddle (`#8A4F25`) yang elegan, hangat, dan nyaman di mata untuk penggunaan operasional harian.
- **Logo Asli 3-Tier Diamond Android Native**: Mengeliminasi seluruh file legacy `drawable-v24` robot Android, memperbarui vector adaptive icon dan seluruh PNG mipmap (`mdpi` hingga `xxxhdpi`) dengan logo asli 3-tier diamond berwarna coklat vintage.
- **Antarmuka Bersih & Bebas Distraksi**: Menghilangkan teks placeholder verbose ("Contoh: ..."), badge offline berlebih, serta footer yang tidak diperlukan untuk menjaga tampilan tetap fokus dan clean.
- **Halaman Login Kontras Tinggi**: Desain kartu ivory yang tegas, kotak input teks putih murni anti-silau, dan viewport stabil (`100dvh`) saat keyboard virtual HP muncul maupun tertutup.
- **Navigasi Sistem HP Bebas Kedip**: Warna status bar dan navigasi bar hardware sistem Android dikunci solid di `styles.xml` dengan proteksi safe-area inset.

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

## ✨ Fitur Inti Aplikasi:

1. 📄 **Custom Viewer Cetak Laporan**:
   - Pratinjau cetak internal mandiri dengan pilihan ukuran kertas langsung: **A4**, **F4 (Folio)**, **A5**, dan **Struk Thermal 80mm**.
   - Opsi cetak langsung, salin teks, atau unduh berkas HTML dokumen.

2. 🚪 **Konfirmasi Logout & Tombol Kembali HP**:
   - Peringatan konfirmasi keamanan sebelum keluar akun: *"Anda akan keluar dari akun (Nama Akun), Anda yakin?"*.
   - Integrasi *Hardware Back Button* Android: menutup modal/dialog aktif secara berjenjang sebelum keluar aplikasi.

3. 📷 **Pemindai Barcode Kamera Cepat**:
   - Dukungan scan barcode kamera instan dengan autofokus dan switch kamera depan/belakang.

4. 🏢 **Manajemen Multi-Lantai**:
   - **Lantai 1**: Kebutuhan & Sembako
   - **Lantai 2**: Pakaian & Fashion
   - **Lantai 3**: Perabotan & Home Living
   - **Lantai 4**: Gudang Utama & Bulk Stock

5. 💾 **Cadangan Data & Sinkronisasi**:
   - Ekspor/Impor berkas JSON (per lantai atau master 4 lantai).
   - Integrasi Backup otomatis ke Bot Telegram.

---

## 🛠️ Menjalankan Lokal:
```bash
# Pasang dependensi
npm install

# Jalankan dev server
npm run dev

# Bangun versi produksi
npm run build
```
Buka di browser: `http://localhost:3000/`

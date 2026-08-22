# Istiqomah Grosir Stock v2.6.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.6.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Thresholds](https://img.shields.io/badge/Stock-Min_0_&_Max_Unlimited-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Pembaruan & Fitur Unggulan (v2.6.0):

1. ⚖️ **Batas Min & Batas Max Opsional di Bawah Stok Awal**:
   - **Batas Min**: Default = `0` (Tanpa peringatan). Jika diisi angka > 0, aplikasi akan memunculkan peringatan saat stok menipis.
   - **Batas Max**: Default = `Unlimited` (Kapasitas bebas tanpa batas). Disediakan tombol preset kapasitas (`Unlimited`, `50`, `100`, `250`, `500`).
   - Sesi batas stok ini bersifat **opsional (tidak wajib)** dan diletakkan tepat di bawah Stok Awal produk.

2. 🏷️ **Pemilihan Jenis Barang Efektif & Tidak Memanjang**:
   - Dropdown instan + chip *wrap* responsif yang tidak keluar layar.
   - Modal grid 2 kolom lengkap dengan fitur pencarian jenis barang.

3. 🔒 **Proteksi Aksi Berisiko Tinggi**:
   - Wajib mengetik `"RESET"` untuk konfirmasi reset database.
   - Konfirmasi ganda pada mode *Timpa Semua* dan penghapusan produk.

4. ⚡ **UX Input Stok Lancar**:
   - Nilai angka bebas dihapus (*backspace* hingga kosong) dan auto-select saat disentuh.

5. 📦 **Input Stok Awal Produk Baru**:
   - Preset stok awal: `0 (Kosong)`, `1`, `5`, `10`, `12 (Lusin)`, `24 (Dus)`, `50`, `100`.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

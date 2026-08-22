# Istiqomah Grosir Stock v2.5.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.5.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Category UX](https://img.shields.io/badge/UX-Compact_Category_Selection-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Pembaruan & Fitur Unggulan (v2.5.0):

1. 🏷️ **Pemilihan Jenis Barang Efektif & Tidak Memanjang (Compact Category Selector)**:
   - **Dropdown Cepat**: Memilih kategori apa pun dalam 1 sentuhan tanpa harus geser ke kanan.
   - **Wrap Chips Responsif**: Chip kategori teratas otomatis membungkus (*wrap*) rapi ke bawah dan tidak keluar layar.
   - **Modal Grid Jenis dengan Pencarian**: Tombol `+X Lainnya` atau `Semua Jenis` membuka pop-up grid 2 kolom dengan kolom pencarian nama kategori instan.
   - **Form Tambah Produk Ringkas**: Pemilihan jenis produk di form baru kini menggunakan dropdown pintar + chip instan.

2. 🔒 **Proteksi Aksi Berisiko Tinggi (Strict Safeguards)**:
   - Wajib mengetik `"RESET"` untuk konfirmasi pengosongan database.
   - Konfirmasi eksplisit & banner peringatan saat mode *Timpa Semua*.

3. ⚡ **UX Input Stok Lancar**:
   - Nilai angka bebas dihapus (*backspace* hingga kosong) dan auto-select saat disentuh.

4. 📦 **Input Stok Awal Produk Baru**:
   - Preset stok awal langsung di halaman utama form: `0 (Kosong)`, `1`, `5`, `10`, `12 (Lusin)`, `24 (Dus)`, `50`, `100`.

5. 📲 **Auto-Detect File Backup Telegram**:
   - Sinkronisasi otomatis file cadangan JSON dari Telegram atau pembukaan file langsung.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

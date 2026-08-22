# Istiqomah Grosir Stock v2.4.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.4.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Security](https://img.shields.io/badge/Safeguards-Strict_Protection-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Pembaruan & Fitur Unggulan (v2.4.0):

1. 🔒 **Proteksi Aksi Berisiko Tinggi (Strict Safeguards)**:
   - **Reset Semua Data**: Wajib mengetik kata `"RESET"` di dialog keamanan khusus untuk membuka tombol reset database, mencegah klik tidak disengaja.
   - **Mode Timpa Semua (REPLACE)**: Dilengkapi banner peringatan dan dialog konfirmasi eksplisit sebelum file backup menimpa data lantai/master.
   - **Hapus Produk & Akun Petugas**: Dilengkapi konfirmasi rincian nama dan jumlah stok barang.

2. ⚡ **UX Input Stok Lancar**:
   - Input angka penyesuaian stok dan stok awal bebas dihapus/backspace tanpa terkunci di angka 1.
   - Auto-select saat kolom disentuh untuk pengetikan cepat.

3. 📦 **Input Stok Awal pada Tambah Produk Baru**:
   - Form penambahan produk ringkas 1 halaman dengan preset stok awal: `0 (Kosong)`, `1`, `5`, `10`, `12 (Lusin)`, `24 (Dus)`, `50`, `100`.

4. 📲 **Auto-Detect File Backup Telegram**:
   - Deteksi otomatis file JSON backup yang dibagikan dari Telegram, dibuka langsung di HP, di-*drop*, atau di-*paste*.

5. 🖤 **Tampilan Bersih & Minimalis**:
   - Bebas teks AI filler / kalimat panjang yang tidak perlu.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

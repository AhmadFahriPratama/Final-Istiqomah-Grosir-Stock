# Istiqomah Grosir Stock v2.3.0 🏢

Sistem Manajemen Stok Multi-Lantai Offline-First & Aplikasi Android Native untuk Toko Grosir Istiqomah.

[![Android APK Release](https://img.shields.io/badge/Download-Android_APK_v2.3.0-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock/releases/download/v1.0.0/Istiqomah-Grosir-Stock.apk)
[![Theme](https://img.shields.io/badge/Aesthetic-Clean_Monochrome-000000?style=for-the-badge)](https://github.com/AhmadFahriPratama/Final-Istiqomah-Grosir-Stock)

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

## ✨ Pembaruan & Fitur Unggulan (v2.3.0):

1. ⚡ **UX Input Stok Lancar (Bisa Dihapus & Diketik Bebas)**:
   - Input angka penyesuaian stok dan stok awal kini berbasis string murni, dapat dihapus total (*backspace*) tanpa memantul atau terkunci di angka 1/0.
   - Auto-select saat kolom disentuh/fokus untuk pengetikan instan.
   - Tombol cepat hapus/reset dan perbandingan visual `Stok Awal ➔ Perubahan ➔ Stok Akhir`.

2. 📦 **Input Stok Awal pada Tambah Produk Baru**:
   - Kolom **Stok Awal** diletakkan langsung di form utama dengan tombol preset cepat: `0 (Kosong)`, `1`, `5`, `10`, `12 (Lusin)`, `24 (Dus)`, `50`, `100`.
   - Menghilangkan langkah bertingkat yang berbelit sehingga penambahan barang baru menjadi sangat cepat.

3. 📲 **Auto-Detect & Share Target File Backup Telegram**:
   - File JSON cadangan yang dibagikan langsung dari Telegram atau dibuka di HP otomatis dideteksi oleh aplikasi.
   - Menyediakan dialog 1-klik untuk menerapkan backup ke lantai yang sesuai.
   - Mendukung Drag & Drop file `.json` dan Clipboard Paste.

4. 🖤 **Tampilan Bersih & Minimalis (Zero AI Filler)**:
   - Menghilangkan seluruh teks dan buzzword yang tidak perlu untuk tampilan yang ringkas, modern, dan nyaman dilihat.
   - Skema warna monokrom hitam-putih kontras tinggi dengan animasi velvet halus.

---

## 🛠️ Menjalankan Lokal:
```bash
npm install
npm run build
npm run dev
```
Buka di browser: `http://localhost:3333/`

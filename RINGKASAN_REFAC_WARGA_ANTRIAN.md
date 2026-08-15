# Ringkasan Refactoring: Data Warga PDP-Compliant & Antrian Pelayanan RW 09

**Tanggal:** 15 Agustus 2026  
**Branch Git:** `asli`  
**Status Verifikasi:** ✅ **TypeScript 0 Error (`npx tsc --noEmit`)** | ✅ **Build Production Pass (`npm run build`)**

---

## 🌿 1. Strategi Git Branching
- Pengerjaan dilakukan di branch `feature/warga-pdp-antrian-surat` dan telah di-merge secara sempurna (*fast-forward*) ke branch utama **`asli`**.

---

## 🛡️ 2. Perombakan Data Warga (PDP Compliant / Minimisasi Data)
Sesuai dengan prinsip *Data Minimization* UU Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022):

* **Skema Data Database ([`supabase_schema.sql`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/supabase_schema.sql)):**
  Tabel `public.warga` disederhanakan hanya menyimpan 3 atribut non-sensitif:
  1. `nama` (Nama Lengkap Warga)
  2. `tahun_lahir` (Tahun Lahir Warga, e.g. 1990)
  3. `rt` (Nomor RT, e.g. "RT 001")

* **Kalkulasi Usia di Frontend (FE):**
  - Database **hanya menyimpan `tahun_lahir`** (misal `1995`).
  - Saat data dipanggil di Frontend, usia dihitung secara dinamis:  
    $$\text{Usia} = \text{Tahun Sekarang} - \text{Tahun Lahir}$$
  - Tabel UI hanya menampilkan **Nama Lengkap**, **Estimasi Usia** *(misal: 31 Tahun)*, **Wilayah RT**, dan **Aksi**.

* **Pembersihan Data Sensitif (PII):**
  Dihapus total dari Database SQL, Store TypeScript ([`store.ts`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/lib/store.ts)), dan Antarmuka UI:
  - ❌ NIK & Hashes (`nik`, `nik_hash`)
  - ❌ Nomor KK & Hashes (`no_kk`, `no_kk_hash`)
  - ❌ Alamat Detail Tempat Tinggal
  - ❌ Jenis Kelamin
  - ❌ Status Tempat Tinggal (Tetap / Kontrak)
  - ❌ Hubungan & Peran Keluarga

---

## 🎫 3. Fitur Antrian Pelayanan Per Orang
Mengubah fitur generator & cetak kop surat lama menjadi sistem **Papan Antrian Pelayanan Per Orang**:

* **Halaman Dashboard Antrian ([`surat/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/surat/page.tsx)):**
  - Penomoran otomatis antrian permohonan (`A-001`, `A-002`, `A-003`, ...).
  - Banner **Antrian Aktif Sedang Dipanggil**.
  - Papan status Kanban antrian: **Menunggu**, **Diproses**, dan **Selesai**.
  - Fitur aksi real-time untuk memanggil/memproses antrian serta menyelesaikan pelayanan.

* **Filter Lonceng Notifikasi Header ([`Header.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/components/Header.tsx)):**
  - Antrian dengan status **`Selesai`** atau **`Dibatalkan`** **otomatis di-filter dan tidak muncul lagi** di notifikasi lonceng header.
  - Ditambahkan custom event listener real-time (`antrian_updated`) agar angka badge & popover notifikasi langsung terbarui begitu antrian diselesaikan.

---

## 🧹 4. Pembersihan Pengaturan & Tampilan UI
* **Pengaturan Aplikasi ([`configStore.ts`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/lib/configStore.ts) & [`config/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/config/page.tsx)):**
  - Menghapus format prefix nomor surat & helper cetak kop surat.
  - Mengubah Bagian 1 Pengaturan menjadi **"Identitas Sekretariat RW"**.
* **Pembersihan Badge:**
  - Menghapus badge/teks `verified_user`, `Patuh UU PDP 2022`, `Terlindungi UU PDP`, dan `PDP SAFE` dari halaman Warga & Tamu.
* **Navigasi Sidebar ([`Sidebar.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/components/Sidebar.tsx)):**
  - Mengubah menu `/surat` dari label *"Surat Pengantar"* menjadi *"Antrian Pelayanan"*.

---

## 📁 5. Daftar Berkas Utama yang Diubah
1. [`supabase_schema.sql`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/supabase_schema.sql)
2. [`src/lib/store.ts`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/lib/store.ts)
3. [`src/lib/configStore.ts`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/lib/configStore.ts)
4. [`src/app/warga/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/warga/page.tsx)
5. [`src/app/surat/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/surat/page.tsx)
6. [`src/app/config/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/config/page.tsx)
7. [`src/app/guest/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/guest/page.tsx)
8. [`src/app/dashboard/page.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/app/dashboard/page.tsx)
9. [`src/components/Sidebar.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/components/Sidebar.tsx)
10. [`src/components/Header.tsx`](file:///c:/Users/mjibr/.gemini/antigravity/scratch/portal-rw09/src/components/Header.tsx)

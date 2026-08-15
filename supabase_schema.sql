-- ========================================================
-- SCHEMA & SEED DATA: PORTAL RW 09 KEBON BAWANG
-- Supabase Hardened Security (Zero Plaintext NIK / KK in DB)
-- Jalankan di Supabase SQL Editor (supabase.com)
-- ========================================================

-- Enable pgcrypto extension for SHA-256 digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RESET/CLEAN TABLE RE-CREATION (Menghindari error kolom lama)
DROP TABLE IF EXISTS public.warga CASCADE;
DROP TABLE IF EXISTS public.surat_pengantar CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.keuangan CASCADE;
DROP TABLE IF EXISTS public.kegiatan CASCADE;
DROP TABLE IF EXISTS public.iuran CASCADE;
DROP TABLE IF EXISTS public.pengumuman CASCADE;

-- 0. TABEL ADMIN USERS (Password SHA-256 Hashed)
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Stored strictly as SHA-256 HASH
  nama_admin TEXT DEFAULT 'Administrator RW 09',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Admin dengan Password 'Sayapakmimbar123#' (SHA-256 Hash)
INSERT INTO public.admin_users (username, password, nama_admin) VALUES
('admin', '40ab988f0f4de47d2a8b6422d1aa87598f23d9bc475519e4db5a9b9a2221d2e8', 'Pengurus RW 09');

-- 1. TABEL WARGA (Hanya Nama, Usia, RT)
CREATE TABLE public.warga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  usia INT NOT NULL,
  rt VARCHAR(10) NOT NULL DEFAULT 'RT 001',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KEUANGAN
CREATE TABLE public.keuangan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT NOT NULL,
  jenis VARCHAR(20) NOT NULL,
  jumlah NUMERIC NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL KEGIATAN
CREATE TABLE public.kegiatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  tanggal DATE NOT NULL,
  waktu VARCHAR(20) NOT NULL,
  lokasi TEXT NOT NULL,
  deskripsi TEXT,
  status VARCHAR(20) DEFAULT 'Mendatang',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL IURAN
CREATE TABLE public.iuran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blok VARCHAR(20) NOT NULL,
  nama_warga TEXT NOT NULL,
  bulan VARCHAR(20) NOT NULL,
  tahun INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Belum',
  jumlah NUMERIC NOT NULL DEFAULT 50000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ANTRIAN PELAYANAN (Dahulu Surat Pengantar)
CREATE TABLE public.surat_pengantar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no_antrian VARCHAR(20) NOT NULL,
  nama_pemohon TEXT NOT NULL,
  rt VARCHAR(10) NOT NULL DEFAULT 'RT 001',
  keperluan TEXT NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Menunggu',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PENGUMUMAN
CREATE TABLE public.pengumuman (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  isi TEXT NOT NULL,
  penting BOOLEAN DEFAULT FALSE,
  kategori VARCHAR(30) DEFAULT 'Pengumuman',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA MOCK WARGA (MINIMAL DATA: NAMA, USIA, RT)
INSERT INTO public.warga (nama, usia, rt) VALUES
('Agus Setiawan', 47, 'RT 004'),
('Dewi Lestari', 44, 'RT 004'),
('Rifky Setiawan', 16, 'RT 004'),
('Ananda Putri', 6, 'RT 004'),
('Siti Rahmawati', 34, 'RT 001'),
('Bambang Pamungkas', 62, 'RT 003'),
('Eko Prasetyo', 41, 'RT 004');

-- SEED DATA MOCK ANTRIAN PELAYANAN
INSERT INTO public.surat_pengantar (no_antrian, nama_pemohon, rt, keperluan, status) VALUES
('A-001', 'Ananda Putri', 'RT 004', 'Pengurusan Surat Keterangan Domisili', 'Selesai'),
('A-002', 'Agus Setiawan', 'RT 004', 'Konsultasi Pengajuan Permohonan KTP Baru', 'Diproses'),
('A-003', 'Siti Rahmawati', 'RT 001', 'Pengurusan SKTM (Surat Keterangan Tidak Mampu)', 'Menunggu');

-- SEED DATA MOCK KEUANGAN
INSERT INTO public.keuangan (tanggal, keterangan, jenis, jumlah, kategori) VALUES
('2024-10-01', 'Iuran Kebersihan Bulanan Oktober', 'pemasukan', 12500000, 'Iuran'),
('2024-10-05', 'Pembelian Alat Kerja Bakti RT 01-05', 'pengeluaran', 1500000, 'Fasilitas'),
('2024-10-10', 'Honorarium Petugas Keamanan', 'pengeluaran', 2700000, 'Kebersihan'),
('2024-10-15', 'Sponsorship Kegiatan HUT RI', 'pemasukan', 5000000, 'Donasi');

-- SEED DATA MOCK KEGIATAN
INSERT INTO public.kegiatan (judul, tanggal, waktu, lokasi, deskripsi, status) VALUES
('Kerja Bakti Masal RW 09', '2024-11-02', '07:00 WIB', 'Area Taman & Pos RW 09', 'Pembersihan saluran air dan lingkungan menjelang musim hujan', 'Mendatang'),
('Posyandu Balita & Lansia', '2024-11-05', '08:30 WIB', 'Balai Warga RW 09', 'Pemeriksaan kesehatan rutin balita dan lansia', 'Mendatang'),
('Rapat Siskamling Perwakilan RT', '2024-11-10', '19:30 WIB', 'Rumah Ketua RW 09', 'Evaluasi sistem keamanan keliling malam', 'Mendatang');

-- SEED DATA MOCK PENGUMUMAN
INSERT INTO public.pengumuman (judul, tanggal, isi, penting, kategori) VALUES
('Rapat Koordinasi Keamanan Lingkungan', '01 Nov 2024', 'Diharapkan perwakilan tiap RT untuk hadir dalam agenda pembahasan sistem keamanan keliling (Siskamling) baru.', true, 'Penting'),
('Jadwal Pelayanan Posyandu Bulan November', '28 Okt 2024', 'Pelayanan Posyandu balita dan lansia akan dilaksanakan pada tanggal 5 November di Balai Warga.', false, 'Informasi');

-- ENABLE RLS & PUBLIC POLICIES
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_pengantar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select admin" ON public.admin_users FOR SELECT USING (true);

CREATE POLICY "Allow public select warga" ON public.warga FOR SELECT USING (true);
CREATE POLICY "Allow public insert warga" ON public.warga FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update warga" ON public.warga FOR UPDATE USING (true);

CREATE POLICY "Allow public select keuangan" ON public.keuangan FOR SELECT USING (true);
CREATE POLICY "Allow public insert keuangan" ON public.keuangan FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select kegiatan" ON public.kegiatan FOR SELECT USING (true);
CREATE POLICY "Allow public insert kegiatan" ON public.kegiatan FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update kegiatan" ON public.kegiatan FOR UPDATE USING (true);

CREATE POLICY "Allow public select iuran" ON public.iuran FOR SELECT USING (true);
CREATE POLICY "Allow public insert iuran" ON public.iuran FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update iuran" ON public.iuran FOR UPDATE USING (true);

CREATE POLICY "Allow public select surat" ON public.surat_pengantar FOR SELECT USING (true);
CREATE POLICY "Allow public insert surat" ON public.surat_pengantar FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update surat" ON public.surat_pengantar FOR UPDATE USING (true);

CREATE POLICY "Allow public select pengumuman" ON public.pengumuman FOR SELECT USING (true);
CREATE POLICY "Allow public insert pengumuman" ON public.pengumuman FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pengumuman" ON public.pengumuman FOR UPDATE USING (true);


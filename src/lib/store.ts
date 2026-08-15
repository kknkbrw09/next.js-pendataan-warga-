import { supabase, isSupabaseConfigured } from './supabase';

export interface Warga {
  id: string;
  nama: string;
  usia: number;
  rt: string;
}

export interface TransaksiKeuangan {
  id: string;
  tanggal: string;
  keterangan: string;
  jenis: 'pemasukan' | 'pengeluaran';
  jumlah: number;
  kategori: string;
}

export interface Kegiatan {
  id: string;
  judul: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  deskripsi: string;
  status: 'Mendatang' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
}

export interface Iuran {
  id: string;
  blok: string;
  namaWarga: string;
  bulan: string;
  tahun: number;
  status: 'Lunas' | 'Belum';
  jumlah: number;
}

export interface SuratPengantar {
  id: string;
  noAntrian: string;
  namaPemohon: string;
  rt: string;
  keperluan: string;
  tanggal: string;
  status: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan';
}

export interface Pengumuman {
  id: string;
  judul: string;
  tanggal: string;
  isi: string;
  penting: boolean;
  kategori: string;
}

export const INITIAL_WARGA: Warga[] = [
  { id: '1', nama: 'Agus Setiawan', usia: 47, rt: 'RT 004' },
  { id: '2', nama: 'Dewi Lestari', usia: 44, rt: 'RT 004' },
  { id: '3', nama: 'Siti Rahmawati', usia: 34, rt: 'RT 001' },
  { id: '4', nama: 'Bambang Pamungkas', usia: 62, rt: 'RT 003' },
  { id: '5', nama: 'Eko Prasetyo', usia: 41, rt: 'RT 004' },
  { id: '6', nama: 'Rifky Setiawan', usia: 16, rt: 'RT 004' },
  { id: '7', nama: 'Ananda Putri', usia: 6, rt: 'RT 004' },
];

export const INITIAL_KEUANGAN: TransaksiKeuangan[] = [
  { id: '1', tanggal: '2024-10-25', keterangan: 'Biaya Kebersihan Lingkungan', jenis: 'pengeluaran', jumlah: 1500000, kategori: 'Kebersihan' },
  { id: '2', tanggal: '2024-10-24', keterangan: 'Iuran Bulanan Warga Blok A', jenis: 'pemasukan', jumlah: 5200000, kategori: 'Iuran' },
  { id: '3', tanggal: '2024-10-20', keterangan: 'Pembelian Lampu Jalan RT 03', jenis: 'pengeluaran', jumlah: 750000, kategori: 'Fasilitas' },
  { id: '4', tanggal: '2024-10-15', keterangan: 'Penerimaan Iuran Sampah & Keamanan', jenis: 'pemasukan', jumlah: 8300000, kategori: 'Iuran' },
  { id: '5', tanggal: '2024-10-10', keterangan: 'Sponsor Kegiatan 17 Agustus', jenis: 'pemasukan', jumlah: 2000000, kategori: 'Donasi' },
];

export const INITIAL_KEGIATAN: Kegiatan[] = [
  { id: '1', judul: 'Kerja Bakti Lingkungan', tanggal: '2024-11-02', waktu: '08:00 WIB', lokasi: 'Area Taman RW 09', deskripsi: 'Membersihkan selokan dan pemangkasan dahan pohon menjelang musim hujan.', status: 'Mendatang' },
  { id: '2', judul: 'Posyandu Balita & Lansia', tanggal: '2024-11-05', waktu: '09:00 WIB', lokasi: 'Balai Warga RW 09', deskripsi: 'Pemeriksaan kesehatan gratis dan pembagian makanan tambahan.', status: 'Mendatang' },
  { id: '3', judul: 'Arisan & Pengajian Rutin', tanggal: '2024-11-10', waktu: '19:30 WIB', lokasi: 'Rumah Ketua RW', deskripsi: 'Silaturahmi bulanan warga dan pembahasan keamanan lingkungan.', status: 'Mendatang' },
];

const now = new Date();
const monthNamesIndo = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const currentBulan = monthNamesIndo[now.getMonth()];
const currentTahun = now.getFullYear();

export const INITIAL_IURAN: Iuran[] = [
  { id: '1', blok: 'Blok A', namaWarga: 'Budi Santoso', bulan: currentBulan, tahun: currentTahun, status: 'Lunas', jumlah: 50000 },
  { id: '2', blok: 'Blok B', namaWarga: 'Siti Aminah', bulan: currentBulan, tahun: currentTahun, status: 'Belum', jumlah: 50000 },
  { id: '3', blok: 'Blok C', namaWarga: 'Rudi Hermawan', bulan: currentBulan, tahun: currentTahun, status: 'Lunas', jumlah: 50000 },
  { id: '4', blok: 'Blok D', namaWarga: 'Hendrikus', bulan: currentBulan, tahun: currentTahun, status: 'Lunas', jumlah: 50000 },
];

export const INITIAL_SURAT: SuratPengantar[] = [
  { id: '1', noAntrian: 'A-001', namaPemohon: 'Ananda Putri', rt: 'RT 004', keperluan: 'Pengurusan Surat Keterangan Domisili', tanggal: '2024-10-12', status: 'Selesai' },
  { id: '2', noAntrian: 'A-002', namaPemohon: 'Agus Setiawan', rt: 'RT 004', keperluan: 'Konsultasi Pengajuan Permohonan KTP Baru', tanggal: '2024-10-18', status: 'Diproses' },
  { id: '3', noAntrian: 'A-003', namaPemohon: 'Siti Rahmawati', rt: 'RT 001', keperluan: 'Pengurusan SKTM (Surat Keterangan Tidak Mampu)', tanggal: '2024-10-20', status: 'Menunggu' },
];

export const INITIAL_PENGUMUMAN: Pengumuman[] = [
  { id: '1', judul: 'Rapat Koordinasi Keamanan Lingkungan', tanggal: '25 Okt 2024', isi: 'Diharapkan perwakilan tiap RT untuk hadir dalam agenda pembahasan sistem keamanan keliling (Siskamling) baru.', penting: true, kategori: 'Penting' },
  { id: '2', judul: 'Penyemprotan Disinfektan Rutin', tanggal: '20 Okt 2024', isi: 'Jadwal penyemprotan area fasilitas umum akan dilaksanakan mulai pukul 09:00 WIB.', penting: false, kategori: 'Rutin' },
  { id: '3', judul: 'Kerja Bakti Massal RW 09', tanggal: '15 Okt 2024', isi: 'Kerja bakti massal akan dilaksanakan pada hari Minggu depan pukul 07:00 WIB. Diharapkan partisipasi warga.', penting: true, kategori: 'Pengumuman' },
];

// Helper functions for Supabase CRUD
export async function getWargaFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('warga').select('*');
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getKeuanganFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('keuangan').select('*').order('tanggal', { ascending: false });
    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

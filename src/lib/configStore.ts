export interface AppConfig {
  // General RW Info Config
  alamatSekretariat: string;
  namaKetuaRw: string;
  kotaAdmin: string;

  // Iuran Config
  nominalIuranStandard: number;
  jatuhTempoIuran: string;
  metodePembayaran: string;
  targetIuranMode: 'perKk' | 'perWarga' | 'perUmur' | 'perRt';
  minUsiaIuran: number;
  maxUsiaIuran: number;
  iuranPerRtMap: Record<string, number>;

  // Kegiatan Config
  defaultLokasiKegiatan: string;
  defaultWaktuKegiatan: string;
  kategoriKegiatanList: string[];
  modeStatusKegiatan: 'auto' | 'manual';
  defaultStatusKegiatan: 'Mendatang' | 'Berlangsung' | 'Selesai';

  // Akun Admin Config
  adminUsername?: string;
  adminPassword?: string;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  alamatSekretariat: 'Jln. Swasembada Barat VI. No.39 Rt.016/09',
  namaKetuaRw: 'Bpk. Ketua RW 09',
  kotaAdmin: 'Jakarta Utara',

  nominalIuranStandard: 50000,
  jatuhTempoIuran: 'Tanggal 10 tiap bulan',
  metodePembayaran: 'Tunai via RT / Transfer Kas RW',
  targetIuranMode: 'perKk',
  minUsiaIuran: 17,
  maxUsiaIuran: 60,
  iuranPerRtMap: {
    'RT 01': 50000,
    'RT 02': 50000,
    'RT 03': 50000,
    'RT 04': 50000,
    'RT 05': 50000,
    'RT 06': 50000,
    'RT 07': 50000,
  },

  defaultLokasiKegiatan: 'Balai Warga RW 09',
  defaultWaktuKegiatan: '08:00 WIB',
  kategoriKegiatanList: ['Rapat RT/RW', 'Kerja Bakti', 'Posyandu', 'Siskamling', 'Pengajian'],
  modeStatusKegiatan: 'manual',
  defaultStatusKegiatan: 'Mendatang',

  adminUsername: 'admin',
  adminPassword: 'admin',
};

export function getAppConfig(): AppConfig {
  if (typeof window === 'undefined') return DEFAULT_APP_CONFIG;
  try {
    const saved = localStorage.getItem('rw09_app_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_APP_CONFIG,
        ...parsed,
        iuranPerRtMap: { ...DEFAULT_APP_CONFIG.iuranPerRtMap, ...(parsed.iuranPerRtMap || {}) },
      };
    }
  } catch (e) {
    console.error('Error reading app config', e);
  }
  return DEFAULT_APP_CONFIG;
}

export function saveAppConfig(newConfig: Partial<AppConfig>): AppConfig {
  const current = getAppConfig();
  const updated = { ...current, ...newConfig };
  if (typeof window !== 'undefined') {
    localStorage.setItem('rw09_app_config', JSON.stringify(updated));
  }
  return updated;
}

export function isKegiatanSelesai(tanggalStr: string, waktuStr: string = '23:59'): boolean {
  if (!tanggalStr) return false;
  try {
    const config = getAppConfig();
    if (config.modeStatusKegiatan === 'manual') {
      return false;
    }
    const now = new Date();
    const parts = tanggalStr.split('-');
    if (parts.length < 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    let hours = 23;
    let minutes = 59;
    const timeMatch = waktuStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
    }

    const eventDate = new Date(year, month - 1, day, hours, minutes);
    return now.getTime() > eventDate.getTime();
  } catch (e) {
    return false;
  }
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  INITIAL_WARGA,
  INITIAL_KEUANGAN,
  INITIAL_KEGIATAN,
  INITIAL_IURAN,
  INITIAL_PENGUMUMAN,
  INITIAL_SURAT,
} from '@/lib/store';
import { isKegiatanSelesai } from '@/lib/configStore';

interface ActivityItem {
  id: string;
  type: 'warga' | 'keuangan' | 'surat';
  title: string;
  time: string;
  role: string;
  icon: string;
  colorBg: string;
  colorText: string;
}

/* ========================================================
   LOADING SKELETON COMPONENTS WITH PULSE ANIMATIONS
   ======================================================== */
function SummaryCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse flex flex-col justify-between h-40">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
        <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div>
        <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-36 h-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse flex flex-col justify-between h-80">
      <div className="flex items-center justify-between mb-6">
        <div className="w-48 h-6 bg-gray-200 rounded"></div>
        <div className="w-24 h-6 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-60 bg-gray-50 rounded-xl flex items-end justify-around p-6 gap-3">
        <div className="w-8 bg-gray-200 rounded-t-lg h-[40%]"></div>
        <div className="w-8 bg-gray-300 rounded-t-lg h-[75%]"></div>
        <div className="w-8 bg-gray-200 rounded-t-lg h-[55%]"></div>
        <div className="w-8 bg-gray-300 rounded-t-lg h-[90%]"></div>
        <div className="w-8 bg-gray-200 rounded-t-lg h-[60%]"></div>
      </div>
    </div>
  );
}

function RecentActivitySkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse space-y-5">
      <div className="w-36 h-6 bg-gray-200 rounded mb-4"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="bg-[#00216e] text-white p-8 rounded-xl animate-pulse flex flex-col justify-between shadow-md h-full min-h-[300px]">
      <div className="space-y-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl"></div>
        <div className="w-3/4 h-7 bg-white/20 rounded"></div>
        <div className="w-full h-4 bg-white/20 rounded"></div>
        <div className="w-5/6 h-4 bg-white/20 rounded"></div>
      </div>
      <div className="mt-8 w-full h-12 bg-white/30 rounded-lg"></div>
    </div>
  );
}

export default function DashboardPage() {
  const [growthPeriod, setGrowthPeriod] = useState<'bulanan' | 'kuartal' | 'tahunan'>('bulanan');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [rawWargaList, setRawWargaList] = useState<any[]>([]);

  const [keuanganPeriod, setKeuanganPeriod] = useState<'bulanan' | 'kuartal' | 'tahunan'>('bulanan');
  const [keuanganYear, setKeuanganYear] = useState<number>(2026);
  const [rawKeuanganList, setRawKeuanganList] = useState<any[]>([]);
  const [rawKegiatanList, setRawKegiatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Dashboard Stats
  const [stats, setStats] = useState({
    totalWarga: 1240,
    totalPendapatanBulanan: 15500000,
    totalPengeluaranBulanan: 2250000,
    totalKegiatan: 8,
    kegiatanMendatang: 2,
    persentaseIuran: 85,
    iuranLunasCount: 1054,
    iuranBelumCount: 186,
  });

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'warga',
      title: 'Warga baru ditambahkan: Keluarga Bpk. Sastro',
      time: 'Hari ini, 10:24 WIB',
      role: 'Admin',
      icon: 'person_add',
      colorBg: 'bg-blue-50',
      colorText: 'text-[#00216e]',
    },
    {
      id: '2',
      type: 'keuangan',
      title: 'Penerimaan Iuran Sampah & Keamanan dari Blok C-12',
      time: 'Kemarin, 16:45 WIB',
      role: 'Bendahara',
      icon: 'payments',
      colorBg: 'bg-red-50',
      colorText: 'text-[#bb0013]',
    },
    {
      id: '3',
      type: 'surat',
      title: 'Surat Pengantar Domisili diterbitkan: Ananda Putri',
      time: '12 Mei 2024, 09:12 WIB',
      role: 'Sekretaris',
      icon: 'edit_document',
      colorBg: 'bg-indigo-50',
      colorText: 'text-[#012366]',
    },
  ]);

  const [latestAnnouncement, setLatestAnnouncement] = useState<{
    judul: string;
    isi: string;
    tanggal: string;
  }>({
    judul: 'Rapat Koordinasi Keamanan Lingkungan',
    isi: 'Diharapkan perwakilan tiap RT untuk hadir dalam agenda pembahasan sistem keamanan keliling (Siskamling) baru.',
    tanggal: '01 Nov 2024',
  });

  const [keuanganMonthlyChart, setKeuanganMonthlyChart] = useState<
    Array<{ month: string; inc: number; exp: number; rawInc: number; rawExp: number }>
  >([
    { month: 'Apr', inc: 70, exp: 45, rawInc: 7000000, rawExp: 4500000 },
    { month: 'Mei', inc: 85, exp: 30, rawInc: 8500000, rawExp: 3000000 },
    { month: 'Jun', inc: 60, exp: 55, rawInc: 6000000, rawExp: 5500000 },
    { month: 'Jul', inc: 90, exp: 40, rawInc: 9000000, rawExp: 4000000 },
    { month: 'Ags', inc: 75, exp: 50, rawInc: 7500000, rawExp: 5000000 },
  ]);

  const [kegiatanMonthlyChart, setKegiatanMonthlyChart] = useState<
    Array<{ month: string; count: number; h: string; active?: boolean }>
  >([
    { month: 'JAN', count: 3, h: '40%' },
    { month: 'FEB', count: 5, h: '60%' },
    { month: 'MAR', count: 2, h: '30%' },
    { month: 'APR', count: 7, h: '80%' },
    { month: 'MEI', count: 8, h: '90%', active: true },
    { month: 'JUN', count: 4, h: '50%' },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const safeQuery = async (table: string, orderCol?: string) => {
          if (!supabase) return [];
          const client = supabase;
          try {
            console.log(`[Supabase DB] 📡 Fetching table '${table}'...`);
            let query = client.from(table).select('*');
            if (orderCol) {
              query = query.order(orderCol, { ascending: false });
            }
            const res = await query;
            if (res.error) {
              console.warn(`[Supabase DB Error] Table '${table}':`, res.error.message);
            } else {
              console.log(`[Supabase DB] ✅ Table '${table}' returned ${res.data?.length || 0} rows`, res.data);
            }
            return res.data || [];
          } catch (err) {
            console.error(`[Supabase DB Exception] Table '${table}':`, err);
            return [];
          }
        };

        const [wargaData, keuanganData, kegiatanData, iuranData, pengumumanData, suratData] =
          await Promise.all([
            safeQuery('warga'),
            safeQuery('keuangan', 'created_at'),
            safeQuery('kegiatan', 'created_at'),
            safeQuery('iuran'),
            safeQuery('pengumuman', 'created_at'),
            safeQuery('surat_pengantar', 'created_at'),
          ]);

        if (!isMounted) return;

        // 1. Process Warga Data
        setRawWargaList(wargaData || []);
        const totalWargaCount = wargaData.length > 0 ? wargaData.length : INITIAL_WARGA.length;

        // 2. Process Keuangan Data
        setRawKeuanganList(keuanganData || []);
        let totalIncome = 0;
        let totalExpense = 0;

        if (keuanganData.length > 0) {
          totalIncome = keuanganData
            .filter((k: any) => k.jenis === 'pemasukan')
            .reduce((sum: number, k: any) => sum + Number(k.jumlah || 0), 0);
          totalExpense = keuanganData
            .filter((k: any) => k.jenis === 'pengeluaran')
            .reduce((sum: number, k: any) => sum + Number(k.jumlah || 0), 0);
        } else {
          totalIncome = INITIAL_KEUANGAN.filter((k) => k.jenis === 'pemasukan').reduce(
            (sum, k) => sum + k.jumlah,
            0
          );
          totalExpense = INITIAL_KEUANGAN.filter((k) => k.jenis === 'pengeluaran').reduce(
            (sum, k) => sum + k.jumlah,
            0
          );
        }

        // 3. Process Kegiatan Data
        setRawKegiatanList(kegiatanData || []);
        const totalKegiatanCount = kegiatanData.length > 0 ? kegiatanData.length : INITIAL_KEGIATAN.length;
        const mendatangKegiatanCount = kegiatanData.length > 0
          ? kegiatanData.filter((k: any) => !isKegiatanSelesai(k.tanggal, k.waktu) && k.status !== 'Selesai').length
          : INITIAL_KEGIATAN.filter((k) => !isKegiatanSelesai(k.tanggal, k.waktu) && k.status !== 'Selesai').length;

        // 4. Process Iuran Data
        const totalIuranCount = iuranData.length > 0 ? iuranData.length : INITIAL_IURAN.length;
        const lunasCount = iuranData.length > 0
          ? iuranData.filter((i: any) => i.status === 'Lunas').length
          : INITIAL_IURAN.filter((i) => i.status === 'Lunas').length;
        const pctIuran = totalIuranCount > 0 ? Math.round((lunasCount / totalIuranCount) * 100) : 85;

        setStats({
          totalWarga: totalWargaCount,
          totalPendapatanBulanan: totalIncome,
          totalPengeluaranBulanan: totalExpense,
          totalKegiatan: totalKegiatanCount,
          kegiatanMendatang: mendatangKegiatanCount,
          persentaseIuran: pctIuran,
          iuranLunasCount: lunasCount,
          iuranBelumCount: totalIuranCount - lunasCount,
        });

        // 5. Build Dynamic Keuangan Chart from DB transactions
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const nowObj = new Date();
        const last5Months: Array<{ label: string; monthIdx: number; year: number }> = [];

        for (let i = 4; i >= 0; i--) {
          const d = new Date(nowObj.getFullYear(), nowObj.getMonth() - i, 1);
          last5Months.push({
            label: monthNamesShort[d.getMonth()],
            monthIdx: d.getMonth(),
            year: d.getFullYear(),
          });
        }

        const sourceKeuanganList = keuanganData.length > 0 ? keuanganData : INITIAL_KEUANGAN.map((k) => ({
          jenis: k.jenis,
          jumlah: k.jumlah,
          tanggal: k.tanggal,
        }));

        const mChartData = last5Months.map((m) => {
          let rawInc = 0;
          let rawExp = 0;

          sourceKeuanganList.forEach((k: any) => {
            if (!k.tanggal) return;
            const kDate = new Date(k.tanggal);
            if (isNaN(kDate.getTime())) return;

            if (kDate.getMonth() === m.monthIdx && kDate.getFullYear() === m.year) {
              const amt = Number(k.jumlah || 0);
              if (k.jenis === 'pemasukan') rawInc += amt;
              else if (k.jenis === 'pengeluaran') rawExp += amt;
            }
          });

          return {
            month: m.label,
            rawInc,
            rawExp,
          };
        });

        let maxAmt = 1;
        mChartData.forEach((item) => {
          if (item.rawInc > maxAmt) maxAmt = item.rawInc;
          if (item.rawExp > maxAmt) maxAmt = item.rawExp;
        });

        const finalKeuanganChart = mChartData.map((item) => ({
          month: item.month,
          rawInc: item.rawInc,
          rawExp: item.rawExp,
          inc: maxAmt > 0 && item.rawInc > 0 ? Math.max(Math.round((item.rawInc / maxAmt) * 85), 12) : 8,
          exp: maxAmt > 0 && item.rawExp > 0 ? Math.max(Math.round((item.rawExp / maxAmt) * 85), 12) : 8,
        }));

        setKeuanganMonthlyChart(finalKeuanganChart);

        // 6. Process Latest Announcement
        if (pengumumanData.length > 0) {
          const pentingAnn = pengumumanData.find((p: any) => p.penting);
          const selectedAnn = pentingAnn || pengumumanData[0];
          setLatestAnnouncement({
            judul: selectedAnn.judul,
            isi: selectedAnn.isi,
            tanggal: selectedAnn.tanggal || 'Terkini',
          });
        }

        // 6. Build Recent Activities Feed
        const actList: Array<ActivityItem & { sortTime: string }> = [];

        if (wargaData.length > 0) {
          wargaData.slice(0, 3).forEach((w: any) => {
            actList.push({
              id: 'warga-' + w.id,
              type: 'warga',
              title: `Warga terdaftar: ${w.nama}`,
              time: `${w.rt || 'RT 01'} / ${w.rw || 'RW 09'}`,
              role: 'Pengurus RW',
              icon: 'person_add',
              colorBg: 'bg-blue-50',
              colorText: 'text-[#00216e]',
              sortTime: w.created_at || '2024-10-01',
            });
          });
        }

        if (keuanganData.length > 0) {
          keuanganData.slice(0, 3).forEach((k: any) => {
            actList.push({
              id: 'keuangan-' + k.id,
              type: 'keuangan',
              title: `${k.jenis === 'pemasukan' ? 'Penerimaan' : 'Pengeluaran'}: ${k.keterangan}`,
              time: `${k.tanggal || 'Terkini'} • Rp ${Number(k.jumlah || 0).toLocaleString('id-ID')}`,
              role: 'Bendahara',
              icon: 'payments',
              colorBg: 'bg-red-50',
              colorText: 'text-[#bb0013]',
              sortTime: k.created_at || k.tanggal || '2024-10-01',
            });
          });
        }

        if (suratData.length > 0) {
          suratData.slice(0, 3).forEach((s: any) => {
            actList.push({
              id: 'surat-' + s.id,
              type: 'surat',
              title: `${s.jenis_surat}: ${s.nama_pemohon}`,
              time: `${s.tanggal || 'Terkini'} • ${s.status}`,
              role: 'Sekretaris',
              icon: 'edit_document',
              colorBg: 'bg-indigo-50',
              colorText: 'text-[#012366]',
              sortTime: s.created_at || s.tanggal || '2024-10-01',
            });
          });
        }

        if (actList.length > 0) {
          actList.sort((a, b) => (a.sortTime > b.sortTime ? -1 : 1));
          setRecentActivities(actList.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load dashboard Supabase data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    // Safety timeout to guarantee unblocking loading state
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const formatRupiah = (val: number) => {
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(1)}Jt`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  const chartLabels =
    growthPeriod === 'bulanan'
      ? [`Jan ${selectedYear}`, `Apr ${selectedYear}`, `Jul ${selectedYear}`, `Okt ${selectedYear}`, `Des ${selectedYear}`]
      : growthPeriod === 'kuartal'
      ? [
          `K1 ${selectedYear} (Jan-Mar)`,
          `K2 ${selectedYear} (Apr-Jun)`,
          `K3 ${selectedYear} (Jul-Sep)`,
          `K4 ${selectedYear} (Okt-Des)`,
          `K1 ${selectedYear + 1}`,
        ]
      : [
          `${selectedYear - 4}`,
          `${selectedYear - 3}`,
          `${selectedYear - 2}`,
          `${selectedYear - 1}`,
          `${selectedYear}`,
        ];

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Dashboard" />

        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Status sync indicator */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#e2e2e2] shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className="text-xs font-semibold text-[#1a1c1c]">
                Database Supabase: <span className="text-emerald-600 font-bold">Terhubung & Tersinkronkan</span>
              </p>
            </div>
            {loading ? (
              <span className="text-xs font-medium text-[#00216e] animate-pulse flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                Menyinkronkan data...
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-500">
                Terakhir diperbarui: Hari ini
              </span>
            )}
          </div>

          {/* Summary Cards Row (With Skeletons) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-500">
            {loading ? (
              <>
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
                <SummaryCardSkeleton />
              </>
            ) : (
              <>
                {/* Card 1: Total Warga */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#00216e] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-[#00216e]/10 text-[#00216e]">
                      <span className="material-symbols-outlined font-bold">group</span>
                    </div>
                    <span className="text-xs font-semibold text-[#444653] bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      Live DB
                    </span>
                  </div>
                  <p className="text-sm text-[#444653] font-semibold mb-1">Total Warga</p>
                  <h3 className="text-3xl font-bold text-[#00216e]">{stats.totalWarga.toLocaleString('id-ID')}</h3>
                </div>

                {/* Card 2: Total Kas Saat Ini */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#bb0013] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-[#bb0013]/10 text-[#bb0013]">
                      <span className="material-symbols-outlined font-bold">account_balance_wallet</span>
                    </div>
                    <span className="text-xs font-semibold text-[#444653] bg-red-50 text-[#bb0013] px-2 py-1 rounded-full">
                      Kas RW
                    </span>
                  </div>
                  <p className="text-sm text-[#444653] font-semibold mb-1">Total Kas Saat Ini</p>
                  <h3 className="text-3xl font-bold text-[#bb0013]">
                    {formatRupiah(stats.totalPendapatanBulanan - stats.totalPengeluaranBulanan)}
                  </h3>
                </div>

                {/* Card 3: Total Kegiatan */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gray-100 text-[#444653]">
                      <span className="material-symbols-outlined font-bold">event_available</span>
                    </div>
                    <span className="text-xs font-bold text-[#00216e]">
                      Mendatang: {stats.kegiatanMendatang}
                    </span>
                  </div>
                  <p className="text-sm text-[#444653] font-semibold mb-1">Total Kegiatan</p>
                  <h3 className="text-3xl font-bold text-[#1a1c1c]">{stats.totalKegiatan}</h3>
                </div>

                {/* Card 4: Persentase Iuran */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#00216e] shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-[#00216e]/10 text-[#00216e]">
                      <span className="material-symbols-outlined font-bold">payments</span>
                    </div>
                    <div className="flex items-center text-[#bb0013] font-bold text-xs bg-red-50 px-2 py-1 rounded-full">
                      <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                      {stats.persentaseIuran}%
                    </div>
                  </div>
                  <p className="text-sm text-[#444653] font-semibold mb-1">Persentase Iuran</p>
                  <h3 className="text-3xl font-bold text-[#00216e]">{stats.persentaseIuran}%</h3>
                </div>
              </>
            )}
          </div>

          {/* Charts Grid (2x2) (With Skeletons) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {loading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : (
              <>
                {/* Chart 1: Income vs Expenses */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
                  {(() => {
                    const sourceKeuangan =
                      rawKeuanganList.length > 0
                        ? rawKeuanganList
                        : INITIAL_KEUANGAN.map((k, idx) => ({
                            jenis: k.jenis,
                            jumlah: k.jumlah,
                            tanggal: k.tanggal || `2026-0${(idx % 9) + 1}-10`,
                          }));

                    const realNow = new Date();
                    const realYear = realNow.getFullYear();
                    const realMonthIdx = realNow.getMonth(); // 7 for August

                    let displayLabels: string[] = [];
                    let chartItems: Array<{ label: string; rawInc: number; rawExp: number }> = [];

                    if (keuanganPeriod === 'bulanan') {
                      displayLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'];
                      chartItems = displayLabels.map((lbl, mIdx) => {
                        let rawInc = 0;
                        let rawExp = 0;

                        sourceKeuangan.forEach((k: any) => {
                          if (!k.tanggal) return;
                          const d = new Date(k.tanggal);
                          if (isNaN(d.getTime())) return;

                          if (d.getMonth() === mIdx && d.getFullYear() === keuanganYear) {
                            const amt = Number(k.jumlah || 0);
                            if (k.jenis === 'pemasukan') rawInc += amt;
                            else if (k.jenis === 'pengeluaran') rawExp += amt;
                          }
                        });

                        return { label: lbl, rawInc, rawExp };
                      });
                    } else if (keuanganPeriod === 'kuartal') {
                      displayLabels = ['K1 (Jan-Mar)', 'K2 (Apr-Jun)', 'K3 (Jul-Sep)', 'K4 (Okt-Des)'];
                      const qRanges = [
                        [0, 1, 2],
                        [3, 4, 5],
                        [6, 7, 8],
                        [9, 10, 11],
                      ];

                      chartItems = qRanges.map((months, qIdx) => {
                        let rawInc = 0;
                        let rawExp = 0;

                        sourceKeuangan.forEach((k: any) => {
                          if (!k.tanggal) return;
                          const d = new Date(k.tanggal);
                          if (isNaN(d.getTime())) return;

                          if (months.includes(d.getMonth()) && d.getFullYear() === keuanganYear) {
                            const amt = Number(k.jumlah || 0);
                            if (k.jenis === 'pemasukan') rawInc += amt;
                            else if (k.jenis === 'pengeluaran') rawExp += amt;
                          }
                        });

                        return { label: displayLabels[qIdx], rawInc, rawExp };
                      });
                    } else {
                      const years = [keuanganYear - 4, keuanganYear - 3, keuanganYear - 2, keuanganYear - 1, keuanganYear];
                      displayLabels = years.map((y) => y.toString());

                      chartItems = years.map((y, idx) => {
                        let rawInc = 0;
                        let rawExp = 0;

                        sourceKeuangan.forEach((k: any) => {
                          if (!k.tanggal) return;
                          const d = new Date(k.tanggal);
                          if (isNaN(d.getTime())) return;

                          if (d.getFullYear() === y) {
                            const amt = Number(k.jumlah || 0);
                            if (k.jenis === 'pemasukan') rawInc += amt;
                            else if (k.jenis === 'pengeluaran') rawExp += amt;
                          }
                        });

                        return { label: displayLabels[idx], rawInc, rawExp };
                      });
                    }

                    let maxAmt = 1;
                    chartItems.forEach((item) => {
                      if (item.rawInc > maxAmt) maxAmt = item.rawInc;
                      if (item.rawExp > maxAmt) maxAmt = item.rawExp;
                    });

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-[#1a1c1c]">Keuangan: Pendapatan vs Pengeluaran</h4>
                            <p className="text-[11px] text-gray-500">Distribusi kas berdasarkan data database</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Mode Dropdown */}
                            <div className="relative">
                              <select
                                value={keuanganPeriod}
                                onChange={(e) => setKeuanganPeriod(e.target.value as 'bulanan' | 'kuartal' | 'tahunan')}
                                className="bg-gray-50 border border-gray-300 text-[#00216e] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00216e] cursor-pointer shadow-sm appearance-none pr-8 transition-all hover:bg-gray-100"
                              >
                                <option value="bulanan">Bulanan</option>
                                <option value="kuartal">Kuartal</option>
                                <option value="tahunan">Per Tahun</option>
                              </select>
                              <span className="material-symbols-outlined text-sm text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                expand_more
                              </span>
                            </div>

                            {/* Year Dropdown */}
                            <div className="relative">
                              <select
                                value={keuanganYear}
                                onChange={(e) => setKeuanganYear(Number(e.target.value))}
                                className="bg-gray-50 border border-gray-300 text-[#00216e] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00216e] cursor-pointer shadow-sm appearance-none pr-8 transition-all hover:bg-gray-100 font-mono"
                              >
                                <option value={2026}>Tahun 2026</option>
                                <option value={2025}>Tahun 2025</option>
                                <option value={2024}>Tahun 2024</option>
                                <option value={2023}>Tahun 2023</option>
                                <option value={2022}>Tahun 2022</option>
                                <option value={2021}>Tahun 2021</option>
                              </select>
                              <span className="material-symbols-outlined text-sm text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                expand_more
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Legend */}
                        <div className="flex justify-end gap-4 mb-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#00216e]"></span>
                            <span className="text-xs text-[#444653] font-semibold">Pendapatan</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#bb0013]"></span>
                            <span className="text-xs text-[#444653] font-semibold">Pengeluaran</span>
                          </div>
                        </div>

                        {/* Bar Grid */}
                        <div className="h-60 flex items-end justify-between px-2 gap-1.5 border-b border-gray-100 relative">
                          {chartItems.map((item, idx) => {
                            const incPct = maxAmt > 0 && item.rawInc > 0 ? Math.max(Math.round((item.rawInc / maxAmt) * 85), 10) : 6;
                            const expPct = maxAmt > 0 && item.rawExp > 0 ? Math.max(Math.round((item.rawExp / maxAmt) * 85), 10) : 6;

                            let isCurrentPeriod = false;
                            let isFuturePeriod = false;
                            let periodBadgeText = '';

                            if (keuanganPeriod === 'bulanan') {
                              isCurrentPeriod = keuanganYear === realYear && idx === realMonthIdx;
                              isFuturePeriod = keuanganYear === realYear && idx > realMonthIdx;
                              periodBadgeText = '(Bulan Ini)';
                            } else if (keuanganPeriod === 'kuartal') {
                              const realQuarterIdx = Math.floor(realMonthIdx / 3);
                              isCurrentPeriod = keuanganYear === realYear && idx === realQuarterIdx;
                              isFuturePeriod = keuanganYear === realYear && idx > realQuarterIdx;
                              periodBadgeText = '(Kuartal Ini)';
                            } else {
                              const currentY = keuanganYear - 4 + idx;
                              isCurrentPeriod = currentY === realYear;
                              isFuturePeriod = currentY > realYear;
                              periodBadgeText = '(Tahun Ini)';
                            }

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                {/* Hover Tooltip */}
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-[#012366] text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl z-20 whitespace-nowrap border border-white/20">
                                  <p className="font-bold border-b border-white/20 pb-1 mb-1 text-center text-blue-200">
                                    {item.label} {keuanganYear} {isCurrentPeriod && <span className="text-amber-300 font-bold ml-1">{periodBadgeText}</span>}
                                  </p>
                                  <p className="text-emerald-400 font-semibold">
                                    Pendapatan: Rp {item.rawInc.toLocaleString('id-ID')}
                                  </p>
                                  <p className="text-red-300 font-semibold">
                                    Pengeluaran: Rp {item.rawExp.toLocaleString('id-ID')}
                                  </p>
                                </div>

                                {/* Bars Pair */}
                                <div className="flex gap-1 items-end w-full justify-center h-full">
                                  <div
                                    className={`w-1/2 rounded-t-md transition-all group-hover:brightness-125 shadow-sm ${
                                      keuanganPeriod === 'bulanan' ? 'max-w-[12px]' : 'max-w-[24px]'
                                    } ${
                                      isCurrentPeriod
                                        ? 'bg-gradient-to-t from-amber-500 to-[#00216e] ring-1 ring-amber-400'
                                        : isFuturePeriod
                                        ? 'bg-[#00216e]/30'
                                        : 'bg-[#00216e]'
                                    }`}
                                    style={{ height: `${incPct}%` }}
                                  ></div>
                                  <div
                                    className={`w-1/2 rounded-t-md transition-all group-hover:brightness-125 shadow-sm ${
                                      keuanganPeriod === 'bulanan' ? 'max-w-[12px]' : 'max-w-[24px]'
                                    } ${
                                      isCurrentPeriod
                                        ? 'bg-gradient-to-t from-amber-500 to-[#bb0013] ring-1 ring-amber-400'
                                        : isFuturePeriod
                                        ? 'bg-[#bb0013]/30'
                                        : 'bg-[#bb0013]'
                                    }`}
                                    style={{ height: `${expPct}%` }}
                                  ></div>
                                </div>

                                {/* Label */}
                                <span
                                  className={`mt-2.5 text-[10px] font-bold uppercase transition-colors ${
                                    isCurrentPeriod ? 'text-amber-600 font-extrabold' : 'text-[#444653] group-hover:text-[#00216e]'
                                  }`}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Chart 2: Resident Growth */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-semibold text-[#1a1c1c]">Pertumbuhan Penduduk</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Total Terdaftar di DB: <span className="font-bold text-[#00216e]">{stats.totalWarga} Warga</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mode Filter Dropdown */}
                      <div className="relative">
                        <select
                          value={growthPeriod}
                          onChange={(e) => setGrowthPeriod(e.target.value as 'bulanan' | 'kuartal' | 'tahunan')}
                          className="bg-gray-50 border border-gray-300 text-[#00216e] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00216e] cursor-pointer shadow-sm appearance-none pr-8 transition-all hover:bg-gray-100"
                        >
                          <option value="bulanan">Bulanan</option>
                          <option value="kuartal">Kuartal</option>
                          <option value="tahunan">Per Tahun</option>
                        </select>
                        <span className="material-symbols-outlined text-sm text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          expand_more
                        </span>
                      </div>

                      {/* Year Filter Dropdown */}
                      <div className="relative">
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="bg-gray-50 border border-gray-300 text-[#00216e] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00216e] cursor-pointer shadow-sm appearance-none pr-8 transition-all hover:bg-gray-100 font-mono"
                        >
                          <option value={2026}>Tahun 2026</option>
                          <option value={2025}>Tahun 2025</option>
                          <option value={2024}>Tahun 2024</option>
                          <option value={2023}>Tahun 2023</option>
                          <option value={2022}>Tahun 2022</option>
                          <option value={2021}>Tahun 2021</option>
                        </select>
                        <span className="material-symbols-outlined text-sm text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const sourceWarga =
                      rawWargaList.length > 0
                        ? rawWargaList
                        : INITIAL_WARGA.map((w, idx) => ({
                            ...w,
                            created_at: `202${4 + (idx % 3)}-0${(idx % 9) + 1}-15T10:00:00Z`,
                          }));

                    const realNow = new Date();
                    const realYear = realNow.getFullYear();
                    const realMonthIdx = realNow.getMonth(); // 7 for August

                    let displayLabels: string[] = [];
                    let growthValues: number[] = [];

                    if (growthPeriod === 'bulanan') {
                      displayLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'];
                      const endTimes = displayLabels.map((_, mIdx) => new Date(selectedYear, mIdx + 1, 0, 23, 59, 59).getTime());
                      growthValues = endTimes.map((endTime) => {
                        return sourceWarga.filter((w: any) => {
                          if (!w.created_at) return true;
                          const cTime = new Date(w.created_at).getTime();
                          return !isNaN(cTime) ? cTime <= endTime : true;
                        }).length;
                      });
                    } else if (growthPeriod === 'kuartal') {
                      displayLabels = ['K1 (Jan-Mar)', 'K2 (Apr-Jun)', 'K3 (Jul-Sep)', 'K4 (Okt-Des)'];
                      const endTimes = [
                        new Date(selectedYear, 2, 31, 23, 59, 59).getTime(),
                        new Date(selectedYear, 5, 30, 23, 59, 59).getTime(),
                        new Date(selectedYear, 8, 30, 23, 59, 59).getTime(),
                        new Date(selectedYear, 11, 31, 23, 59, 59).getTime(),
                      ];
                      growthValues = endTimes.map((endTime) => {
                        return sourceWarga.filter((w: any) => {
                          if (!w.created_at) return true;
                          const cTime = new Date(w.created_at).getTime();
                          return !isNaN(cTime) ? cTime <= endTime : true;
                        }).length;
                      });
                    } else {
                      const years = [selectedYear - 4, selectedYear - 3, selectedYear - 2, selectedYear - 1, selectedYear];
                      displayLabels = years.map((y) => y.toString());
                      growthValues = years.map((y) => {
                        const endTime = new Date(y, 11, 31, 23, 59, 59).getTime();
                        return sourceWarga.filter((w: any) => {
                          if (!w.created_at) return true;
                          const cTime = new Date(w.created_at).getTime();
                          return !isNaN(cTime) ? cTime <= endTime : true;
                        }).length;
                      });
                    }

                    const maxWargaVal = Math.max(...growthValues, 1);

                    return (
                      <div className="h-60 flex items-end justify-between px-2 gap-1.5 border-b border-gray-100 relative">
                        {displayLabels.map((lbl, idx) => {
                          const val = growthValues[idx] || 0;
                          const heightPct = Math.max(Math.round((val / maxWargaVal) * 85), 15);

                          let isCurrentPeriod = false;
                          let isFuturePeriod = false;
                          let periodBadgeText = '';

                          if (growthPeriod === 'bulanan') {
                            isCurrentPeriod = selectedYear === realYear && idx === realMonthIdx;
                            isFuturePeriod = selectedYear === realYear && idx > realMonthIdx;
                            periodBadgeText = '(Bulan Ini)';
                          } else if (growthPeriod === 'kuartal') {
                            const realQuarterIdx = Math.floor(realMonthIdx / 3);
                            isCurrentPeriod = selectedYear === realYear && idx === realQuarterIdx;
                            isFuturePeriod = selectedYear === realYear && idx > realQuarterIdx;
                            periodBadgeText = '(Kuartal Ini)';
                          } else {
                            const currentY = selectedYear - 4 + idx;
                            isCurrentPeriod = currentY === realYear;
                            isFuturePeriod = currentY > realYear;
                            periodBadgeText = '(Tahun Ini)';
                          }

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#00216e] text-white text-[11px] px-2.5 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl z-20 whitespace-nowrap border border-white/20">
                                <span className="font-bold">{val} Warga</span> • {lbl} {selectedYear}
                                {isCurrentPeriod && <span className="text-amber-300 font-bold ml-1">{periodBadgeText}</span>}
                              </div>

                              {/* Value badge above bar */}
                              <span
                                className={`text-[10px] font-bold mb-1 transition-transform group-hover:scale-110 ${
                                  isCurrentPeriod ? 'text-amber-600 font-extrabold scale-110' : 'text-[#00216e]'
                                }`}
                              >
                                {val}
                              </span>

                              {/* Bar Column */}
                              <div
                                className={`w-full rounded-t-lg transition-all group-hover:brightness-125 shadow-sm ${
                                  growthPeriod === 'bulanan' ? 'max-w-[22px]' : growthPeriod === 'kuartal' ? 'max-w-[50px]' : 'max-w-[42px]'
                                } ${
                                  isCurrentPeriod
                                    ? 'bg-gradient-to-t from-amber-500 to-[#00216e] ring-2 ring-amber-400'
                                    : isFuturePeriod
                                    ? 'bg-[#00216e]/30'
                                    : 'bg-gradient-to-t from-[#00216e] to-[#0033a0]'
                                }`}
                                style={{ height: `${heightPct}%` }}
                              ></div>

                              {/* Label */}
                              <span
                                className={`mt-2.5 text-[10px] font-bold uppercase transition-colors ${
                                  isCurrentPeriod ? 'text-amber-600 font-extrabold' : 'text-[#444653] group-hover:text-[#00216e]'
                                }`}
                              >
                                {lbl}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Chart 3: Monthly Activities */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
                  {(() => {
                    const realNow = new Date();
                    const currentYear = realNow.getFullYear();
                    const currentMonthIdx = realNow.getMonth(); // 7 for August

                    const sourceKegiatan =
                      rawKegiatanList.length > 0
                        ? rawKegiatanList
                        : INITIAL_KEGIATAN.map((k, idx) => ({
                            judul: k.judul,
                            tanggal: k.tanggal || `2026-0${(idx % 9) + 1}-15`,
                          }));

                    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEP', 'OKT', 'NOV', 'DES'];

                    const monthCounts = monthLabels.map((_, mIdx) => {
                      return sourceKegiatan.filter((k: any) => {
                        if (!k.tanggal) return false;
                        const d = new Date(k.tanggal);
                        if (isNaN(d.getTime())) return false;
                        return d.getMonth() === mIdx && d.getFullYear() === currentYear;
                      }).length;
                    });

                    const maxCount = Math.max(...monthCounts, 1);

                    return (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="font-semibold text-[#1a1c1c]">Intensitas Kegiatan</h4>
                            <p className="text-[11px] text-gray-500">Jumlah kegiatan per bulan di database</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-red-50 text-[#bb0013] text-xs font-bold border border-red-100 font-mono">
                            Tahun {currentYear}
                          </span>
                        </div>

                        <div className="h-60 flex items-end justify-between px-2 gap-1.5 border-b border-gray-100 relative">
                          {monthLabels.map((lbl, idx) => {
                            const count = monthCounts[idx];
                            const heightPct = count > 0 ? Math.max(Math.round((count / maxCount) * 85), 15) : 8;
                            const isCurrentMonth = idx === currentMonthIdx;
                            const isFutureMonth = idx > currentMonthIdx;

                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                                {/* Hover Tooltip */}
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#bb0013] text-white text-[11px] px-2.5 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none shadow-xl z-20 whitespace-nowrap border border-white/20">
                                  <span className="font-bold">{count} Kegiatan</span> • {lbl} {currentYear}
                                  {isCurrentMonth && <span className="text-amber-300 font-bold ml-1">(Bulan Ini)</span>}
                                </div>

                                {/* Count badge above bar */}
                                <span
                                  className={`text-[10px] font-bold mb-1 transition-transform group-hover:scale-110 ${
                                    isCurrentMonth ? 'text-amber-600 font-extrabold scale-110' : 'text-[#bb0013]'
                                  }`}
                                >
                                  {count}
                                </span>

                                {/* Bar Column */}
                                <div
                                  className={`w-full max-w-[22px] rounded-t-lg transition-all group-hover:brightness-125 shadow-sm ${
                                    isCurrentMonth
                                      ? 'bg-gradient-to-t from-amber-500 to-[#bb0013] ring-2 ring-amber-400'
                                      : isFutureMonth
                                      ? 'bg-[#bb0013]/30'
                                      : 'bg-gradient-to-t from-[#bb0013] to-red-600'
                                  }`}
                                  style={{ height: `${heightPct}%` }}
                                ></div>

                                {/* Label */}
                                <span
                                  className={`mt-2.5 text-[10px] font-bold uppercase transition-colors ${
                                    isCurrentMonth ? 'text-amber-600 font-extrabold' : 'text-[#444653] group-hover:text-[#bb0013]'
                                  }`}
                                >
                                  {lbl}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Chart 4: Dues Payment Status */}
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-semibold text-[#1a1c1c]">Status Pembayaran Iuran</h4>
                    <Link href="/iuran" className="text-[#00216e] font-bold text-xs hover:underline">
                      Detail Iuran →
                    </Link>
                  </div>

                  <div className="h-60 flex items-center justify-center gap-8">
                    <div className="relative w-44 h-44">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e2e2" strokeWidth="12" />
                        {stats.persentaseIuran === 100 ? (
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00216e" strokeWidth="12" />
                        ) : stats.persentaseIuran === 0 ? (
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#bb0013" strokeWidth="12" />
                        ) : (
                          <>
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#00216e"
                              strokeWidth="12"
                              strokeDasharray={`${(stats.persentaseIuran / 100) * 251.2} 251.2`}
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="transparent"
                              stroke="#bb0013"
                              strokeWidth="12"
                              strokeDasharray={`${((100 - stats.persentaseIuran) / 100) * 251.2} 251.2`}
                              strokeDashoffset={`-${(stats.persentaseIuran / 100) * 251.2}`}
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[#1a1c1c]">{stats.persentaseIuran}%</span>
                        <span className="text-[10px] text-[#444653] font-bold tracking-widest uppercase">
                          Lunas
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full bg-[#00216e]"></span>
                        <div>
                          <p className="text-xs font-bold text-[#1a1c1c]">{stats.iuranLunasCount} Warga</p>
                          <p className="text-[10px] text-[#444653] uppercase font-semibold">Sudah Bayar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full bg-[#bb0013]"></span>
                        <div>
                          <p className="text-xs font-bold text-[#1a1c1c]">{stats.iuranBelumCount} Warga</p>
                          <p className="text-[10px] text-[#444653] uppercase font-semibold">Belum Bayar</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bento Bottom Section (With Skeletons) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="lg:col-span-2">
                  <RecentActivitySkeleton />
                </div>
                <div>
                  <AnnouncementSkeleton />
                </div>
              </>
            ) : (
              <>
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
                  <h4 className="font-semibold text-[#1a1c1c] mb-4">Aktivitas Terkini</h4>
                  <div className="space-y-4">
                    {recentActivities.map((act) => (
                      <div key={act.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className={`w-10 h-10 rounded-full ${act.colorBg} ${act.colorText} flex items-center justify-center shrink-0`}>
                          <span className="material-symbols-outlined">{act.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#1a1c1c]">{act.title}</p>
                          <p className="text-xs text-[#444653] mt-0.5">
                            {act.time} • {act.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="bg-[#00216e] text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-md">
                  <div>
                    <span className="material-symbols-outlined text-5xl opacity-40 mb-4 block">
                      campaign
                    </span>
                    <h4 className="text-xl font-bold mb-3">{latestAnnouncement.judul}</h4>
                    <p className="text-sm opacity-90 leading-relaxed">
                      {latestAnnouncement.isi}
                    </p>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/pengumuman"
                      className="w-full bg-white text-[#00216e] font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm text-center block shadow-sm"
                    >
                      Lihat Semua Info
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

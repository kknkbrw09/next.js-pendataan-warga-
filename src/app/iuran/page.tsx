'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_IURAN, Iuran } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAppConfig } from '@/lib/configStore';

export default function IuranPage() {
  const [config, setConfig] = useState(getAppConfig());
  const [iuranList, setIuranList] = useState<Iuran[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const now = new Date();
  const monthNamesIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentBulanNow = monthNamesIndo[now.getMonth()];
  const currentTahunNow = now.getFullYear();

  useEffect(() => {
    setConfig(getAppConfig());
    async function loadIuran() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('iuran').select('*');
          if (data && !error && data.length > 0) {
            const formatted: Iuran[] = data.map((d: any) => ({
              id: d.id,
              blok: d.blok,
              namaWarga: d.nama_warga,
              bulan: d.bulan || currentBulanNow,
              tahun: d.tahun || currentTahunNow,
              status: d.status,
              jumlah: Number(d.jumlah),
            }));
            setIuranList(formatted);
          } else {
            console.log('[Supabase DB] 💡 Database iuran table is empty. Auto-seeding initial data...');
            const seedItems = INITIAL_IURAN.map((item) => ({
              blok: item.blok,
              nama_warga: item.namaWarga,
              bulan: currentBulanNow,
              tahun: currentTahunNow,
              status: item.status,
              jumlah: item.jumlah,
            }));
            const { data: insertedData } = await supabase.from('iuran').insert(seedItems).select();
            if (insertedData && insertedData.length > 0) {
              const formatted: Iuran[] = insertedData.map((d: any) => ({
                id: d.id,
                blok: d.blok,
                namaWarga: d.nama_warga,
                bulan: d.bulan,
                tahun: d.tahun,
                status: d.status,
                jumlah: Number(d.jumlah),
              }));
              setIuranList(formatted);
            } else {
              setIuranList(INITIAL_IURAN);
            }
          }
        } catch (err) {
          console.log('Fetch iuran error', err);
          setIuranList(INITIAL_IURAN);
        } finally {
          setLoading(false);
        }
      } else {
        setIuranList(INITIAL_IURAN);
        setLoading(false);
      }
    }
    loadIuran();
  }, []);

  const toggleStatus = async (id: string) => {
    const targetItem = iuranList.find((i) => i.id === id);
    if (!targetItem) return;

    const newStatus = targetItem.status === 'Lunas' ? 'Belum' : 'Lunas';

    // Optimistic UI update
    setIuranList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(`Status Iuran ${targetItem.namaWarga} Berhasil Diubah ke '${newStatus}'!`);

    if (isSupabaseConfigured && supabase) {
      try {
        console.log(`[Supabase DB] 📡 Updating iuran ID ${id} to ${newStatus}...`);
        const { error } = await supabase.from('iuran').update({ status: newStatus }).eq('id', id);
        if (error) console.warn('[Supabase DB Error] Update iuran:', error.message);
      } catch (err) {
        console.error('Update iuran status error', err);
      }
    }
  };

  const handleMarkAllLunas = async () => {
    setIuranList((prev) => prev.map((item) => ({ ...item, status: 'Lunas' })));
    showToast('Semua Status Iuran Berhasil Diubah ke Lunas!');
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        console.log('[Supabase DB] 📡 Batch updating all iuran status to Lunas...');
        const { data, error } = await client
          .from('iuran')
          .update({ status: 'Lunas' })
          .not('id', 'is', null)
          .select();

        if (error || !data || data.length === 0) {
          console.log('[Supabase DB] 💡 Syncing/Inserting rows to Supabase...');
          await Promise.all(
            iuranList.map((item) =>
              client.from('iuran').upsert({
                blok: item.blok,
                nama_warga: item.namaWarga,
                bulan: item.bulan,
                tahun: item.tahun,
                status: 'Lunas',
                jumlah: item.jumlah,
              })
            )
          );
          console.log('[Supabase DB] ✅ All iuran rows synced to Supabase as Lunas');
        } else {
          console.log(`[Supabase DB] ✅ Batch update updated ${data.length} rows to Lunas`);
        }
      } catch (err) {
        console.error('[Supabase DB Exception] Batch update iuran error', err);
      }
    }
  };

  const handleResetAllBelum = async () => {
    setIuranList((prev) => prev.map((item) => ({ ...item, status: 'Belum' })));
    showToast('Semua Status Iuran Berhasil Di-reset ke Belum!');
    const client = supabase;
    if (isSupabaseConfigured && client) {
      try {
        console.log('[Supabase DB] 📡 Batch updating all iuran status to Belum...');
        const { data, error } = await client
          .from('iuran')
          .update({ status: 'Belum' })
          .not('id', 'is', null)
          .select();

        if (error || !data || data.length === 0) {
          console.log('[Supabase DB] 💡 Syncing/Inserting rows to Supabase...');
          await Promise.all(
            iuranList.map((item) =>
              client.from('iuran').upsert({
                blok: item.blok,
                nama_warga: item.namaWarga,
                bulan: item.bulan,
                tahun: item.tahun,
                status: 'Belum',
                jumlah: item.jumlah,
              })
            )
          );
          console.log('[Supabase DB] ✅ All iuran rows synced to Supabase as Belum');
        } else {
          console.log(`[Supabase DB] ✅ Batch update updated ${data.length} rows to Belum`);
        }
      } catch (err) {
        console.error('[Supabase DB Exception] Batch reset iuran error', err);
      }
    }
  };

  const lunasCount = iuranList.filter((i) => i.status === 'Lunas').length;
  const totalCount = iuranList.length;
  const pctLunas = totalCount > 0 ? Math.round((lunasCount / totalCount) * 100) : 0;

  const modeLabels = {
    perKk: '🏠 Per Kartu Keluarga (KK)',
    perWarga: '👤 Per Setiap Jiwa (Warga)',
    perUmur: `🎂 Warga Usia ${config.minUsiaIuran} - ${config.maxUsiaIuran} Tahun`,
    perRt: '👑 Per Ketua RT (Kolektif RT)',
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Status Iuran Warga" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header & Auto-Click Actions Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[#e2e2e2] shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#00216e]">Monitoring Iuran Bulanan</h2>
                <span suppressHydrationWarning className="text-xs font-bold bg-red-100 text-[#bb0013] px-3 py-1 rounded-full border border-red-200">
                  {modeLabels[config.targetIuranMode || 'perKk']}
                </span>
              </div>
              <p suppressHydrationWarning className="text-sm text-[#444653] mt-1">
                Tarif Standard: <strong className="text-[#00216e]">Rp {config.nominalIuranStandard.toLocaleString('id-ID')} / bulan</strong> • Jatuh Tempo: {config.jatuhTempoIuran}
              </p>
            </div>

            {/* 1-Click Auto Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleMarkAllLunas}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                title="Satu klik tandai semua lunas sesuai kriteria config"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                Tandai Semua Lunas
              </button>

              <button
                onClick={handleResetAllBelum}
                className="bg-gray-100 hover:bg-gray-200 text-[#444653] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Reset status untuk bulan baru"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                Reset Status
              </button>

              <a
                href="/config"
                className="bg-blue-50 hover:bg-blue-100 text-[#00216e] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border border-blue-200 transition-all"
              >
                <span className="material-symbols-outlined text-sm">settings</span>
                Ubah Config
              </a>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
              <div className="bg-white border border-[#e2e2e2] rounded-xl p-8 shadow-sm flex flex-col items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-gray-200 mb-4"></div>
                <div className="w-24 h-5 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded"></div>
                      <div className="w-20 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="relative w-44 h-44 mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e2e2" strokeWidth="12" />
                    {pctLunas === 100 ? (
                      <circle cx="50" cy="50" r="40" fill="transparent" stroke="#00216e" strokeWidth="12" />
                    ) : pctLunas === 0 ? (
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
                          strokeDasharray={`${(pctLunas / 100) * 251.2} 251.2`}
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#bb0013"
                          strokeWidth="12"
                          strokeDasharray={`${((100 - pctLunas) / 100) * 251.2} 251.2`}
                          strokeDashoffset={`-${(pctLunas / 100) * 251.2}`}
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#00216e]">{pctLunas}%</span>
                    <span className="text-[10px] text-[#444653] font-bold tracking-widest uppercase">
                      Capaian Target
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-[#1a1c1c]">{currentBulanNow} {currentTahunNow}</h4>
                <p className="text-xs text-[#444653] mt-1">
                  {lunasCount} dari {totalCount} warga telah melunasi iuran.
                </p>
              </div>

              <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm overflow-x-auto">
                <h4 className="font-bold text-[#1a1c1c] mb-4">Status Pembayaran Warga</h4>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Blok / Warga</th>
                      <th className="px-4 py-3">Bulan</th>
                      <th className="px-4 py-3">Nominal</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-center">Aksi Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {iuranList.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#1a1c1c]">{item.namaWarga}</p>
                          <p className="text-xs text-[#444653]">{item.blok}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#444653]">
                          {item.bulan} {item.tahun}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#00216e]">
                          Rp {item.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              item.status === 'Lunas'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-[#bb0013]'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleStatus(item.id)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#00216e] text-xs font-bold rounded-lg transition-all"
                          >
                            Ubah Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

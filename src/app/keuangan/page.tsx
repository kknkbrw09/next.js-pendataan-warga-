'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_KEUANGAN, TransaksiKeuangan } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function KeuanganPage() {
  const [transaksiList, setTransaksiList] = useState<TransaksiKeuangan[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua Kategori');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    keterangan: '',
    jenis: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    jumlah: 0,
    kategori: 'Iuran',
  });

  const [loading, setLoading] = useState(true);

  // Fetch live financial history from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadKeuangan() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('keuangan')
            .select('*')
            .order('tanggal', { ascending: false });

          if (isMounted) {
            if (data && !error && data.length > 0) {
              const formatted: TransaksiKeuangan[] = data.map((d: any) => ({
                id: d.id,
                tanggal: d.tanggal,
                keterangan: d.keterangan,
                jenis: d.jenis,
                jumlah: Number(d.jumlah),
                kategori: d.kategori,
              }));
              setTransaksiList(formatted);
            } else {
              setTransaksiList(INITIAL_KEUANGAN);
            }
          }
        } catch (e) {
          console.log('Keuangan fetch error', e);
          if (isMounted) setTransaksiList(INITIAL_KEUANGAN);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setTransaksiList(INITIAL_KEUANGAN);
          setLoading(false);
        }
      }
    }

    loadKeuangan();

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const totalPemasukan = transaksiList
    .filter((t) => t.jenis === 'pemasukan')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const totalPengeluaran = transaksiList
    .filter((t) => t.jenis === 'pengeluaran')
    .reduce((sum, t) => sum + t.jumlah, 0);

  const saldoSaatIni = totalPemasukan - totalPengeluaran;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('keuangan')
          .insert({
            tanggal: formData.tanggal,
            keterangan: formData.keterangan,
            jenis: formData.jenis,
            jumlah: formData.jumlah,
            kategori: formData.kategori,
          })
          .select('*');

        if (data && !error && data.length > 0) {
          const insertedTx: TransaksiKeuangan = {
            id: data[0].id,
            tanggal: data[0].tanggal,
            keterangan: data[0].keterangan,
            jenis: data[0].jenis,
            jumlah: Number(data[0].jumlah),
            kategori: data[0].kategori,
          };
          setTransaksiList((prev) => [insertedTx, ...prev]);
          setIsModalOpen(false);
          showToast('Transaksi Keuangan Berhasil Disimpan!');
          setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            keterangan: '',
            jenis: 'pemasukan',
            jumlah: 0,
            kategori: 'Iuran',
          });
          return;
        }
      } catch (err) {
        console.log('Insert transaction error', err);
      }
    }

    const newTx: TransaksiKeuangan = {
      id: Date.now().toString(),
      ...formData,
    };
    setTransaksiList((prev) => [newTx, ...prev]);
    setIsModalOpen(false);
    showToast('Transaksi Keuangan Berhasil Disimpan!');
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: '',
      jenis: 'pemasukan',
      jumlah: 0,
      kategori: 'Iuran',
    });
  };

  const handleExportCsv = () => {
    const exportData = filteredTransaksi.map((t, idx) => ({
      No: idx + 1,
      Tanggal: t.tanggal,
      Keterangan: t.keterangan,
      Jenis: t.jenis.toUpperCase(),
      Kategori: t.kategori,
      Jumlah: t.jumlah,
    }));
    downloadCsv('Laporan_Keuangan_RW09', exportData);
    showToast('File Laporan Keuangan (CSV) Berhasil Diunduh!');
  };

  const filteredTransaksi = transaksiList.filter((t) => {
    const matchesJenis = selectedJenis === 'semua' || t.jenis === selectedJenis;
    const matchesKategori = selectedKategori === 'Semua Kategori' || t.kategori === selectedKategori;
    return matchesJenis && matchesKategori;
  });

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-top-4 duration-300 border border-emerald-400">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Keuangan RW 09" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Riwayat &amp; Transparansi Keuangan</h2>
              <p className="text-sm text-[#444653] mt-1">
                Catatan kas real-time pemasukan dan pengeluaran dana warga RW 09.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportCsv}
                className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Export CSV / Excel
              </button>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_card</span>
                Tambah Transaksi
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse h-28">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="w-40 h-8 bg-gray-300 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse h-28">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="w-40 h-8 bg-gray-300 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse h-28">
                  <div className="w-24 h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="w-40 h-8 bg-gray-300 rounded"></div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#00216e] p-6 rounded-xl text-white shadow-lg flex flex-col justify-between">
                  <p className="text-xs uppercase tracking-widest opacity-80 font-bold">
                    Saldo Kas Saat Ini
                  </p>
                  <h3 className="text-3xl font-extrabold mt-3">
                    Rp {saldoSaatIni.toLocaleString('id-ID')}
                  </h3>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#444653] font-semibold">Total Pemasukan</p>
                    <p className="text-2xl font-bold text-[#00216e] mt-1">
                      +Rp {totalPemasukan.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 text-[#00216e] rounded-full">
                    <span className="material-symbols-outlined">arrow_upward</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#444653] font-semibold">Total Pengeluaran</p>
                    <p className="text-2xl font-bold text-[#bb0013] mt-1">
                      -Rp {totalPengeluaran.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 text-[#bb0013] rounded-full">
                    <span className="material-symbols-outlined">arrow_downward</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Table & History */}
          <div className="bg-white rounded-xl border border-[#e2e2e2] overflow-hidden shadow-sm">
            {/* Filter Bar */}
            <div className="p-4 bg-gray-50 border-b border-[#e2e2e2] flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#1a1c1c] text-sm flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">history</span>
                  Riwayat Transaksi:
                </span>

                <select
                  value={selectedJenis}
                  onChange={(e) => setSelectedJenis(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-[#00216e] outline-none"
                >
                  <option value="semua">Semua Jenis Transaksi</option>
                  <option value="pemasukan">Pemasukan (+)</option>
                  <option value="pengeluaran">Pengeluaran (-)</option>
                </select>

                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 outline-none"
                >
                  <option value="Semua Kategori">Semua Kategori</option>
                  <option value="Iuran">Iuran Warga</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Fasilitas">Fasilitas</option>
                  <option value="Donasi">Donasi / Sponsor</option>
                </select>
              </div>

              <span className="text-xs text-gray-500 font-semibold">
                Menampilkan {filteredTransaksi.length} transaksi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Keterangan Transaksi</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4 text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Belum ada riwayat transaksi keuangan.
                      </td>
                    </tr>
                  ) : (
                    filteredTransaksi.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-[#444653] font-bold">{t.tanggal}</td>
                        <td className="px-6 py-4 font-semibold text-[#1a1c1c]">{t.keterangan}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-[#00216e] text-xs font-bold rounded-md border border-blue-100">
                            {t.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold">
                          <span
                            className={t.jenis === 'pemasukan' ? 'text-[#00216e]' : 'text-[#bb0013]'}
                          >
                            {t.jenis === 'pemasukan' ? '+' : '-'} Rp{' '}
                            {t.jumlah.toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Add Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Tambah Transaksi Kas</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Contoh: Pembelian alat kerja bakti RT 04"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Jenis
                  </label>
                  <select
                    value={formData.jenis}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis: e.target.value as 'pemasukan' | 'pengeluaran',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="pemasukan">Pemasukan (+)</option>
                    <option value="pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="Iuran">Iuran Warga</option>
                    <option value="Kebersihan">Kebersihan</option>
                    <option value="Fasilitas">Fasilitas</option>
                    <option value="Donasi">Donasi / Sponsor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Jumlah Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={formData.jumlah}
                  onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00216e] text-white rounded-lg text-sm font-semibold hover:bg-[#0033a0]"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_SURAT, SuratPengantar, Warga, INITIAL_WARGA } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AntrianPelayananPage() {
  const [antrianList, setAntrianList] = useState<SuratPengantar[]>([]);
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [formData, setFormData] = useState({
    namaPemohon: '',
    rt: 'RT 001',
    keperluan: 'Pengurusan Surat Keterangan Domisili',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);

          // Fetch Antrian
          const { data: antrianData, error: antrianErr } = await supabase
            .from('surat_pengantar')
            .select('*')
            .order('created_at', { ascending: false });

          // Fetch Warga for dropdown select
          const { data: wargaData } = await supabase.from('warga').select('*');

          if (isMounted) {
            if (wargaData && wargaData.length > 0) {
              setWargaList(wargaData.map((w: any) => ({ id: w.id, nama: w.nama, tahunLahir: w.tahun_lahir, rt: w.rt })));
            } else {
              setWargaList(INITIAL_WARGA);
            }

            if (antrianData && !antrianErr && antrianData.length > 0) {
              const formatted: SuratPengantar[] = antrianData.map((d: any) => ({
                id: d.id,
                noAntrian: d.no_antrian || 'A-001',
                namaPemohon: d.nama_pemohon,
                rt: d.rt || 'RT 001',
                keperluan: d.keperluan,
                tanggal: d.tanggal,
                status: (d.status as any) || 'Menunggu',
              }));
              setAntrianList(formatted);
            } else {
              setAntrianList(INITIAL_SURAT);
            }
          }
        } catch (err) {
          console.log('Fetch antrian error', err);
          if (isMounted) {
            setAntrianList(INITIAL_SURAT);
            setWargaList(INITIAL_WARGA);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setAntrianList(INITIAL_SURAT);
          setWargaList(INITIAL_WARGA);
          setLoading(false);
        }
      }
    }

    loadData();

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Generate next queue number A-001, A-002...
  const generateNextNoAntrian = () => {
    const nextNum = antrianList.length + 1;
    return `A-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPemohon.trim()) {
      alert('Nama pemohon wajib diisi!');
      return;
    }

    const noAntrian = generateNextNoAntrian();
    const today = new Date().toISOString().split('T')[0];
    let insertedId = Date.now().toString();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('surat_pengantar')
          .insert({
            no_antrian: noAntrian,
            nama_pemohon: formData.namaPemohon,
            rt: formData.rt,
            keperluan: formData.keperluan,
            tanggal: today,
            status: 'Menunggu',
          })
          .select('*');

        if (data && !error && data.length > 0) {
          insertedId = data[0].id;
        }
      } catch (err) {
        console.log('Insert antrian error', err);
      }
    }

    const newAntrian: SuratPengantar = {
      id: insertedId,
      noAntrian,
      namaPemohon: formData.namaPemohon,
      rt: formData.rt,
      keperluan: formData.keperluan,
      tanggal: today,
      status: 'Menunggu',
    };

    setAntrianList([newAntrian, ...antrianList]);
    setIsModalOpen(false);
    showToast(`Antrian ${noAntrian} Berhasil Didaftarkan!`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('antrian_updated'));
    }
    setFormData({
      namaPemohon: '',
      rt: 'RT 001',
      keperluan: 'Pengurusan Surat Keterangan Domisili',
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: 'Menunggu' | 'Diproses' | 'Selesai' | 'Dibatalkan') => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('surat_pengantar')
          .update({ status: newStatus })
          .eq('id', id);
      } catch (err) {
        console.log('Update antrian error', err);
      }
    }

    setAntrianList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    showToast(`Status Antrian Diubah ke '${newStatus}'`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('antrian_updated'));
    }
  };

  const activeAntrian = antrianList.find((a) => a.status === 'Diproses') || antrianList.find((a) => a.status === 'Menunggu');
  const waitingList = antrianList.filter((a) => a.status === 'Menunggu');
  const processingList = antrianList.filter((a) => a.status === 'Diproses');
  const completedList = antrianList.filter((a) => a.status === 'Selesai');

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
        <Header title="Papan Antrian Pelayanan Warga" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header Action Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Antrian Pelayanan Per Orang</h2>
              <p className="text-sm text-[#444653] mt-1">
                Sistem antrian langsung permohonan layanan & pengurusan berkas warga RW 09.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_card</span>
              Tambah Antrian Baru
            </button>
          </div>

          {/* Hero Card: Antrian Sedang Dipanggil / Diproses */}
          <div className="bg-gradient-to-r from-[#00216e] to-[#012366] text-white p-6 rounded-2xl shadow-lg border border-blue-900 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-400 text-amber-950 font-bold text-xs rounded-full uppercase tracking-wider">
                🔔 Antrian Aktif / Sedang Diproses
              </span>
              <h3 className="text-4xl font-extrabold font-mono tracking-tight text-white mt-2">
                {activeAntrian ? activeAntrian.noAntrian : '---'}
              </h3>
              <p className="text-lg font-semibold text-blue-100">
                {activeAntrian ? activeAntrian.namaPemohon : 'Belum ada antrian aktif'}
              </p>
              <p className="text-xs text-blue-200">
                {activeAntrian ? `${activeAntrian.rt} • Keperluan: ${activeAntrian.keperluan}` : 'Silakan tambah antrian baru'}
              </p>
            </div>

            {activeAntrian && (
              <div className="flex gap-3 shrink-0">
                {activeAntrian.status === 'Menunggu' && (
                  <button
                    onClick={() => handleUpdateStatus(activeAntrian.id, 'Diproses')}
                    className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">campaign</span>
                    Panggil / Proses Antrian
                  </button>
                )}
                {activeAntrian.status === 'Diproses' && (
                  <button
                    onClick={() => handleUpdateStatus(activeAntrian.id, 'Selesai')}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Selesaikan Pelayanan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Kanban / Status Queue Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 h-64"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolom Menunggu */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                    <h3 className="font-bold text-[#1a1c1c] text-sm">Antrian Menunggu</h3>
                  </div>
                  <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {waitingList.length} Pemohon
                  </span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {waitingList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Tidak ada antrian menunggu</p>
                  ) : (
                    waitingList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-amber-800 text-sm">{item.noAntrian}</span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                            {item.rt}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#1a1c1c]">{item.namaPemohon}</h4>
                        <p className="text-xs text-[#444653]">{item.keperluan}</p>
                        <div className="pt-2 flex justify-between items-center border-t border-amber-100">
                          <span className="text-[11px] text-gray-400">{item.tanggal}</span>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Diproses')}
                            className="bg-[#00216e] text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-[#0033a0]"
                          >
                            Proses
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Diproses */}
              <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <h3 className="font-bold text-[#1a1c1c] text-sm">Sedang Diproses</h3>
                  </div>
                  <span className="bg-blue-100 text-blue-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {processingList.length} Pemohon
                  </span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {processingList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Tidak ada pelayanan diproses</p>
                  ) : (
                    processingList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-[#00216e] text-sm">{item.noAntrian}</span>
                          <span className="text-[10px] bg-blue-200 text-[#00216e] font-bold px-2 py-0.5 rounded-md">
                            {item.rt}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#1a1c1c]">{item.namaPemohon}</h4>
                        <p className="text-xs text-[#444653]">{item.keperluan}</p>
                        <div className="pt-2 flex justify-between items-center border-t border-blue-100">
                          <span className="text-[11px] text-gray-400">{item.tanggal}</span>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'Selesai')}
                            className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-emerald-700"
                          >
                            Selesaikan
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Kolom Selesai */}
              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <h3 className="font-bold text-[#1a1c1c] text-sm">Pelayanan Selesai</h3>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    {completedList.length} Selesai
                  </span>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {completedList.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Belum ada pelayanan selesai</p>
                  ) : (
                    completedList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-2 opacity-90"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-emerald-800 text-sm">{item.noAntrian}</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                            Selesai
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#1a1c1c]">{item.namaPemohon}</h4>
                        <p className="text-xs text-[#444653]">{item.keperluan}</p>
                        <p className="text-[11px] text-gray-400 pt-2 border-t border-emerald-100">{item.tanggal}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Add Antrian */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Pendaftaran Antrian Pelayanan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Nama Pemohon
                </label>
                <input
                  type="text"
                  required
                  list="warga-list-options"
                  value={formData.namaPemohon}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matched = wargaList.find((w) => w.nama.toLowerCase() === val.toLowerCase());
                    setFormData({
                      ...formData,
                      namaPemohon: val,
                      rt: matched ? matched.rt : formData.rt,
                    });
                  }}
                  placeholder="Ketik nama atau pilih warga terdaftar"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
                <datalist id="warga-list-options">
                  {wargaList.map((w) => (
                    <option key={w.id} value={w.nama}>
                      {w.nama} ({w.rt})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Wilayah RT
                </label>
                <select
                  value={formData.rt}
                  onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-semibold"
                >
                  <option value="RT 001">RT 001</option>
                  <option value="RT 002">RT 002</option>
                  <option value="RT 003">RT 003</option>
                  <option value="RT 004">RT 004</option>
                  <option value="RT 005">RT 005</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Keperluan Pelayanan
                </label>
                <select
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                >
                  <option value="Pengurusan Surat Keterangan Domisili">Pengurusan Surat Keterangan Domisili</option>
                  <option value="Pengurusan Surat Keterangan Usaha">Pengurusan Surat Keterangan Usaha</option>
                  <option value="Pengurusan KTP / Kartu Keluarga">Pengurusan KTP / Kartu Keluarga</option>
                  <option value="Pengurusan SKTM (Keterangan Tidak Mampu)">Pengurusan SKTM (Keterangan Tidak Mampu)</option>
                  <option value="Pengurusan Surat Keterangan Kematian">Pengurusan Surat Keterangan Kematian</option>
                  <option value="Konsultasi Pelayanan RW / RT">Konsultasi Pelayanan RW / RT</option>
                </select>
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
                  className="px-5 py-2 bg-[#00216e] text-white rounded-lg text-sm font-semibold hover:bg-[#0033a0] shadow-md"
                >
                  Daftarkan Antrian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

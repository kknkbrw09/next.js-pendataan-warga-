'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_KEGIATAN, Kegiatan } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAppConfig, isKegiatanSelesai } from '@/lib/configStore';

export default function KegiatanPage() {
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(() => {
    const config = getAppConfig();
    return {
      judul: '',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: config.defaultWaktuKegiatan || '08:00 WIB',
      lokasi: config.defaultLokasiKegiatan || 'Balai Warga RW 09',
      deskripsi: '',
      status: 'Mendatang' as 'Mendatang' | 'Selesai',
    };
  });

  useEffect(() => {
    async function loadKegiatan() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          console.log('[Supabase DB] 📡 Fetching kegiatan list...');
          const { data, error } = await supabase
            .from('kegiatan')
            .select('*')
            .order('tanggal', { ascending: false });

          if (error) {
            console.warn('[Supabase DB Error] Kegiatan fetch:', error.message);
          } else {
            console.log(`[Supabase DB] ✅ Kegiatan returned ${data?.length || 0} rows:`, data);
          }

          if (data && !error && data.length > 0) {
            const formatted: Kegiatan[] = data.map((d: any) => ({
              id: d.id,
              judul: d.judul,
              tanggal: d.tanggal,
              waktu: d.waktu,
              lokasi: d.lokasi,
              deskripsi: d.deskripsi || '',
              status: isKegiatanSelesai(d.tanggal, d.waktu) ? 'Selesai' : (d.status || 'Mendatang'),
            }));
            setKegiatanList(formatted);
          } else {
            const formattedInitial = INITIAL_KEGIATAN.map((k) => ({
              ...k,
              status: isKegiatanSelesai(k.tanggal, k.waktu) ? ('Selesai' as const) : ('Mendatang' as const),
            }));
            setKegiatanList(formattedInitial);
          }
        } catch (err) {
          console.error('[Supabase DB Exception] Kegiatan fetch error:', err);
          const formattedInitial = INITIAL_KEGIATAN.map((k) => ({
            ...k,
            status: isKegiatanSelesai(k.tanggal, k.waktu) ? ('Selesai' as const) : ('Mendatang' as const),
          }));
          setKegiatanList(formattedInitial);
        } finally {
          setLoading(false);
        }
      } else {
        setKegiatanList(INITIAL_KEGIATAN);
        setLoading(false);
      }
    }
    loadKegiatan();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setKegiatanList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus as any } : item))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('kegiatan')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) {
          console.error('[Supabase DB Error] Update status kegiatan failed:', error.message);
        } else {
          console.log(`[Supabase DB] ✅ Updated kegiatan status ID ${id} to '${newStatus}'`);
        }
      } catch (err) {
        console.error('Exception updating kegiatan status:', err);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const computedStatus = isKegiatanSelesai(formData.tanggal, formData.waktu) ? 'Selesai' : formData.status;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('kegiatan')
          .insert({
            judul: formData.judul,
            tanggal: formData.tanggal,
            waktu: formData.waktu,
            lokasi: formData.lokasi,
            deskripsi: formData.deskripsi,
            status: computedStatus,
          })
          .select('*');

        if (error) {
          console.error('Supabase RLS/Insert Error:', error);
          alert(`Gagal menambah kegiatan ke Supabase: ${error.message}\n(Pastikan RLS Policy INSERT diizinkan di Supabase)`);
        }

        if (data && !error && data.length > 0) {
          const insertedKegiatan: Kegiatan = {
            id: data[0].id,
            judul: data[0].judul,
            tanggal: data[0].tanggal,
            waktu: data[0].waktu,
            lokasi: data[0].lokasi,
            deskripsi: data[0].deskripsi || '',
            status: data[0].status,
          };
          setKegiatanList((prev) => [insertedKegiatan, ...prev]);
          setIsModalOpen(false);
          setFormData({
            judul: '',
            tanggal: new Date().toISOString().split('T')[0],
            waktu: '08:00 WIB',
            lokasi: 'Balai Warga RW 09',
            deskripsi: '',
            status: 'Mendatang',
          });
          return;
        }
      } catch (err) {
        console.log('Insert kegiatan error', err);
      }
    }

    // Fallback if local/mock
    const newKegiatan: Kegiatan = {
      id: Date.now().toString(),
      ...formData,
    };
    setKegiatanList((prev) => [newKegiatan, ...prev]);
    setIsModalOpen(false);
    setFormData({
      judul: '',
      tanggal: new Date().toISOString().split('T')[0],
      waktu: '08:00 WIB',
      lokasi: 'Balai Warga RW 09',
      deskripsi: '',
      status: 'Mendatang',
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Kegiatan RW 09" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Agenda &amp; Kegiatan Lingkungan</h2>
              <p className="text-sm text-[#444653] mt-1">
                Jadwal aktivitas kemasyarakatan di wilayah RW 09 Kebon Bawang.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">event</span>
              Tambah Kegiatan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse h-56 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
                      <div className="w-3/4 h-6 bg-gray-300 rounded"></div>
                      <div className="w-full h-4 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </>
            ) : (
              kegiatanList.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="px-2.5 py-1 bg-red-50 text-[#bb0013] text-xs font-bold rounded uppercase">
                        {item.tanggal}
                      </span>
                      <span className="text-xs font-semibold text-[#444653]">{item.waktu}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#1a1c1c] mb-2">{item.judul}</h3>
                    <p className="text-xs text-[#00216e] font-semibold mb-3 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {item.lokasi}
                    </p>
                    <p className="text-xs text-[#444653] leading-relaxed mb-4">{item.deskripsi}</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Status Kegiatan:</span>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1 rounded-xl cursor-pointer border outline-none transition-all ${
                        item.status === 'Selesai'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : item.status === 'Berlangsung'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : item.status === 'Dibatalkan'
                          ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          : 'bg-blue-50 text-[#00216e] border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <option value="Mendatang">Mendatang</option>
                      <option value="Berlangsung">Berlangsung</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Dibatalkan">Dibatalkan</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Tambah Agenda Kegiatan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Judul Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Kerja Bakti Lingkungan"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Waktu
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.waktu}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    placeholder="08:00 WIB"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Lokasi kegiatan"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Status Kegiatan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] outline-none cursor-pointer"
                >
                  <option value="Mendatang">Mendatang</option>
                  <option value="Berlangsung">Berlangsung</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
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
                  Simpan Kegiatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

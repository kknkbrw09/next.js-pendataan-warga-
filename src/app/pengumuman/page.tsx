'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_PENGUMUMAN, Pengumuman } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function PengumumanPage() {
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const [formData, setFormData] = useState({
    judul: '',
    isi: '',
    penting: false,
    kategori: 'Penting',
  });

  useEffect(() => {
    let isMounted = true;

    async function loadPengumuman() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('pengumuman').select('*');

          if (isMounted) {
            if (data && !error) {
              const formatted: Pengumuman[] = data.map((d: any) => ({
                id: d.id,
                judul: d.judul,
                tanggal: d.tanggal,
                isi: d.isi,
                penting: d.penting,
                kategori: d.kategori || 'Pengumuman',
              }));
              setPengumumanList(formatted);
            } else {
              setPengumumanList(INITIAL_PENGUMUMAN);
            }
          }
        } catch (err) {
          console.log('Fetch pengumuman error', err);
          if (isMounted) setPengumumanList(INITIAL_PENGUMUMAN);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setPengumumanList(INITIAL_PENGUMUMAN);
          setLoading(false);
        }
      }
    }

    loadPengumuman();

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const dateStr = `${today.getDate()} ${
      ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
        today.getMonth()
      ]
    } ${today.getFullYear()}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('pengumuman')
          .insert({
            judul: formData.judul,
            tanggal: dateStr,
            isi: formData.isi,
            penting: formData.penting,
            kategori: formData.kategori,
          })
          .select('*');

        if (data && !error && data.length > 0) {
          const inserted: Pengumuman = {
            id: data[0].id,
            judul: data[0].judul,
            tanggal: data[0].tanggal,
            isi: data[0].isi,
            penting: data[0].penting,
            kategori: data[0].kategori || 'Pengumuman',
          };
          setPengumumanList((prev) => [inserted, ...prev]);
          setIsModalOpen(false);
          showToast('Pengumuman Baru Berhasil Diterbitkan!');
          setFormData({
            judul: '',
            isi: '',
            penting: false,
            kategori: 'Penting',
          });
          return;
        }
      } catch (err) {
        console.log('Insert pengumuman error', err);
      }
    }

    const newPengumuman: Pengumuman = {
      id: Date.now().toString(),
      judul: formData.judul,
      tanggal: dateStr,
      isi: formData.isi,
      penting: formData.penting,
      kategori: formData.kategori,
    };

    setPengumumanList((prev) => [newPengumuman, ...prev]);
    setIsModalOpen(false);
    showToast('Pengumuman Baru Berhasil Diterbitkan!');
    setFormData({
      judul: '',
      isi: '',
      penting: false,
      kategori: 'Penting',
    });
  };

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
        <Header title="Pengumuman RW 09" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Papan Pengumuman & Berita</h2>
              <p className="text-sm text-[#444653] mt-1">
                Informasi resmi dari pengurus RW 09 Kebon Bawang untuk seluruh warga.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">campaign</span>
              Buat Pengumuman
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-48 h-5 bg-gray-200 rounded"></div>
                      <div className="w-full h-4 bg-gray-200 rounded"></div>
                      <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              pengumumanList.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-start justify-between"
              >
                <div className="flex gap-4 items-start">
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                      item.penting
                        ? 'bg-red-50 text-[#bb0013]'
                        : 'bg-blue-50 text-[#00216e]'
                    }`}
                  >
                    <span className="material-symbols-outlined">campaign</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-[#1a1c1c]">{item.judul}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.penting
                            ? 'bg-red-100 text-[#bb0013]'
                            : 'bg-blue-100 text-[#00216e]'
                        }`}
                      >
                        {item.kategori}
                      </span>
                    </div>
                    <p className="text-xs text-[#444653] font-semibold mt-1">
                      Dipublikasikan: {item.tanggal}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </main>

      {/* Modal Form Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Buat Pengumuman Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Masukkan judul pengumuman"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Kategori
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategori: e.target.value,
                      penting: e.target.value === 'Penting',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                >
                  <option value="Penting">Penting / Darurat</option>
                  <option value="Pengumuman">Pengumuman Umum</option>
                  <option value="Rutin">Informasi Rutin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Isi Pengumuman
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.isi}
                  onChange={(e) => setFormData({ ...formData, isi: e.target.value })}
                  placeholder="Tuliskan isi pengumuman lengkap..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="penting"
                  checked={formData.penting}
                  onChange={(e) => setFormData({ ...formData, penting: e.target.checked })}
                  className="rounded text-[#bb0013] focus:ring-[#bb0013]"
                />
                <label htmlFor="penting" className="text-xs font-bold text-[#bb0013]">
                  Tandai sebagai Pengumuman Penting / Banner
                </label>
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
                  Publikasikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

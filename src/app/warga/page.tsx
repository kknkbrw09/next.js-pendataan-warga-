'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Warga, INITIAL_WARGA } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function WargaPage() {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState('Semua RT');
  const [selectedUsia, setSelectedUsia] = useState('Semua Usia');

  // Modal Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarga, setEditingWarga] = useState<Warga | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form State (Input menggunakan Tahun Lahir)
  const [formData, setFormData] = useState({
    nama: '',
    tahunLahir: 1990,
    rt: 'RT 001',
  });

  // Load from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchSupabaseWarga() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('warga').select('*').order('created_at', { ascending: false });
          if (isMounted) {
            if (data && !error && data.length > 0) {
              const mapped: Warga[] = data.map((d: any) => ({
                id: d.id,
                nama: d.nama,
                usia: Number(d.usia) || 30,
                rt: d.rt || 'RT 001',
              }));
              setWargaList(mapped);
            } else {
              setWargaList(INITIAL_WARGA);
            }
          }
        } catch (err) {
          console.log('Fetch warga error', err);
          if (isMounted) setWargaList(INITIAL_WARGA);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setWargaList(INITIAL_WARGA);
          setLoading(false);
        }
      }
    }

    fetchSupabaseWarga();

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleOpenModal = (warga?: Warga) => {
    if (warga) {
      setEditingWarga(warga);
      setFormData({
        nama: warga.nama,
        tahunLahir: currentYear - warga.usia,
        rt: warga.rt,
      });
    } else {
      setEditingWarga(null);
      setFormData({
        nama: '',
        tahunLahir: 1995,
        rt: 'RT 001',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      alert('Nama warga wajib diisi!');
      return;
    }

    if (formData.tahunLahir < 1900 || formData.tahunLahir > currentYear) {
      alert(`Tahun lahir harus di antara 1900 dan ${currentYear}`);
      return;
    }

    // Kalkulasi Usia dari Tahun Lahir yang diinput
    const calculatedUsia = currentYear - formData.tahunLahir;
    let insertedId = Date.now().toString();

    // Save to Supabase (Hanya menyimpan nama, usia, rt)
    if (isSupabaseConfigured && supabase) {
      try {
        if (editingWarga) {
          await supabase
            .from('warga')
            .update({
              nama: formData.nama,
              usia: calculatedUsia,
              rt: formData.rt,
            })
            .eq('id', editingWarga.id);
        } else {
          const { data, error } = await supabase
            .from('warga')
            .insert({
              nama: formData.nama,
              usia: calculatedUsia,
              rt: formData.rt,
            })
            .select('*');

          if (data && !error && data.length > 0) {
            insertedId = data[0].id;
          }
        }
      } catch (err) {
        console.log('Save warga error', err);
      }
    }

    if (editingWarga) {
      setWargaList((prev) =>
        prev.map((w) => (w.id === editingWarga.id ? { id: w.id, nama: formData.nama, usia: calculatedUsia, rt: formData.rt } : w))
      );
    } else {
      const newWarga: Warga = {
        id: insertedId,
        nama: formData.nama,
        usia: calculatedUsia,
        rt: formData.rt,
      };
      setWargaList((prev) => [newWarga, ...prev]);
    }

    setIsModalOpen(false);
    showToast(editingWarga ? 'Data Warga Berhasil Diperbarui!' : 'Data Warga Berhasil Ditambahkan!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('warga').delete().eq('id', id);
        } catch (err) {
          console.log('Delete warga error', err);
        }
      }
      setWargaList((prev) => prev.filter((w) => w.id !== id));
      showToast('Data Warga Berhasil Dihapus!');
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredWarga.map((w, idx) => ({
      No: idx + 1,
      'Nama Lengkap': w.nama,
      Usia: `${w.usia} Thn`,
      RT: w.rt,
    }));
    downloadCsv('Data_Warga_RW09', exportData);
    showToast('File Data Warga (CSV) Berhasil Diunduh!');
  };

  // Filtered List
  const filteredWarga = wargaList.filter((w) => {
    const matchesSearch = w.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRt = selectedRt === 'Semua RT' || w.rt === selectedRt;
    const usia = w.usia;

    let matchesUsia = true;
    if (selectedUsia === 'Balita (< 5 Thn)') {
      matchesUsia = usia < 5;
    } else if (selectedUsia === 'Anak & Remaja (5-17 Thn)') {
      matchesUsia = usia >= 5 && usia <= 17;
    } else if (selectedUsia === 'Dewasa (18-59 Thn)') {
      matchesUsia = usia >= 18 && usia <= 59;
    } else if (selectedUsia === 'Lansia (60+ Thn)') {
      matchesUsia = usia >= 60;
    }

    return matchesSearch && matchesRt && matchesUsia;
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
        <Header title="Manajemen Data Warga" onSearch={setSearchQuery} />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header Action Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Data Warga Minimalis</h2>
              <p className="text-sm text-[#444653] mt-1">
                Kelola data kependudukan warga RW 09 Kebon Bawang.
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
                onClick={() => handleOpenModal()}
                className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Tambah Warga Baru
              </button>
            </div>
          </div>

          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-[#e2e2e2] shadow-sm animate-pulse h-28 flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                      <div className="w-16 h-6 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-[#00216e] shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Total Jiwa Terdata</p>
                      <h3 className="text-2xl font-bold text-[#00216e]">{wargaList.length} Jiwa</h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-[#00216e]/10 text-[#00216e] rounded-lg">
                      groups
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-3">
                    Terdaftar di RW 09
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-indigo-600 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Usia Produktif (18-59)</p>
                      <h3 className="text-2xl font-bold text-indigo-700">
                        {wargaList.filter((w) => w.usia >= 18 && w.usia <= 59).length} Jiwa
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      badge
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Penduduk usia kerja</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-[#012366] shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Kategori Lansia (60+)</p>
                      <h3 className="text-2xl font-bold text-[#012366]">
                        {wargaList.filter((w) => w.usia >= 60).length} Jiwa
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-blue-100 text-[#012366] rounded-lg">
                      elderly
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Sasaran Posyandu Lansia</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-amber-500 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Kategori Balita (&lt;5)</p>
                      <h3 className="text-2xl font-bold text-amber-700">
                        {wargaList.filter((w) => w.usia < 5).length} Balita
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                      child_care
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Sasaran Posyandu Balita</p>
                </div>
              </>
            )}
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-[#e2e2e2] overflow-hidden shadow-sm">
            {/* Filters Header */}
            <div className="p-4 bg-gray-50 border-b border-[#e2e2e2] flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedRt}
                  onChange={(e) => setSelectedRt(e.target.value)}
                  className="bg-white border border-[#c4c5d5] rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#00216e] outline-none"
                >
                  <option>Semua RT</option>
                  <option>RT 001</option>
                  <option>RT 002</option>
                  <option>RT 003</option>
                  <option>RT 004</option>
                  <option>RT 005</option>
                </select>

                <select
                  value={selectedUsia}
                  onChange={(e) => setSelectedUsia(e.target.value)}
                  className="bg-white border border-[#c4c5d5] rounded-lg px-3 py-1.5 text-xs font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] outline-none"
                >
                  <option>Semua Usia</option>
                  <option>Balita (&lt; 5 Thn)</option>
                  <option>Anak &amp; Remaja (5-17 Thn)</option>
                  <option>Dewasa (18-59 Thn)</option>
                  <option>Lansia (60+ Thn)</option>
                </select>
              </div>

              <div className="text-xs text-[#444653] font-medium">
                Menampilkan <strong>{filteredWarga.length}</strong> dari {wargaList.length} warga
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Nama Lengkap</th>
                    <th className="px-6 py-4">Usia</th>
                    <th className="px-6 py-4">Wilayah RT</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 animate-pulse">
                        Memuat data warga...
                      </td>
                    </tr>
                  ) : filteredWarga.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        Tidak ada data warga yang cocok dengan kriteria pencarian/filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWarga.map((warga) => {
                      const initials = warga.nama
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('');

                      return (
                        <tr key={warga.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#00216e]/10 text-[#00216e] flex items-center justify-center font-bold text-xs shrink-0">
                                {initials}
                              </div>
                              <span className="font-bold text-[#1a1c1c]">{warga.nama}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-blue-50 text-[#00216e] rounded-full text-xs font-bold border border-blue-200">
                              {warga.usia} Tahun
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-gray-100 text-[#1a1c1c] rounded-md text-xs font-semibold">
                              {warga.rt}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleOpenModal(warga)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                                title="Edit Data Warga"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(warga.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                title="Hapus Data Warga"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Add / Edit Warga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">
                {editingWarga ? 'Edit Data Warga' : 'Tambah Warga Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap warga"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Tahun Lahir (Untuk Kalkulasi Usia)
                </label>
                <input
                  type="number"
                  required
                  min={1900}
                  max={currentYear}
                  value={formData.tahunLahir}
                  onChange={(e) => setFormData({ ...formData, tahunLahir: parseInt(e.target.value) || 1990 })}
                  placeholder="Contoh: 1995"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-mono"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Usia yang disimpan di DB: <strong>{currentYear - (formData.tahunLahir || currentYear)} Tahun</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  RT (Rukun Tetangga)
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

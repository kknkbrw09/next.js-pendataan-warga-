'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Warga, INITIAL_WARGA, StatusKeluarga, Gender } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const STATUS_KELUARGA_OPTIONS: StatusKeluarga[] = [
  'Kepala Keluarga',
  'Suami',
  'Istri',
  'Anak',
  'Cucu',
  'Lainnya',
];

const GENDER_OPTIONS: Gender[] = ['Laki-laki', 'Perempuan'];

const RT_OPTIONS = Array.from({ length: 18 }, (_, i) => `RT ${String(i + 1).padStart(3, '0')}`);

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
  const yearOptions = Array.from({ length: 110 }, (_, i) => currentYear - i);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Form State
  const [formData, setFormData] = useState<{
    nama: string;
    statusKeluarga: StatusKeluarga;
    kepalaKeluargaId: string;
    gender: Gender;
    tahunLahir: number;
    rt: string;
    nomorRumah: string;
  }>({
    nama: '',
    statusKeluarga: 'Kepala Keluarga',
    kepalaKeluargaId: '',
    gender: 'Laki-laki',
    tahunLahir: 1995,
    rt: 'RT 001',
    nomorRumah: '',
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
              const mapped: Warga[] = data.map((d: any) => {
                const kkRecord = data.find((kk: any) => String(kk.id) === String(d.kepala_keluarga_id));
                return {
                  id: String(d.id),
                  nama: d.nama || '',
                  statusKeluarga: (d.status_keluarga as StatusKeluarga) || 'Kepala Keluarga',
                  kepalaKeluargaId: d.kepala_keluarga_id ? String(d.kepala_keluarga_id) : undefined,
                  kepalaKeluargaNama: kkRecord ? kkRecord.nama : d.kepala_keluarga_nama || undefined,
                  gender: (d.gender as Gender) || 'Laki-laki',
                  tahunLahir: Number(d.tahun_lahir) || 1990,
                  rt: d.rt || 'RT 001',
                  nomorRumah: d.nomor_rumah || '',
                };
              });
              setWargaList(mapped);
            } else {
              setWargaList([]);
            }
          }
        } catch (err) {
          console.log('Fetch warga error', err);
          if (isMounted) setWargaList([]);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setWargaList([]);
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
      const isKK = (warga.statusKeluarga || 'Kepala Keluarga') === 'Kepala Keluarga';
      const kkRecord = !isKK ? wargaList.find((kk) => kk.id === warga.kepalaKeluargaId) : null;

      setFormData({
        nama: warga.nama,
        statusKeluarga: warga.statusKeluarga || 'Kepala Keluarga',
        kepalaKeluargaId: warga.kepalaKeluargaId || '',
        gender: warga.gender || 'Laki-laki',
        tahunLahir: warga.tahunLahir || 1995,
        rt: kkRecord ? kkRecord.rt : warga.rt || 'RT 001',
        nomorRumah: kkRecord ? kkRecord.nomorRumah : warga.nomorRumah || '',
      });
    } else {
      setEditingWarga(null);
      setFormData({
        nama: '',
        statusKeluarga: 'Kepala Keluarga',
        kepalaKeluargaId: '',
        gender: 'Laki-laki',
        tahunLahir: 1995,
        rt: 'RT 001',
        nomorRumah: '',
      });
    }
    setIsModalOpen(true);
  };

  // Filter Kepala Keluarga available in current list
  const availableKepalaKeluarga = wargaList.filter(
    (w) => w.statusKeluarga === 'Kepala Keluarga' && w.id !== editingWarga?.id
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      alert('Nama warga wajib diisi!');
      return;
    }

    // Mandatory validation for Pilih Kepala Keluarga if status != Kepala Keluarga
    if (formData.statusKeluarga !== 'Kepala Keluarga' && !formData.kepalaKeluargaId) {
      alert('Silakan pilih Kepala Keluarga terlebih dahulu!');
      return;
    }

    const selectedKK = availableKepalaKeluarga.find((kk) => kk.id === formData.kepalaKeluargaId);
    const kkNama = selectedKK ? selectedKK.nama : undefined;

    // Auto sync address from KK if status != 'Kepala Keluarga'
    const finalRt = formData.statusKeluarga !== 'Kepala Keluarga' && selectedKK ? selectedKK.rt : formData.rt;
    const finalNomorRumah =
      formData.statusKeluarga !== 'Kepala Keluarga' && selectedKK ? selectedKK.nomorRumah : formData.nomorRumah;

    let insertedId = Date.now().toString();

    // Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          nama: formData.nama,
          status_keluarga: formData.statusKeluarga,
          kepala_keluarga_id: formData.statusKeluarga === 'Kepala Keluarga' ? null : formData.kepalaKeluargaId || null,
          gender: formData.gender,
          tahun_lahir: formData.tahunLahir,
          rt: finalRt,
          nomor_rumah: finalNomorRumah,
        };

        if (editingWarga) {
          await supabase.from('warga').update(payload).eq('id', editingWarga.id);
          // If updating a KK's address, sync address to all family members under this KK
          if (formData.statusKeluarga === 'Kepala Keluarga') {
            await supabase
              .from('warga')
              .update({ rt: finalRt, nomor_rumah: finalNomorRumah })
              .eq('kepala_keluarga_id', editingWarga.id);
          }
        } else {
          const { data, error } = await supabase.from('warga').insert(payload).select('*');
          if (data && !error && data.length > 0) {
            insertedId = String(data[0].id);
          }
        }
      } catch (err) {
        console.log('Save warga error', err);
      }
    }

    const updatedRecord: Warga = {
      id: editingWarga ? editingWarga.id : insertedId,
      nama: formData.nama,
      statusKeluarga: formData.statusKeluarga,
      kepalaKeluargaId: formData.statusKeluarga === 'Kepala Keluarga' ? undefined : formData.kepalaKeluargaId,
      kepalaKeluargaNama: formData.statusKeluarga === 'Kepala Keluarga' ? undefined : kkNama,
      gender: formData.gender,
      tahunLahir: formData.tahunLahir,
      rt: finalRt,
      nomorRumah: finalNomorRumah,
    };

    if (editingWarga) {
      setWargaList((prev) =>
        prev.map((w) => {
          if (w.id === editingWarga.id) return updatedRecord;
          if (formData.statusKeluarga === 'Kepala Keluarga' && w.kepalaKeluargaId === editingWarga.id) {
            return { ...w, rt: finalRt, nomorRumah: finalNomorRumah, kepalaKeluargaNama: formData.nama };
          }
          return w;
        })
      );
    } else {
      setWargaList((prev) => [updatedRecord, ...prev]);
    }

    setIsModalOpen(false);
    showToast(editingWarga ? 'Data Warga Berhasil Diperbarui!' : 'Data Warga Berhasil Ditambahkan!');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from('warga').delete().eq('id', id);
          if (error) {
            console.error('Delete warga error:', error);
            alert(`Gagal menghapus data warga dari Supabase database: ${error.message}`);
            return;
          }
        } catch (err) {
          console.error('Delete warga error', err);
          alert('Terjadi kesalahan saat menghapus data.');
          return;
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
      'Status Keluarga': w.statusKeluarga || 'Kepala Keluarga',
      'Kepala Keluarga': w.statusKeluarga === 'Kepala Keluarga' ? 'Sendiri (KK)' : w.kepalaKeluargaNama || '-',
      Gender: w.gender || 'Laki-laki',
      'Tahun Lahir': w.tahunLahir,
      Usia: `${currentYear - w.tahunLahir} Thn`,
      RT: w.rt,
      'Nomor Rumah': w.nomorRumah || '-',
    }));
    downloadCsv('Data_Warga_RW09', exportData);
    showToast('File Data Warga (CSV) Berhasil Diunduh!');
  };

  // Filtered List & Age Calculation
  const filteredWarga = wargaList.filter((w) => {
    const matchesSearch =
      w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.nomorRumah && w.nomorRumah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.kepalaKeluargaNama && w.kepalaKeluargaNama.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRt = selectedRt === 'Semua RT' || w.rt === selectedRt;
    const usia = currentYear - w.tahunLahir;

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
              <h2 className="text-2xl font-bold text-[#00216e]">Data Warga &amp; Kependudukan</h2>
              <p className="text-sm text-[#444653] mt-1">
                Kelola data warga, status keluarga, gender, dan alamat RT 001 - RT 018.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
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
                    {wargaList.filter((w) => w.statusKeluarga === 'Kepala Keluarga').length} Kepala Keluarga
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-amber-500 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Kategori Balita (&lt;5)</p>
                      <h3 className="text-2xl font-bold text-amber-700">
                        {wargaList.filter((w) => currentYear - w.tahunLahir < 5).length} Balita
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-amber-100 text-amber-700 rounded-lg">
                      child_care
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Posyandu Balita</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-teal-600 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Anak &amp; Remaja (5-17)</p>
                      <h3 className="text-2xl font-bold text-teal-700">
                        {wargaList.filter((w) => {
                          const usia = currentYear - w.tahunLahir;
                          return usia >= 5 && usia <= 17;
                        }).length} Jiwa
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-teal-100 text-teal-700 rounded-lg">
                      school
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Usia Sekolah / Pendidikan</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-indigo-600 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-[#444653] font-semibold mb-1">Usia Produktif (18-59)</p>
                      <h3 className="text-2xl font-bold text-indigo-700">
                        {wargaList.filter((w) => {
                          const usia = currentYear - w.tahunLahir;
                          return usia >= 18 && usia <= 59;
                        }).length} Jiwa
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
                        {wargaList.filter((w) => currentYear - w.tahunLahir >= 60).length} Jiwa
                      </h3>
                    </div>
                    <span className="material-symbols-outlined p-2.5 bg-blue-100 text-[#012366] rounded-lg">
                      elderly
                    </span>
                  </div>
                  <p className="text-xs text-[#444653] mt-3">Posyandu Lansia</p>
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
                  {RT_OPTIONS.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
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
                    <th className="px-6 py-4">Nama &amp; Gender</th>
                    <th className="px-6 py-4">Status Keluarga</th>
                    <th className="px-6 py-4">Tahun Lahir / Usia</th>
                    <th className="px-6 py-4">Alamat Lengkap</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 animate-pulse">
                        Memuat data warga...
                      </td>
                    </tr>
                  ) : filteredWarga.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                      const calculatedUsia = currentYear - warga.tahunLahir;
                      const isKK = warga.statusKeluarga === 'Kepala Keluarga';

                      return (
                        <tr key={warga.id} className="hover:bg-blue-50/40 transition-colors">
                          {/* Nama & Gender */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  warga.gender === 'Perempuan'
                                    ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                    : 'bg-[#00216e]/10 text-[#00216e] border border-blue-200'
                                }`}
                              >
                                {initials}
                              </div>
                              <div>
                                <span className="font-bold text-[#1a1c1c] block">{warga.nama}</span>
                                <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                  <span className="material-symbols-outlined text-[13px]">
                                    {warga.gender === 'Perempuan' ? 'female' : 'male'}
                                  </span>
                                  {warga.gender || 'Laki-laki'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status Keluarga */}
                          <td className="px-6 py-4">
                            <div>
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  isKK
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {warga.statusKeluarga || 'Kepala Keluarga'}
                              </span>
                              {!isKK && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                  KK:{' '}
                                  <strong className="text-gray-700">
                                    {warga.kepalaKeluargaNama ||
                                      wargaList.find((kk) => kk.id === warga.kepalaKeluargaId)?.nama ||
                                      '-'}
                                  </strong>
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Usia & Tahun Lahir */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-bold text-[#00216e] text-sm">
                                {calculatedUsia} Tahun
                              </span>
                              <span className="text-xs text-gray-400 block mt-0.5 font-mono">
                                Thn Lahir: {warga.tahunLahir}
                              </span>
                            </div>
                          </td>

                          {/* Alamat Lengkap */}
                          <td className="px-6 py-4">
                            <div>
                              <span className="px-2 py-0.5 bg-gray-100 text-[#1a1c1c] rounded-md text-xs font-semibold border border-gray-200">
                                {warga.rt}
                              </span>
                              <span className="text-xs text-gray-600 ml-2 font-medium">
                                {warga.nomorRumah ? `No. ${warga.nomorRumah}` : '-'}
                              </span>
                            </div>
                          </td>

                          {/* Aksi */}
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#00216e]">
                  {editingWarga ? 'Edit Data Warga' : 'Tambah Warga Baru'}
                </h3>
                <p className="text-xs text-gray-500">Lengkapi formulir pendataan warga di bawah ini</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* 1. Nama Warga (Text box) */}
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Nama Warga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap warga"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-medium"
                />
              </div>

              {/* 2. Status Keluarga (Radio Button: Kepala Keluarga, Suami, Istri, Anak, Cucu, dll) */}
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1.5">
                  Status Keluarga <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_KELUARGA_OPTIONS.map((status) => (
                    <label
                      key={status}
                      className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                        formData.statusKeluarga === status
                          ? 'border-[#00216e] bg-blue-50/70 text-[#00216e] shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="statusKeluarga"
                        value={status}
                        checked={formData.statusKeluarga === status}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            statusKeluarga: status,
                            kepalaKeluargaId: status === 'Kepala Keluarga' ? '' : formData.kepalaKeluargaId,
                          })
                        }
                        className="accent-[#00216e]"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Pilih Kepala Keluarga (Mandatori Dropdown jika mengisi Istri/Anak/Cucu/dll) */}
              {formData.statusKeluarga !== 'Kepala Keluarga' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-amber-900 uppercase">
                    Pilih Kepala Keluarga <span className="text-red-600">* (Mandatori)</span>
                  </label>
                  <select
                    required
                    value={formData.kepalaKeluargaId}
                    onChange={(e) => {
                      const kkId = e.target.value;
                      const selectedKK = availableKepalaKeluarga.find((kk) => kk.id === kkId);
                      setFormData((prev) => ({
                        ...prev,
                        kepalaKeluargaId: kkId,
                        rt: selectedKK ? selectedKK.rt : prev.rt,
                        nomorRumah: selectedKK ? selectedKK.nomorRumah : prev.nomorRumah,
                      }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-semibold text-gray-800"
                  >
                    <option value="">-- Pilih Kepala Keluarga --</option>
                    {availableKepalaKeluarga.map((kk) => (
                      <option key={kk.id} value={kk.id}>
                        {kk.nama} ({kk.rt} - No. {kk.nomorRumah || '-'})
                      </option>
                    ))}
                  </select>
                  {availableKepalaKeluarga.length === 0 && (
                    <p className="text-[11px] text-amber-700 font-medium">
                      * Belum ada Kepala Keluarga terdaftar. Tambahkan Kepala Keluarga terlebih dahulu.
                    </p>
                  )}
                </div>
              )}

              {/* 4. Gender (Radio Button: Laki-laki / Perempuan) */}
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {GENDER_OPTIONS.map((g) => (
                    <label
                      key={g}
                      className={`flex-1 flex items-center justify-center gap-2 p-2.5 border rounded-xl cursor-pointer text-xs font-bold transition-all ${
                        formData.gender === g
                          ? 'border-[#00216e] bg-blue-50/70 text-[#00216e] shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={() => setFormData({ ...formData, gender: g })}
                        className="accent-[#00216e]"
                      />
                      <span className="material-symbols-outlined text-sm">
                        {g === 'Perempuan' ? 'female' : 'male'}
                      </span>
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 5. Tahun Lahir (Dropdown Tahun Lahir — Umur otomatis) */}
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Tahun Lahir <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={formData.tahunLahir}
                    onChange={(e) => setFormData({ ...formData, tahunLahir: parseInt(e.target.value) || currentYear })}
                    className="flex-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-bold text-[#00216e] bg-white"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-[#00216e] shrink-0">
                    Umur: <span className="text-base">{currentYear - formData.tahunLahir}</span> Thn
                  </div>
                </div>
              </div>

              {/* 6. Alamat Lengkap */}
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                {formData.statusKeluarga !== 'Kepala Keluarga' ? (
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-[#00216e] font-semibold animate-in fade-in duration-200">
                    <span className="material-symbols-outlined text-xl text-[#00216e] shrink-0">home_pin</span>
                    <div>
                      <p className="font-bold">Otomatis Mengikuti Alamat Kepala Keluarga</p>
                      <p className="text-gray-600 font-medium text-[11px] mt-0.5">
                        {formData.kepalaKeluargaId && availableKepalaKeluarga.find((kk) => kk.id === formData.kepalaKeluargaId)
                          ? `${availableKepalaKeluarga.find((kk) => kk.id === formData.kepalaKeluargaId)?.rt} - Nomor Rumah: ${availableKepalaKeluarga.find((kk) => kk.id === formData.kepalaKeluargaId)?.nomorRumah || '-'}`
                          : 'Silakan pilih Kepala Keluarga terlebih dahulu di atas.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-gray-500 mb-0.5">Rukun Tetangga (RT)</label>
                      <select
                        value={formData.rt}
                        onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-semibold bg-white"
                      >
                        {RT_OPTIONS.map((rt) => (
                          <option key={rt} value={rt}>
                            {rt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-500 mb-0.5">Nomor Rumah</label>
                      <input
                        type="text"
                        value={formData.nomorRumah}
                        onChange={(e) => setFormData({ ...formData, nomorRumah: e.target.value })}
                        placeholder="Contoh: No. 12A"
                        className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00216e] text-white rounded-xl text-sm font-semibold hover:bg-[#0033a0] shadow-md transition-all active:scale-95"
                >
                  Simpan Data Warga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

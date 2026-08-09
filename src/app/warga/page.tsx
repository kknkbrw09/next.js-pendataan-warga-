'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Warga } from '@/lib/store';
import { downloadCsv } from '@/lib/exportCsv';
import { maskNik, hashSensitiveData } from '@/lib/security';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ExtendedWarga extends Warga {
  noKk: string;
  peranKk: 'Kepala Keluarga' | 'Anggota Keluarga';
  hubunganKk?: string;
  nikHash?: string;
  noKkHash?: string;
}

const EXTENDED_WARGA: ExtendedWarga[] = [
  {
    id: '1',
    nama: 'Agus Setiawan',
    nik: '3172010405780001',
    noKk: '3172010101010001',
    alamat: 'Jl. Bugis No. 42',
    rt: 'RT 004',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Laki-laki',
    usia: 45,
    peranKk: 'Kepala Keluarga',
    hubunganKk: 'Kepala Keluarga',
  },
  {
    id: '4',
    nama: 'Dewi Lestari',
    nik: '3172016612960002',
    noKk: '3172010101010001',
    alamat: 'Jl. Bugis No. 42',
    rt: 'RT 004',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Perempuan',
    usia: 42,
    peranKk: 'Anggota Keluarga',
    hubunganKk: 'Istri',
  },
  {
    id: '7',
    nama: 'Rifky Setiawan',
    nik: '3172011503120008',
    noKk: '3172010101010001',
    alamat: 'Jl. Bugis No. 42',
    rt: 'RT 004',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Laki-laki',
    usia: 14,
    peranKk: 'Anggota Keluarga',
    hubunganKk: 'Anak',
  },
  {
    id: '6',
    nama: 'Ananda Putri',
    nik: '3172016612180009',
    noKk: '3172010101010001',
    alamat: 'Jl. Bugis No. 42',
    rt: 'RT 004',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Perempuan',
    usia: 4,
    peranKk: 'Anggota Keluarga',
    hubunganKk: 'Anak',
  },
  {
    id: '2',
    nama: 'Siti Rahmawati',
    nik: '3172015208910003',
    noKk: '3172010101010002',
    alamat: 'Gang Remaja VII No. 12',
    rt: 'RT 001',
    rw: 'RW 009',
    status: 'Kontrak',
    jenisKelamin: 'Perempuan',
    usia: 32,
    peranKk: 'Kepala Keluarga',
    hubunganKk: 'Kepala Keluarga',
  },
  {
    id: '3',
    nama: 'Bambang Pamungkas',
    nik: '3172012111650005',
    noKk: '3172010101010003',
    alamat: 'Jl. Kebon Bawang V No. 8',
    rt: 'RT 003',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Laki-laki',
    usia: 62,
    peranKk: 'Kepala Keluarga',
    hubunganKk: 'Kepala Keluarga',
  },
  {
    id: '5',
    nama: 'Eko Prasetyo',
    nik: '3172011503840004',
    noKk: '3172010101010004',
    alamat: 'Jl. Bugis No. 51',
    rt: 'RT 004',
    rw: 'RW 009',
    status: 'Tetap',
    jenisKelamin: 'Laki-laki',
    usia: 39,
    peranKk: 'Kepala Keluarga',
    hubunganKk: 'Kepala Keluarga',
  },
];

export default function WargaPage() {
  const [wargaList, setWargaList] = useState<ExtendedWarga[]>(EXTENDED_WARGA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRt, setSelectedRt] = useState('Semua RT');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedUsia, setSelectedUsia] = useState('Semua Usia');
  const [selectedKk, setSelectedKk] = useState('Semua Peran');
  const [viewMode, setViewMode] = useState<'semua' | 'perKk'>('semua');
  const [showFullNik, setShowFullNik] = useState(false);

  // Modal Detail KK
  const [activeKkNo, setActiveKkNo] = useState<string | null>(null);

  // Modal Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarga, setEditingWarga] = useState<ExtendedWarga | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    noKk: '',
    alamat: '',
    rt: 'RT 001',
    rw: 'RW 009',
    status: 'Tetap' as 'Tetap' | 'Kontrak',
    jenisKelamin: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    usia: 30,
    peranKk: 'Kepala Keluarga' as 'Kepala Keluarga' | 'Anggota Keluarga',
    hubunganKk: 'Kepala Keluarga',
  });

  const [selectedExistingKk, setSelectedExistingKk] = useState<string>('NEW');

  // Load from Supabase on mount
  useEffect(() => {
    async function fetchSupabaseWarga() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.from('warga').select('*');
          if (data && !error && data.length > 0) {
            const mapped: ExtendedWarga[] = data.map((d: any, idx: number) => {
              const match = EXTENDED_WARGA.find((m) => m.nama.toLowerCase() === d.nama.toLowerCase());
              const fallbackNik = match?.nik || `31720104${(10000000 + idx).toString().slice(1)}`;
              const fallbackNoKk = match?.noKk || `31720101${(10000000 + Math.floor(idx / 3)).toString().slice(1)}`;

              return {
                id: d.id,
                nama: d.nama,
                nik: d.nik || fallbackNik,
                noKk: d.no_kk || fallbackNoKk,
                alamat: d.alamat,
                rt: d.rt,
                rw: d.rw,
                status: d.status,
                jenisKelamin: d.jenis_kelamin,
                usia: d.usia,
                peranKk: d.peran_kk,
                hubunganKk: d.hubungan_kk || d.peran_kk,
                nikHash: d.nik_hash,
                noKkHash: d.no_kk_hash,
              };
            });
            setWargaList(mapped);
          }
        } catch (err) {
          console.log('Fetch warga error', err);
        }
      }
    }
    fetchSupabaseWarga();
  }, []);

  // List of existing Kepala Keluarga for quick select
  const existingKepalaKeluarga = wargaList.filter((w) => w.peranKk === 'Kepala Keluarga');

  const handleOpenModal = (warga?: ExtendedWarga, presetNoKk?: string) => {
    if (warga) {
      setEditingWarga(warga);
      setSelectedExistingKk(warga.noKk);
      setFormData({
        nama: warga.nama,
        nik: warga.nik,
        noKk: warga.noKk,
        alamat: warga.alamat,
        rt: warga.rt,
        rw: warga.rw,
        status: warga.status,
        jenisKelamin: warga.jenisKelamin,
        usia: warga.usia,
        peranKk: warga.peranKk,
        hubunganKk: warga.hubunganKk || 'Kepala Keluarga',
      });
    } else {
      setEditingWarga(null);
      const defaultNoKk = presetNoKk || '';
      setSelectedExistingKk(defaultNoKk || 'NEW');
      const sample = defaultNoKk ? wargaList.find((w) => w.noKk === defaultNoKk) : undefined;
      setFormData({
        nama: '',
        nik: '',
        noKk: defaultNoKk,
        alamat: sample?.alamat || '',
        rt: sample?.rt || 'RT 001',
        rw: 'RW 009',
        status: 'Tetap',
        jenisKelamin: 'Laki-laki',
        usia: 30,
        peranKk: defaultNoKk ? 'Anggota Keluarga' : 'Kepala Keluarga',
        hubunganKk: defaultNoKk ? 'Anak' : 'Kepala Keluarga',
      });
    }
    setIsModalOpen(true);
  };

  const handleSelectExistingKkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedExistingKk(val);
    if (val !== 'NEW') {
      const kepala = wargaList.find((w) => w.noKk === val && w.peranKk === 'Kepala Keluarga');
      if (kepala) {
        setFormData((prev) => ({
          ...prev,
          noKk: kepala.noKk,
          alamat: kepala.alamat,
          rt: kepala.rt,
          rw: kepala.rw,
          status: kepala.status,
          peranKk: 'Anggota Keluarga',
          hubunganKk: 'Anak',
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        noKk: '',
        peranKk: 'Kepala Keluarga',
        hubunganKk: 'Kepala Keluarga',
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate SHA-256 Hashes ONLY for database storage
    const nikHash = await hashSensitiveData(formData.nik);
    const noKkHash = await hashSensitiveData(formData.noKk);

    // Save to Supabase (ONLY sending nik_hash & no_kk_hash, NO plaintext NIK/KK)
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('warga').insert({
          nama: formData.nama,
          nik_hash: nikHash,
          no_kk_hash: noKkHash,
          alamat: formData.alamat,
          rt: formData.rt,
          rw: formData.rw,
          status: formData.status,
          jenis_kelamin: formData.jenisKelamin,
          usia: formData.usia,
          peran_kk: formData.peranKk,
          hubungan_kk: formData.hubunganKk,
        });
      } catch (err) {
        console.log('Insert warga error', err);
      }
    }

    if (editingWarga) {
      setWargaList((prev) =>
        prev.map((w) =>
          w.id === editingWarga.id ? { ...w, ...formData, nikHash, noKkHash } : w
        )
      );
    } else {
      const newWarga: ExtendedWarga = {
        id: Date.now().toString(),
        ...formData,
        nikHash,
        noKkHash,
      };
      setWargaList((prev) => [newWarga, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      setWargaList((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredWarga.map((w, idx) => ({
      No: idx + 1,
      'Nama Lengkap': w.nama,
      NIK: showFullNik ? w.nik : maskNik(w.nik),
      'No. KK': showFullNik ? w.noKk : maskNik(w.noKk),
      'Peran KK': w.peranKk,
      'Hubungan KK': w.hubunganKk || '-',
      'Jenis Kelamin': w.jenisKelamin,
      Usia: `${w.usia} Thn`,
      Alamat: w.alamat,
      RT: w.rt,
      RW: w.rw,
      Status: w.status,
    }));
    downloadCsv('Data_Warga_RW09', exportData);
  };

  // Filtered List
  const filteredWarga = wargaList.filter((w) => {
    const matchesSearch =
      w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.nik.includes(searchQuery) ||
      w.noKk.includes(searchQuery) ||
      w.alamat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRt = selectedRt === 'Semua RT' || w.rt === selectedRt;
    const matchesStatus = selectedStatus === 'Semua Status' || w.status === selectedStatus;
    const matchesKk = selectedKk === 'Semua Peran' || w.peranKk === selectedKk;

    let matchesUsia = true;
    if (selectedUsia === 'Balita (< 5 Thn)') {
      matchesUsia = w.usia < 5;
    } else if (selectedUsia === 'Anak & Remaja (5-17 Thn)') {
      matchesUsia = w.usia >= 5 && w.usia <= 17;
    } else if (selectedUsia === 'Dewasa (18-59 Thn)') {
      matchesUsia = w.usia >= 18 && w.usia <= 59;
    } else if (selectedUsia === 'Lansia (60+ Thn)') {
      matchesUsia = w.usia >= 60;
    }

    return matchesSearch && matchesRt && matchesStatus && matchesKk && matchesUsia;
  });

  // Grouped KK List
  const kkGroups = Array.from(new Set(wargaList.map((w) => w.noKk))).map((noKk) => {
    const members = wargaList.filter((w) => w.noKk === noKk);
    const kepala = members.find((w) => w.peranKk === 'Kepala Keluarga') || members[0];
    return {
      noKk,
      kepala,
      members,
      total: members.length,
    };
  });

  const activeKkData = activeKkNo
    ? {
        noKk: activeKkNo,
        kepala: wargaList.find((w) => w.noKk === activeKkNo && w.peranKk === 'Kepala Keluarga'),
        members: wargaList.filter((w) => w.noKk === activeKkNo),
      }
    : null;

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Manajemen Data Warga & KK" onSearch={setSearchQuery} />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Header Action Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#00216e]">Data Warga &amp; Kartu Keluarga</h2>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full flex items-center gap-1 border border-emerald-300">
                  <span className="material-symbols-outlined text-xs">lock</span> Terlindungi UU PDP
                </span>
              </div>
              <p className="text-sm text-[#444653] mt-1">
                Kelola data kependudukan dan Kartu Keluarga RW 09 dengan enkripsi keamanan terstandar.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFullNik(!showFullNik)}
                className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                  showFullNik
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {showFullNik ? 'visibility_off' : 'visibility'}
                </span>
                {showFullNik ? 'Sembunyikan NIK' : 'Tampilkan NIK Lengkap'}
              </button>

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
            <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-[#00216e] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#444653] font-semibold mb-1">Total Jiwa</p>
                  <h3 className="text-2xl font-bold text-[#00216e]">{wargaList.length} Jiwa</h3>
                </div>
                <span className="material-symbols-outlined p-2.5 bg-[#00216e]/10 text-[#00216e] rounded-lg">
                  groups
                </span>
              </div>
              <p className="text-xs text-green-700 font-semibold mt-3 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Terdata di RW 09
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-[#bb0013] shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#444653] font-semibold mb-1">Kepala Keluarga (KK)</p>
                  <h3 className="text-2xl font-bold text-[#bb0013]">{kkGroups.length} KK</h3>
                </div>
                <span className="material-symbols-outlined p-2.5 bg-[#bb0013]/10 text-[#bb0013] rounded-lg">
                  badge
                </span>
              </div>
              <p className="text-xs text-[#444653] mt-3">Kepala Keluarga terdaftar</p>
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
              <p className="text-xs text-[#444653] mt-3">Mendapat Layanan Posyandu</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e2e2] border-l-4 border-l-gray-400 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#444653] font-semibold mb-1">Kategori Balita (&lt;5)</p>
                  <h3 className="text-2xl font-bold text-[#1a1c1c]">
                    {wargaList.filter((w) => w.usia < 5).length} Balita
                  </h3>
                </div>
                <span className="material-symbols-outlined p-2.5 bg-gray-100 text-[#444653] rounded-lg">
                  child_care
                </span>
              </div>
              <p className="text-xs text-[#444653] mt-3">Anak usia dini</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-[#e2e2e2] shadow-sm">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('semua')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'semua'
                    ? 'bg-[#00216e] text-white shadow-sm'
                    : 'text-[#444653] hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-sm">list</span>
                Tampilan Semua Warga ({wargaList.length})
              </button>

              <button
                onClick={() => setViewMode('perKk')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                  viewMode === 'perKk'
                    ? 'bg-[#00216e] text-white shadow-sm'
                    : 'text-[#444653] hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-sm">family_restroom</span>
                Tampilan Per Kepala Keluarga / KK ({kkGroups.length} KK)
              </button>
            </div>
          </div>

          {/* Main Content View (Per KK vs Semua Warga) */}
          {viewMode === 'perKk' ? (
            /* KK Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kkGroups.map((group) => (
                <div
                  key={group.noKk}
                  className="bg-white rounded-xl border border-[#e2e2e2] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 border-b pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#00216e] uppercase tracking-wider">
                          NO. KK: {showFullNik ? group.noKk : maskNik(group.noKk)}
                        </span>
                        <h3 className="text-lg font-bold text-[#1a1c1c] mt-0.5">
                          Keluarga {group.kepala?.nama || 'Unknown'}
                        </h3>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                        {group.total} Anggota
                      </span>
                    </div>

                    <p className="text-xs text-[#444653] flex items-center gap-1 mb-4">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {group.kepala?.alamat} ({group.kepala?.rt} / {group.kepala?.rw})
                    </p>

                    {/* Member Avatars & Names preview */}
                    <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Daftar Anggota Keluarga:
                      </p>
                      {group.members.map((mem) => (
                        <div key={mem.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00216e]"></span>
                            <span className="font-semibold text-gray-800">{mem.nama}</span>
                            <span className="text-gray-500">({mem.usia} Thn)</span>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {mem.hubunganKk || mem.peranKk}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center border-t">
                    <button
                      onClick={() => setActiveKkNo(group.noKk)}
                      className="w-full bg-blue-50 hover:bg-[#00216e] text-[#00216e] hover:text-white font-bold py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Buka Kartu Keluarga Lengkap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View with Interactive KK Detail Trigger */
            <div className="bg-white rounded-xl border border-[#e2e2e2] overflow-hidden shadow-sm">
              {/* Multi Filters Header */}
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
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-white border border-[#c4c5d5] rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option>Semua Status</option>
                    <option>Tetap</option>
                    <option>Kontrak</option>
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

                  <select
                    value={selectedKk}
                    onChange={(e) => setSelectedKk(e.target.value)}
                    className="bg-white border border-[#c4c5d5] rounded-lg px-3 py-1.5 text-xs font-bold text-[#bb0013] focus:ring-2 focus:ring-[#bb0013] outline-none"
                  >
                    <option>Semua Peran</option>
                    <option value="Kepala Keluarga">Kepala Keluarga (KK)</option>
                    <option value="Anggota Keluarga">Anggota Keluarga</option>
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
                      <th className="px-6 py-4">NIK &amp; No. KK</th>
                      <th className="px-6 py-4">Peran KK</th>
                      <th className="px-6 py-4">Alamat (RT/RW)</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Aksi &amp; Detail KK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {filteredWarga.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          Tidak ada data warga yang cocok dengan kriteria filter.
                        </td>
                      </tr>
                    ) : (
                      filteredWarga.map((warga) => {
                        const initials = warga.nama
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('');

                        const isKepala = warga.peranKk === 'Kepala Keluarga';
                        const displayNik = showFullNik ? warga.nik : maskNik(warga.nik);
                        const displayNoKk = showFullNik ? warga.noKk : maskNik(warga.noKk);

                        return (
                          <tr key={warga.id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#00216e]/10 text-[#00216e] flex items-center justify-center font-bold text-xs shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <button
                                    onClick={() => setActiveKkNo(warga.noKk)}
                                    className="font-bold text-[#1a1c1c] hover:text-[#00216e] hover:underline text-left flex items-center gap-1.5"
                                  >
                                    {warga.nama}
                                    {isKepala && (
                                      <span className="material-symbols-outlined text-purple-600 text-base" title="Kepala Keluarga">
                                        family_restroom
                                      </span>
                                    )}
                                  </button>
                                  <p className="text-xs text-[#444653]">
                                    {warga.jenisKelamin}, <strong className="text-[#00216e]">{warga.usia} Thn</strong>
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-mono text-xs font-bold text-[#1a1c1c]">NIK: {displayNik}</p>
                              <p className="font-mono text-[11px] text-[#444653]">KK: {displayNoKk}</p>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setActiveKkNo(warga.noKk)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all hover:scale-105 ${
                                  isKepala
                                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {warga.peranKk}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-[#1a1c1c] text-xs">{warga.alamat}</p>
                              <p className="text-[11px] text-[#444653]">
                                {warga.rt} / {warga.rw}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  warga.status === 'Tetap'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {warga.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center items-center gap-2">
                                <button
                                  onClick={() => setActiveKkNo(warga.noKk)}
                                  className="px-2.5 py-1 bg-[#00216e] hover:bg-[#0033a0] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-sm">visibility</span>
                                  Lihat KK
                                </button>
                                <button
                                  onClick={() => handleOpenModal(warga)}
                                  className="p-1.5 text-[#00216e] hover:bg-blue-100 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(warga.id)}
                                  className="p-1.5 text-[#bb0013] hover:bg-red-100 rounded-lg transition-all"
                                  title="Hapus"
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
          )}
        </div>
      </main>

      {/* Modal Detail Kartu Keluarga (KK) */}
      {activeKkData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
                  FORMAT KARTU KELUARGA (KK)
                </span>
                <h3 className="text-xl font-extrabold text-[#00216e] mt-2">
                  No. KK: {showFullNik ? activeKkData.noKk : maskNik(activeKkData.noKk)}
                </h3>
                <p className="text-xs text-[#444653] mt-1">
                  Kepala Keluarga: <strong className="text-black">{activeKkData.kepala?.nama || 'Utama'}</strong> | {activeKkData.kepala?.alamat} ({activeKkData.kepala?.rt} / {activeKkData.kepala?.rw})
                </p>
              </div>

              <button
                onClick={() => setActiveKkNo(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Susunan Anggota Keluarga Table */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-[#1a1c1c]">
                  Daftar Anggota Keluarga ({activeKkData.members.length} Jiwa):
                </h4>
                <button
                  onClick={() => {
                    const noKk = activeKkData.noKk;
                    setActiveKkNo(null);
                    handleOpenModal(undefined, noKk);
                  }}
                  className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  + Tambah Anggota KK Ini
                </button>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#00216e] text-white font-bold uppercase">
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Nama Lengkap</th>
                      <th className="px-4 py-3">NIK</th>
                      <th className="px-4 py-3">Hubungan / Peran</th>
                      <th className="px-4 py-3">Gender / Usia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeKkData.members.map((member, idx) => (
                      <tr key={member.id} className="hover:bg-blue-50/50">
                        <td className="px-4 py-3 font-bold text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-bold text-[#1a1c1c]">
                          {member.nama}
                          {member.peranKk === 'Kepala Keluarga' && (
                            <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                              Kepala Keluarga
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{showFullNik ? member.nik : maskNik(member.nik)}</td>
                        <td className="px-4 py-3 font-semibold text-purple-700">
                          {member.hubunganKk || member.peranKk}
                        </td>
                        <td className="px-4 py-3">
                          {member.jenisKelamin}, <strong>{member.usia} Thn</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setActiveKkNo(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Warga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">
                {editingWarga ? 'Edit Data Warga' : 'Tambah Warga / Anggota Keluarga Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Kepala Keluarga Quick Select */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-[#00216e] uppercase">
                  Pilih / Hubungkan Ke Kepala Keluarga Exisiting:
                </label>
                <select
                  value={selectedExistingKk}
                  onChange={handleSelectExistingKkChange}
                  className="w-full px-3 py-2 bg-white border border-[#00216e] rounded-lg text-xs font-bold text-[#00216e] outline-none"
                >
                  <option value="NEW">+ Buat Kepala Keluarga Baru (KK Baru)</option>
                  {existingKepalaKeluarga.map((kepala) => (
                    <option key={kepala.id} value={kepala.noKk}>
                      Keluarga: {kepala.nama} (KK: {maskNik(kepala.noKk)} - {kepala.rt})
                    </option>
                  ))}
                </select>
                {selectedExistingKk !== 'NEW' && (
                  <p className="text-[11px] text-green-800 font-semibold">
                    ✓ Otomatis terhubung dengan KK <strong>{maskNik(selectedExistingKk)}</strong> ({formData.alamat})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Nama Lengkap Warga
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    NIK (16 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="16 digit NIK"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Nomor KK
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.noKk}
                    onChange={(e) => setFormData({ ...formData, noKk: e.target.value })}
                    placeholder="16 digit No. KK"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Usia (Thn)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.usia}
                    onChange={(e) => setFormData({ ...formData, usia: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Peran KK
                  </label>
                  <select
                    value={formData.peranKk}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        peranKk: e.target.value as 'Kepala Keluarga' | 'Anggota Keluarga',
                        hubunganKk: e.target.value === 'Kepala Keluarga' ? 'Kepala Keluarga' : 'Anak',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Anggota Keluarga">Anggota Keluarga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Hubungan KK
                  </label>
                  <select
                    value={formData.hubunganKk}
                    onChange={(e) => setFormData({ ...formData, hubunganKk: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="Kepala Keluarga">Kepala Keluarga</option>
                    <option value="Istri">Istri</option>
                    <option value="Anak">Anak</option>
                    <option value="Orang Tua">Orang Tua</option>
                    <option value="Mertua">Mertua</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Bugis No. 42"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    RT
                  </label>
                  <select
                    value={formData.rt}
                    onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option>RT 001</option>
                    <option>RT 002</option>
                    <option>RT 003</option>
                    <option>RT 004</option>
                    <option>RT 005</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'Tetap' | 'Kontrak' })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenisKelamin: e.target.value as 'Laki-laki' | 'Perempuan',
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
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

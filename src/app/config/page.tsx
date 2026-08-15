'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { getAppConfig, saveAppConfig, DEFAULT_APP_CONFIG, AppConfig } from '@/lib/configStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { hashSensitiveData } from '@/lib/security';

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setConfig(getAppConfig());
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = saveAppConfig(config);
    setConfig(updated);

    if (isSupabaseConfigured && supabase && config.adminUsername && config.adminPassword) {
      try {
        const hashedPassword = await hashSensitiveData(config.adminPassword);
        await supabase
          .from('admin_users')
          .upsert(
            {
              username: config.adminUsername.trim().toLowerCase(),
              password: hashedPassword,
              nama_admin: 'Pengurus RW 09',
            },
            { onConflict: 'username' }
          );
      } catch (err) {
        console.warn('Sync admin credentials to Supabase error:', err);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Pengaturan System & Config" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Pengaturan Config Aplikasi</h2>
              <p className="text-sm text-[#444653] mt-1">
                Atur identitas wilayah RW, tarif iuran, dan konfigurasi kegiatan RW 09.
              </p>
            </div>

            {savedSuccess && (
              <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-top-4 duration-300 border border-emerald-400">
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <span>Pengaturan Berhasil Disimpan!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Section 1: Identitas Sekretariat RW */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e2e2] shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00216e] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">home_work</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#00216e]">Identitas Sekretariat RW</h3>
                  <p className="text-xs text-gray-500">Alamat sekretariat, nama pengurus & kota administrasi</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Alamat Sekretariat RW
                  </label>
                  <input
                    type="text"
                    required
                    value={config.alamatSekretariat}
                    onChange={(e) => setConfig({ ...config, alamatSekretariat: e.target.value })}
                    placeholder="Jln. Swasembada Barat VI. No.39 Rt.016/09"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Jabatan / Nama Ketua RW
                  </label>
                  <input
                    type="text"
                    required
                    value={config.namaKetuaRw}
                    onChange={(e) => setConfig({ ...config, namaKetuaRw: e.target.value })}
                    placeholder="Bpk. Ketua RW 09"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Kota Administrasi
                  </label>
                  <input
                    type="text"
                    required
                    value={config.kotaAdmin}
                    onChange={(e) => setConfig({ ...config, kotaAdmin: e.target.value })}
                    placeholder="Jakarta Utara"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Config Iuran */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e2e2] shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#bb0013] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#bb0013]">Konfigurasi Iuran Bulanan Warga</h3>
                  <p className="text-xs text-gray-500">Tarif iuran standard, target penagihan (Per KK/Warga/Umur) & jatuh tempo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Nominal Iuran Standard (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={5000}
                    value={config.nominalIuranStandard}
                    onChange={(e) =>
                      setConfig({ ...config, nominalIuranStandard: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#bb0013] focus:bg-white focus:outline-none transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Jadwal Jatuh Tempo
                  </label>
                  <input
                    type="text"
                    required
                    value={config.jatuhTempoIuran}
                    onChange={(e) => setConfig({ ...config, jatuhTempoIuran: e.target.value })}
                    placeholder="Tanggal 10 tiap bulan"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#bb0013] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Metode Pembayaran
                  </label>
                  <input
                    type="text"
                    required
                    value={config.metodePembayaran}
                    onChange={(e) => setConfig({ ...config, metodePembayaran: e.target.value })}
                    placeholder="Tunai via RT / Transfer Kas"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#bb0013] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Target Penagihan Auto Click Config */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#00216e] mb-3">
                  Target Penagihan Auto-Click Iuran
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Option 1: Per KK */}
                  <div
                    onClick={() => setConfig({ ...config, targetIuranMode: 'perKk' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.targetIuranMode === 'perKk'
                        ? 'border-[#00216e] bg-blue-50/50 shadow-md ring-2 ring-[#00216e]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        config.targetIuranMode === 'perKk' ? 'bg-[#00216e] text-white' : 'bg-gray-100 text-[#00216e]'
                      }`}>
                        <span className="material-symbols-outlined text-lg">home</span>
                      </div>
                      <input
                        type="radio"
                        name="targetIuranMode"
                        checked={config.targetIuranMode === 'perKk'}
                        onChange={() => setConfig({ ...config, targetIuranMode: 'perKk' })}
                        className="w-4 h-4 accent-[#00216e] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Per KK (Kartu Keluarga)</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Dibebankan 1x per Rumah / KK.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Per Warga */}
                  <div
                    onClick={() => setConfig({ ...config, targetIuranMode: 'perWarga' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.targetIuranMode === 'perWarga'
                        ? 'border-[#00216e] bg-blue-50/50 shadow-md ring-2 ring-[#00216e]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        config.targetIuranMode === 'perWarga' ? 'bg-[#00216e] text-white' : 'bg-gray-100 text-[#00216e]'
                      }`}>
                        <span className="material-symbols-outlined text-lg">groups</span>
                      </div>
                      <input
                        type="radio"
                        name="targetIuranMode"
                        checked={config.targetIuranMode === 'perWarga'}
                        onChange={() => setConfig({ ...config, targetIuranMode: 'perWarga' })}
                        className="w-4 h-4 accent-[#00216e] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Per Setiap Jiwa</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Dibebankan individu ke seluruh warga.
                      </p>
                    </div>
                  </div>

                  {/* Option 3: Per Umur */}
                  <div
                    onClick={() => setConfig({ ...config, targetIuranMode: 'perUmur' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.targetIuranMode === 'perUmur'
                        ? 'border-[#00216e] bg-blue-50/50 shadow-md ring-2 ring-[#00216e]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        config.targetIuranMode === 'perUmur' ? 'bg-[#00216e] text-white' : 'bg-gray-100 text-[#00216e]'
                      }`}>
                        <span className="material-symbols-outlined text-lg">cake</span>
                      </div>
                      <input
                        type="radio"
                        name="targetIuranMode"
                        checked={config.targetIuranMode === 'perUmur'}
                        onChange={() => setConfig({ ...config, targetIuranMode: 'perUmur' })}
                        className="w-4 h-4 accent-[#00216e] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Berdasarkan Umur</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Dibebankan pada rentang usia tertentu.
                      </p>
                    </div>
                  </div>

                  {/* Option 4: Per RT */}
                  <div
                    onClick={() => setConfig({ ...config, targetIuranMode: 'perRt' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.targetIuranMode === 'perRt'
                        ? 'border-[#00216e] bg-blue-50/50 shadow-md ring-2 ring-[#00216e]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        config.targetIuranMode === 'perRt' ? 'bg-[#00216e] text-white' : 'bg-gray-100 text-[#00216e]'
                      }`}>
                        <span className="material-symbols-outlined text-lg">grid_view</span>
                      </div>
                      <input
                        type="radio"
                        name="targetIuranMode"
                        checked={config.targetIuranMode === 'perRt'}
                        onChange={() => setConfig({ ...config, targetIuranMode: 'perRt' })}
                        className="w-4 h-4 accent-[#00216e] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Per Ketua RT</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Tagihan dikumpulkan secara kolektif per Ketua RT.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-panel if Per Umur is selected */}
                {config.targetIuranMode === 'perUmur' && (
                  <div className="mt-4 p-5 bg-blue-50/70 border border-blue-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[#00216e] mb-1.5">
                        Minimal Usia Wajib Iuran (Tahun)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.minUsiaIuran}
                        onChange={(e) =>
                          setConfig({ ...config, minUsiaIuran: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] focus:outline-none"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Anak-anak & balita di bawah usia ini bebas iuran</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-[#00216e] mb-1.5">
                        Maksimal Usia Wajib Iuran (Tahun)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.maxUsiaIuran}
                        onChange={(e) =>
                          setConfig({ ...config, maxUsiaIuran: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-sm font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] focus:outline-none"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">Lansia di atas usia ini bebas iuran</p>
                    </div>
                  </div>
                )}

                {/* Sub-panel if Per RT is selected */}
                {config.targetIuranMode === 'perRt' && (
                  <div className="mt-4 p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#00216e]">
                      Tarif Nominal Khusus Per Ketua RT (RT 01 - RT 07)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07'].map((rtKey) => (
                        <div key={rtKey}>
                          <label className="block text-[11px] font-bold text-[#00216e] mb-1">
                            {rtKey}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={5000}
                            value={config.iuranPerRtMap?.[rtKey] || config.nominalIuranStandard}
                            onChange={(e) =>
                              setConfig({
                                ...config,
                                iuranPerRtMap: {
                                  ...config.iuranPerRtMap,
                                  [rtKey]: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-[#00216e] focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Config Kegiatan */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e2e2] shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#012366] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#012366]">Konfigurasi Agenda & Kegiatan</h3>
                  <p className="text-xs text-gray-500">Lokasi & waktu default pembuatan kegiatan baru</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Default Lokasi Kegiatan
                  </label>
                  <input
                    type="text"
                    required
                    value={config.defaultLokasiKegiatan}
                    onChange={(e) => setConfig({ ...config, defaultLokasiKegiatan: e.target.value })}
                    placeholder="Balai Warga RW 09"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#012366] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Default Waktu Pelaksanaan
                  </label>
                  <input
                    type="text"
                    required
                    value={config.defaultWaktuKegiatan}
                    onChange={(e) => setConfig({ ...config, defaultWaktuKegiatan: e.target.value })}
                    placeholder="08:00 WIB"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#012366] focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Status Management Mode */}
              <div className="pt-6 border-t border-gray-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#012366] mb-3">
                  Mode Penentuan & Perubahan Status Kegiatan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mode Manual */}
                  <div
                    onClick={() => setConfig({ ...config, modeStatusKegiatan: 'manual' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.modeStatusKegiatan === 'manual'
                        ? 'border-[#012366] bg-indigo-50/50 shadow-md ring-2 ring-[#012366]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        config.modeStatusKegiatan === 'manual' ? 'bg-[#012366] text-white' : 'bg-gray-100 text-[#012366]'
                      }`}>
                        <span className="material-symbols-outlined text-base">edit_note</span>
                      </div>
                      <input
                        type="radio"
                        name="modeStatusKegiatan"
                        checked={config.modeStatusKegiatan === 'manual'}
                        onChange={() => setConfig({ ...config, modeStatusKegiatan: 'manual' })}
                        className="w-4 h-4 accent-[#012366] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Mode Manual (Bisa Ubah Status Dropdown)</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Admin bebas mengubah status kegiatan secara langsung lewat dropdown status di halaman kegiatan.
                      </p>
                    </div>
                  </div>

                  {/* Mode Otomatis Expiration */}
                  <div
                    onClick={() => setConfig({ ...config, modeStatusKegiatan: 'auto' })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                      config.modeStatusKegiatan === 'auto'
                        ? 'border-[#012366] bg-indigo-50/50 shadow-md ring-2 ring-[#012366]/10'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        config.modeStatusKegiatan === 'auto' ? 'bg-[#012366] text-white' : 'bg-gray-100 text-[#012366]'
                      }`}>
                        <span className="material-symbols-outlined text-base">schedule</span>
                      </div>
                      <input
                        type="radio"
                        name="modeStatusKegiatan"
                        checked={config.modeStatusKegiatan === 'auto'}
                        onChange={() => setConfig({ ...config, modeStatusKegiatan: 'auto' })}
                        className="w-4 h-4 accent-[#012366] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1a1c1c]">Mode Otomatis (UTC+7 WIB Expiration)</p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Status kegiatan otomatis berubah ke 'Selesai' begitu tanggal & jam pelaksanaan terlewati.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Default Status Dropdown */}
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Default Status Pendaftaran Kegiatan Baru
                  </label>
                  <select
                    value={config.defaultStatusKegiatan || 'Mendatang'}
                    onChange={(e) => setConfig({ ...config, defaultStatusKegiatan: e.target.value as any })}
                    className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#012366] focus:ring-2 focus:ring-[#012366] focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Mendatang">Mendatang</option>
                    <option value="Berlangsung">Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Config Akun Admin */}
            <div className="bg-white p-6 rounded-2xl border border-[#e2e2e2] shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1c]">Keamanan & Akun Login Admin</h3>
                  <p className="text-xs text-gray-500">Ubah username & password login administrator</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Username Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={config.adminUsername || 'admin'}
                    onChange={(e) => setConfig({ ...config, adminUsername: e.target.value })}
                    placeholder="admin"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
                    Password Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={config.adminPassword || 'admin'}
                    onChange={(e) => setConfig({ ...config, adminPassword: e.target.value })}
                    placeholder="Masukkan password admin baru"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-[#00216e] focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Password ini digunakan untuk login ke portal administrator RW 09.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="bg-[#00216e] hover:bg-[#0033a0] text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Simpan Semua Pengaturan
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

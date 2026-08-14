'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_SURAT, SuratPengantar } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { hashSensitiveData } from '@/lib/security';
import { getAppConfig, formatNoSurat, renderFormattedNoSurat } from '@/lib/configStore';

export default function SuratPage() {
  const [config, setConfig] = useState(getAppConfig());
  const [suratList, setSuratList] = useState<SuratPengantar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurat, setSelectedSurat] = useState<SuratPengantar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [formData, setFormData] = useState({
    namaPemohon: '',
    nik: '',
    jenisSurat: 'Surat Keterangan Domisili',
    keperluan: '',
  });

  useEffect(() => {
    let isMounted = true;
    setConfig(getAppConfig());

    async function loadSurat() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          const { data, error } = await supabase.from('surat_pengantar').select('*');

          if (isMounted) {
            if (data && !error && data.length > 0) {
              const formatted: SuratPengantar[] = data.map((d: any) => ({
                id: d.id,
                noSurat: d.no_surat,
                namaPemohon: d.nama_pemohon,
                nik: d.nik || (d.nik_hash && d.nik_hash.length === 16 ? d.nik_hash : '3172010405780001'),
                jenisSurat: d.jenis_surat,
                keperluan: d.keperluan,
                tanggal: d.tanggal,
                status: d.status,
              }));
              setSuratList(formatted);
              setSelectedSurat(formatted[0]);
            } else {
              setSuratList(INITIAL_SURAT);
              setSelectedSurat(INITIAL_SURAT[0]);
            }
          }
        } catch (err) {
          console.log('Fetch surat error', err);
          if (isMounted) {
            setSuratList(INITIAL_SURAT);
            setSelectedSurat(INITIAL_SURAT[0]);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        if (isMounted) {
          setSuratList(INITIAL_SURAT);
          setSelectedSurat(INITIAL_SURAT[0]);
          setLoading(false);
        }
      }
    }

    loadSurat();

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
    if (formData.nik.length !== 16) {
      alert('NIK Pemohon harus berjumlah persis 16 digit angka!');
      return;
    }
    const appConfig = getAppConfig();
    const count = suratList.length + 1;
    const today = new Date();
    const noSurat = formatNoSurat(appConfig.suratPrefixFormat, count, today);

    const nikHash = await hashSensitiveData(formData.nik);

    if (isSupabaseConfigured && supabase) {
      try {
        const { status, error } = await supabase.from('surat_pengantar').insert({
          no_surat: noSurat,
          nama_pemohon: formData.namaPemohon,
          nik: formData.nik,
          nik_hash: nikHash,
          jenis_surat: formData.jenisSurat,
          keperluan: formData.keperluan,
          tanggal: today.toISOString().split('T')[0],
          status: 'Selesai',
        });

        if (error || (status !== 200 && status !== 201)) {
          alert(`❌ Gagal terkirim! ${error?.message || 'Terjadi kesalahan pada database.'}`);
          return;
        }
      } catch (err: any) {
        console.log('Insert surat error', err);
        alert(`❌ Gagal terkirim! ${err?.message || ''}`);
        return;
      }
    }

    showToast('Surat Pengantar Berhasil Dibuat!');
    const newSurat: SuratPengantar = {
      id: Date.now().toString(),
      noSurat,
      namaPemohon: formData.namaPemohon,
      nik: formData.nik,
      jenisSurat: formData.jenisSurat,
      keperluan: formData.keperluan,
      tanggal: today.toISOString().split('T')[0],
      status: 'Selesai',
    };

    setSuratList([newSurat, ...suratList]);
    setSelectedSurat(newSurat);
    setIsModalOpen(false);
    setFormData({
      namaPemohon: '',
      nik: '',
      jenisSurat: 'Surat Keterangan Domisili',
      keperluan: '',
    });
  };

  const handlePrint = () => {
    showToast('Menyiapkan Cetak Kop Surat...');
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-2xl animate-in slide-in-from-top-4 duration-300 border border-emerald-400 no-print">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="no-print">
        <Sidebar />
      </div>

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col no-print">
        <Header title="Surat Pengantar RW 09" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#00216e]">Layanan Surat Pengantar Official</h2>
              <p className="text-sm text-[#444653] mt-1">
                Penerbitan surat pengantar resmi RW 09 Kebon Bawang, Jakarta Utara.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_notes</span>
              Buat Surat Pengantar
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-[#e2e2e2] p-8 shadow-sm animate-pulse space-y-6">
              <div className="w-48 h-6 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center py-4 border-b border-gray-100">
                    <div className="space-y-2">
                      <div className="w-40 h-4 bg-gray-200 rounded"></div>
                      <div className="w-24 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List Surat */}
            <div className="lg:col-span-1 bg-white border border-[#e2e2e2] rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-[#1a1c1c] text-sm border-b pb-2">
                Daftar Surat Pengantar
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {suratList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSurat(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedSurat?.id === item.id
                        ? 'border-[#00216e] bg-blue-50/60 shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-mono text-[#00216e] font-bold">
                        {renderFormattedNoSurat(item.noSurat, config.suratPrefixFormat)}
                      </span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                        {item.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1a1c1c] mt-1">{item.namaPemohon}</h4>
                    <p className="text-xs text-[#444653] mt-0.5">{item.jenisSurat}</p>
                    <p className="text-[11px] text-gray-400 mt-2">{item.tanggal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Preview Box */}
            <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm flex flex-col justify-between">
              {selectedSurat ? (
                <div>
                  <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h3 className="font-bold text-[#00216e]">Preview Format Cetak</h3>
                    <button
                      onClick={handlePrint}
                      className="bg-[#bb0013] hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">print</span>
                      Cetak Surat
                    </button>
                  </div>

                  {/* Surat Official Layout */}
                  <div
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                    className="border border-gray-300 p-8 rounded-lg bg-white shadow-inner text-black space-y-6"
                  >
                    {/* Kop Surat Official DKI Jakarta */}
                    <div className="border-b-4 border-double border-black pb-3 mb-4 flex items-center gap-4">
                      {/* Logo Jaya Raya DKI Jakarta */}
                      <img
                        src="/logo-dki.svg"
                        alt="Logo Jaya Raya Jakarta"
                        className="w-16 h-20 object-contain shrink-0"
                      />
                      <div className="flex-1 text-center font-bold text-black leading-snug">
                        <h2 className="text-lg uppercase tracking-wide font-bold">
                          RUKUN WARGA (RW) 09
                        </h2>
                        <h3 className="text-sm uppercase font-bold">
                          KELURAHAN KEBON BAWANG, KECAMATAN TANJUNG PRIOK
                        </h3>
                        <h4 className="text-sm uppercase font-bold">
                          KOTA ADMINISTRASI {config.kotaAdmin.toUpperCase()}
                        </h4>
                        <p className="text-xs font-semibold text-black mt-1 font-sans">
                          Sekretariat : {config.alamatSekretariat}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-black pt-1 pb-2">
                      No: {renderFormattedNoSurat(selectedSurat.noSurat, config.suratPrefixFormat)}
                    </div>

                    <div className="text-center pt-2">
                      <h3 className="text-base font-bold uppercase underline">
                        {selectedSurat.jenisSurat}
                      </h3>
                    </div>

                    <p className="text-sm leading-relaxed">
                      Yang bertanda tangan di bawah ini Pengurus RW 09 Kelurahan Kebon Bawang, Kecamatan Tanjung Priok, Jakarta Utara, dengan ini menerangkan bahwa:
                    </p>

                    <div className="pl-6 space-y-2 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="font-semibold">Nama Lengkap</span>
                        <span className="col-span-2">: {selectedSurat.namaPemohon}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="font-semibold">NIK</span>
                        <span className="col-span-2">: {selectedSurat.nik}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="font-semibold">Keperluan</span>
                        <span className="col-span-2">: {selectedSurat.keperluan}</span>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed">
                      Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
                    </p>

                    <div className="pt-8 flex justify-between items-end text-sm">
                      <div></div>
                      <div className="text-center space-y-16">
                        <p>{config.kotaAdmin}, {selectedSurat.tanggal}</p>
                        <p className="font-bold underline">{config.namaKetuaRw}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                  <span className="material-symbols-outlined text-4xl mb-2">description</span>
                  <p className="text-sm font-medium">
                    Pilih surat di sebelah kiri untuk melihat preview cetak
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Modal Form Surat */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Pengajuan Surat Pengantar</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">
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
                  value={formData.namaPemohon}
                  onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value })}
                  placeholder="Masukkan nama pemohon"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  NIK Pemohon (Persis 16 Digit Angka)
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 16);
                    setFormData({ ...formData, nik: onlyNums });
                  }}
                  placeholder="Contoh: 3172010405780001"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none font-mono"
                />
                {formData.nik.length > 0 && formData.nik.length < 16 && (
                  <p className="text-[11px] text-red-500 font-semibold mt-1">
                    NIK kurang {16 - formData.nik.length} digit (harus 16 digit angka).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Jenis Surat
                </label>
                <select
                  value={formData.jenisSurat}
                  onChange={(e) => setFormData({ ...formData, jenisSurat: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                >
                  <option>Surat Keterangan Domisili</option>
                  <option>Surat Keterangan Usaha</option>
                  <option>Surat Pengantar Pembuatan KTP/KK</option>
                  <option>Surat Keterangan Tidak Mampu (SKTM)</option>
                  <option>Surat Keterangan Kematian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Keperluan Detail
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.keperluan}
                  onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
                  placeholder="Contoh: Persyaratan pembuatan KTP baru"
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
                  Terbitkan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

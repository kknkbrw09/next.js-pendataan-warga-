'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_SURAT, SuratPengantar } from '@/lib/store';

export default function SuratPage() {
  const [suratList, setSuratList] = useState<SuratPengantar[]>(INITIAL_SURAT);
  const [selectedSurat, setSelectedSurat] = useState<SuratPengantar | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    namaPemohon: '',
    nik: '',
    jenisSurat: 'Surat Keterangan Domisili',
    keperluan: '',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const count = suratList.length + 1;
    const padCount = count.toString().padStart(3, '0');
    const today = new Date();
    const monthRom = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][
      today.getMonth()
    ];
    const noSurat = `${padCount}/RW09/KB/${monthRom}/${today.getFullYear()}`;

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
    window.print();
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
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
                        {item.noSurat}
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
                  <div className="border border-gray-300 p-8 rounded-lg bg-white shadow-inner font-serif text-black space-y-6">
                    {/* Kop Surat */}
                    <div className="text-center border-b-4 border-double border-black pb-4">
                      <h2 className="text-lg font-bold uppercase tracking-widest">
                        RUKUN WARGA 09 KELURAHAN KEBON BAWANG
                      </h2>
                      <h3 className="text-sm font-semibold uppercase">
                        KECAMATAN TANJUNG PRIOK - KOTA ADMINISTRASI JAKARTA UTARA
                      </h3>
                      <p className="text-xs italic mt-1">
                        Sekretariat: Jl. Bugis No. 42, Kebon Bawang, Jakarta Utara 14320
                      </p>
                    </div>

                    <div className="text-center">
                      <h3 className="text-base font-bold uppercase underline">
                        {selectedSurat.jenisSurat}
                      </h3>
                      <p className="text-xs font-mono mt-1">
                        Nomor: {selectedSurat.noSurat}
                      </p>
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
                        <p>Jakarta, {selectedSurat.tanggal}</p>
                        <p className="font-bold underline">Bpk. Ketua RW 09</p>
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
                  NIK Pemohon
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

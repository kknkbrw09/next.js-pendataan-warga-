'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_WARGA, INITIAL_KEGIATAN, INITIAL_PENGUMUMAN, INITIAL_KEUANGAN, INITIAL_SURAT } from '@/lib/store';

export default function GuestPage() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live Supabase / Store States
  const [wargaCount, setWargaCount] = useState<number>(INITIAL_WARGA.length);
  const [kegiatanList, setKegiatanList] = useState(INITIAL_KEGIATAN);
  const [pengumumanList, setPengumumanList] = useState(INITIAL_PENGUMUMAN);
  const [wargaDisplayList, setWargaDisplayList] = useState<any[]>(INITIAL_WARGA);
  const [transaksiDisplayList, setTransaksiDisplayList] = useState<any[]>(INITIAL_KEUANGAN);
  const [antrianDisplayList, setAntrianDisplayList] = useState<any[]>(INITIAL_SURAT);
  const [saldoKas, setSaldoKas] = useState<number>(45280000);

  const currentYear = new Date().getFullYear();

  // Guest Search Filter State
  const [searchWargaQuery, setSearchWargaQuery] = useState<string>('');

  const [formData, setFormData] = useState({
    namaPemohon: '',
    rt: 'RT 001',
    keperluan: 'Pengurusan Surat Keterangan Domisili',
  });

  const [loading, setLoading] = useState(true);

  // Fetch live data from Supabase if configured
  useEffect(() => {
    async function loadLiveData() {
      if (isSupabaseConfigured && supabase) {
        try {
          setLoading(true);
          // Fetch Warga (id, nama, tahun_lahir, rt)
          const { data: wargaData } = await supabase
            .from('warga')
            .select('id, nama, tahun_lahir, rt');

          if (wargaData) {
            setWargaCount(wargaData.length);
            setWargaDisplayList(wargaData);
          }

          // Fetch Kegiatan
          const { data: kegData } = await supabase.from('kegiatan').select('*');
          if (kegData) {
            setKegiatanList(kegData);
          }

          // Fetch Pengumuman
          const { data: pengData } = await supabase.from('pengumuman').select('*');
          if (pengData) {
            setPengumumanList(pengData);
          }

          // Fetch Keuangan
          const { data: keuData } = await supabase.from('keuangan').select('*').order('tanggal', { ascending: false });
          if (keuData) {
            setTransaksiDisplayList(keuData);
            const pem = keuData.filter((k: any) => k.jenis === 'pemasukan').reduce((a: number, b: any) => a + Number(b.jumlah), 0);
            const peng = keuData.filter((k: any) => k.jenis === 'pengeluaran').reduce((a: number, b: any) => a + Number(b.jumlah), 0);
            setSaldoKas(pem - peng);
          }

          // Fetch Antrian Pelayanan
          const { data: antrianData } = await supabase.from('surat_pengantar').select('*').order('created_at', { ascending: false });
          if (antrianData && antrianData.length > 0) {
            setAntrianDisplayList(antrianData);
          }
        } catch (e) {
          console.log('Guest load error', e);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadLiveData();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'dashboard',
        'data-warga',
        'keuangan',
        'kegiatan',
        'antrian-pelayanan',
        'pengumuman',
      ];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openFormWithCategory = (keperluan: string) => {
    setFormData((prev) => ({ ...prev, keperluan }));
    setIsModalOpen(true);
  };

  const handleGuestSubmitAntrian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPemohon.trim()) {
      alert('Nama pemohon wajib diisi!');
      return;
    }

    const count = antrianDisplayList.length + 1;
    const generatedNoAntrian = `A-${count.toString().padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    // Insert into Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('surat_pengantar').insert({
          no_antrian: generatedNoAntrian,
          nama_pemohon: formData.namaPemohon,
          rt: formData.rt,
          keperluan: formData.keperluan,
          tanggal: today,
          status: 'Menunggu',
        });

        if (error) {
          alert(`❌ Gagal terkirim! ${error.message}`);
          return;
        }
      } catch (err: any) {
        console.log('Insert error', err);
        alert(`❌ Gagal terkirim! ${err?.message || ''}`);
        return;
      }
    }

    const newAntrian = {
      id: Date.now().toString(),
      no_antrian: generatedNoAntrian,
      nama_pemohon: formData.namaPemohon,
      rt: formData.rt,
      keperluan: formData.keperluan,
      tanggal: today,
      status: 'Menunggu',
    };

    setAntrianDisplayList([newAntrian, ...antrianDisplayList]);
    setSuccessMessage(
      `Pengajuan antrian atas nama ${formData.namaPemohon} berhasil terdaftar! Nomor Antrian: ${generatedNoAntrian}`
    );
    setIsModalOpen(false);
    setFormData({
      namaPemohon: '',
      rt: 'RT 001',
      keperluan: 'Pengurusan Surat Keterangan Domisili',
    });
  };

  // Safe client-side search filtering
  const filteredWargaDisplay = wargaDisplayList.filter((w: any) => {
    const q = searchWargaQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      w.nama.toLowerCase().includes(q) ||
      (w.rt && w.rt.toLowerCase().includes(q))
    );
  });

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rw_role');
      localStorage.removeItem('admin_name');
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  const navLinks = [
    { href: '#dashboard', id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '#data-warga', id: 'data-warga', label: 'Data Warga', icon: 'groups' },
    { href: '#keuangan', id: 'keuangan', label: 'Keuangan', icon: 'payments' },
    { href: '#kegiatan', id: 'kegiatan', label: 'Kegiatan', icon: 'event' },
    { href: '#antrian-pelayanan', id: 'antrian-pelayanan', label: 'Antrian Pelayanan', icon: 'confirmation_number' },
    { href: '#pengumuman', id: 'pengumuman', label: 'Pengumuman', icon: 'campaign' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      {/* SideNavBar Guest */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-[#012366] flex flex-col py-6 shadow-sm z-50 overflow-y-auto">
        <div className="px-6 mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#bb0013] flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white">shield</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Tamu</h2>
              <p className="text-xs text-white/60">Guest Access</p>
            </div>
          </div>
          <div className="mt-3 px-3 py-1 bg-blue-700 text-white text-[10px] font-bold tracking-widest uppercase rounded-full w-fit flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
            Akses Warga / Tamu
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-4">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                activeSection === link.id
                  ? 'bg-[#0033a0]/40 text-white border-l-4 border-[#b6c4ff]'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="px-4 mt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-red-500/20 hover:text-white transition-all font-semibold text-sm rounded-lg text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Logout Tamu</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-[280px] flex-1 flex flex-col min-h-screen">
        {/* Top Header Guest */}
        <header className="flex justify-between items-center h-16 px-8 bg-white border-b border-[#e2e2e2] z-40 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[#00216e]">Portal Komunitas</h1>
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            <span className="text-sm font-semibold text-[#444653]">RW 09 Kebon Bawang</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-[#bb0013] hover:bg-red-700 text-white px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content Sections */}
        <div className="p-8 space-y-16 pb-20">
          {/* Notification Alert if submitted */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                <p className="text-sm font-semibold">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* Dashboard Section */}
          <section id="dashboard" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1c1c]">Dashboard Komunitas</h2>
              <p className="text-sm text-[#444653]">Ringkasan statistik real-time RW 09 langsung dari database.</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm h-32">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-32 h-6 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#e2e2e2] rounded-xl p-6 border-t-4 border-t-[#00216e] shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-3 bg-[#00216e]/10 text-[#00216e] rounded-lg">
                      <span className="material-symbols-outlined">groups</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#444653]">LIVE DB</span>
                  </div>
                  <p className="text-xs text-[#444653] font-semibold uppercase tracking-wider">Total Warga</p>
                  <h3 className="text-3xl font-bold text-[#1a1c1c] mt-1">{wargaCount} Jiwa</h3>
                </div>

                <div className="bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-3 bg-gray-100 text-[#444653] rounded-lg">
                      <span className="material-symbols-outlined">event_note</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#444653]">AKTIF</span>
                  </div>
                  <p className="text-xs text-[#444653] font-semibold uppercase tracking-wider">Total Kegiatan</p>
                  <h3 className="text-3xl font-bold text-[#1a1c1c] mt-1">{kegiatanList.length} Agenda</h3>
                </div>

                <div className="bg-white border border-[#e2e2e2] rounded-xl p-6 border-t-4 border-t-[#00216e] shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-3 bg-[#00216e]/10 text-[#00216e] rounded-lg">
                      <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#444653]">KAS KELOLAAN</span>
                  </div>
                  <p className="text-xs text-[#444653] font-semibold uppercase tracking-wider">Saldo Kas RW</p>
                  <h3 className="text-2xl font-bold text-[#1a1c1c] mt-1">Rp {saldoKas.toLocaleString('id-ID')}</h3>
                </div>
              </div>
            )}
          </section>

          {/* Data Warga Section */}
          <section id="data-warga" className="scroll-mt-20 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1c1c]">Data Demografi Warga</h2>
                <p className="text-sm text-[#444653]">Demografi dan daftar nama warga terdaftar.</p>
              </div>

              {/* Search Input Field */}
              <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchWargaQuery}
                  onChange={(e) => setSearchWargaQuery(e.target.value)}
                  placeholder="Cari nama warga / RT..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#00216e] outline-none shadow-sm"
                />
              </div>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase">
                    <th className="px-6 py-4">Nama Warga</th>
                    <th className="px-6 py-4">Estimasi Usia</th>
                    <th className="px-6 py-4">Wilayah RT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {filteredWargaDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        {searchWargaQuery
                          ? `Tidak ada warga yang cocok dengan kata kunci "${searchWargaQuery}"`
                          : 'Belum ada data warga di database.'}
                      </td>
                    </tr>
                  ) : (
                    filteredWargaDisplay.map((w: any, idx: number) => {
                      const thn = Number(w.tahun_lahir || w.tahunLahir) || 1990;
                      const usia = currentYear - thn;
                      return (
                        <tr key={w.id || idx}>
                          <td className="px-6 py-4 font-bold text-[#1a1c1c]">{w.nama}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className="px-2.5 py-1 bg-blue-50 text-[#00216e] font-bold rounded">
                              {usia} Tahun
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold">{w.rt || 'RT 001'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Keuangan Section */}
          <section id="keuangan" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1c1c]">Transparansi Keuangan</h2>
              <p className="text-sm text-[#444653]">Laporan kas terbuka dan riwayat transaksi dana warga.</p>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gray-50 border-b font-bold text-[#00216e] text-sm">
                Riwayat Transaksi Keuangan Real-Time
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase">
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Keterangan</th>
                      <th className="px-6 py-4">Kategori</th>
                      <th className="px-6 py-4 text-right">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {transaksiDisplayList.map((t: any, idx: number) => (
                      <tr key={t.id || idx}>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500 font-bold">{t.tanggal}</td>
                        <td className="px-6 py-4 font-semibold text-[#1a1c1c]">{t.keterangan}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-[#00216e] text-xs font-bold rounded">
                            {t.kategori}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold">
                          <span className={t.jenis === 'pemasukan' ? 'text-[#00216e]' : 'text-[#bb0013]'}>
                            {t.jenis === 'pemasukan' ? '+' : '-'} Rp {Number(t.jumlah).toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Antrian Pelayanan Section */}
          <section id="antrian-pelayanan" className="scroll-mt-20 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-[#1a1c1c]">Antrian Pelayanan Warga</h2>
                <p className="text-sm text-[#444653]">
                  Daftar antrian permohonan dan layanan warga RW 09.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#00216e] hover:bg-[#0033a0] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add_card</span>
                Daftar Antrian Baru
              </button>
            </div>

            <div className="bg-white border border-[#e2e2e2] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase">
                    <th className="px-6 py-4">No. Antrian</th>
                    <th className="px-6 py-4">Nama Pemohon</th>
                    <th className="px-6 py-4">RT</th>
                    <th className="px-6 py-4">Keperluan</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {antrianDisplayList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Belum ada data antrian pelayanan.
                      </td>
                    </tr>
                  ) : (
                    antrianDisplayList.map((a: any, idx: number) => (
                      <tr key={a.id || idx}>
                        <td className="px-6 py-4 font-mono font-bold text-[#00216e]">{a.no_antrian || a.noAntrian || 'A-001'}</td>
                        <td className="px-6 py-4 font-bold text-[#1a1c1c]">{a.nama_pemohon || a.namaPemohon}</td>
                        <td className="px-6 py-4 text-xs font-semibold">{a.rt || 'RT 001'}</td>
                        <td className="px-6 py-4 text-xs text-[#444653]">{a.keperluan}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded ${
                              a.status === 'Selesai'
                                ? 'bg-green-100 text-green-700'
                                : a.status === 'Diproses'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {a.status || 'Menunggu'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pengumuman Section */}
          <section id="pengumuman" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1a1c1c]">Papan Informasi Pengumuman</h2>
              <p className="text-sm text-[#444653]">Informasi dan berita terbaru lingkungan.</p>
            </div>

            <div className="space-y-4">
              {pengumumanList.map((p: any, idx: number) => (
                <div key={p.id || idx} className="bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${p.penting ? 'bg-red-100 text-[#bb0013]' : 'bg-blue-100 text-[#00216e]'}`}>
                    {p.kategori || 'Pengumuman'}
                  </span>
                  <h4 className="font-bold text-[#1a1c1c] mt-2">{p.judul}</h4>
                  <p className="text-xs text-[#444653] mt-1">{p.isi}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-auto px-8 py-6 text-center border-t border-[#e2e2e2] bg-white text-xs text-[#444653]">
          © 2024 Portal RW 09 Kebon Bawang. Sistem Informasi Komunitas Modern.
        </footer>
      </main>

      {/* Modal Form Antrian untuk Guest/Warga */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-[#00216e]">Form Pendaftaran Antrian Pelayanan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuestSubmitAntrian} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444653] uppercase mb-1">
                  Nama Pemohon
                </label>
                <input
                  type="text"
                  required
                  value={formData.namaPemohon}
                  onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value })}
                  placeholder="Masukkan nama Anda"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#00216e] outline-none"
                />
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
                  className="px-4 py-2 bg-[#00216e] text-white rounded-lg text-sm font-semibold hover:bg-[#0033a0] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  Daftar Antrian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

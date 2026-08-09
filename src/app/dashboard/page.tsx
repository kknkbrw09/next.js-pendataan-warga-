'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';

export default function DashboardPage() {
  const [growthPeriod, setGrowthPeriod] = useState<'bulanan' | 'kuartal'>('bulanan');

  const chartLabels =
    growthPeriod === 'bulanan'
      ? ['2020', '2021', '2022', '2023', '2024']
      : ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Q1 2025'];

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Dashboard" />

        <div className="flex-1 p-8 overflow-y-auto space-y-8">
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Total Warga */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#00216e] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#00216e]/10 text-[#00216e]">
                  <span className="material-symbols-outlined font-bold">group</span>
                </div>
                <span className="text-xs font-semibold text-[#444653] bg-green-50 text-green-700 px-2 py-1 rounded-full">
                  +12 bulan ini
                </span>
              </div>
              <p className="text-sm text-[#444653] font-semibold mb-1">Total Warga</p>
              <h3 className="text-3xl font-bold text-[#00216e]">1,240</h3>
            </div>

            {/* Card 2: Pendapatan Bulanan */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#bb0013] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#bb0013]/10 text-[#bb0013]">
                  <span className="material-symbols-outlined font-bold">account_balance_wallet</span>
                </div>
                <span className="text-xs font-semibold text-[#444653] bg-red-50 text-[#bb0013] px-2 py-1 rounded-full">
                  Oktober
                </span>
              </div>
              <p className="text-sm text-[#444653] font-semibold mb-1">Pendapatan Bulanan</p>
              <h3 className="text-3xl font-bold text-[#bb0013]">Rp 15.5M</h3>
            </div>

            {/* Card 3: Total Kegiatan */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-gray-100 text-[#444653]">
                  <span className="material-symbols-outlined font-bold">event_available</span>
                </div>
                <span className="text-xs font-bold text-[#00216e]">Mendatang: 2</span>
              </div>
              <p className="text-sm text-[#444653] font-semibold mb-1">Total Kegiatan</p>
              <h3 className="text-3xl font-bold text-[#1a1c1c]">8</h3>
            </div>

            {/* Card 4: Persentase Iuran */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] border-t-4 border-t-[#00216e] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-[#00216e]/10 text-[#00216e]">
                  <span className="material-symbols-outlined font-bold">payments</span>
                </div>
                <div className="flex items-center text-[#bb0013] font-bold text-xs bg-red-50 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm mr-1">trending_up</span>
                  5%
                </div>
              </div>
              <p className="text-sm text-[#444653] font-semibold mb-1">Persentase Iuran</p>
              <h3 className="text-3xl font-bold text-[#00216e]">85%</h3>
            </div>
          </div>

          {/* Charts Grid (2x2) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Chart 1: Income vs Expenses */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-[#1a1c1c]">Keuangan: Pendapatan vs Pengeluaran</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#00216e]"></span>
                    <span className="text-xs text-[#444653]">Pendapatan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#bb0013]"></span>
                    <span className="text-xs text-[#444653]">Pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="h-60 flex items-end justify-around gap-2 px-4 pt-4 border-b border-gray-100">
                {[
                  { month: 'Jan', inc: 70, exp: 45 },
                  { month: 'Feb', inc: 85, exp: 30 },
                  { month: 'Mar', inc: 60, exp: 55 },
                  { month: 'Apr', inc: 90, exp: 40 },
                  { month: 'Mei', inc: 75, exp: 50 },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end">
                    <div className="flex gap-1.5 items-end w-full max-w-[50px] h-full">
                      <div
                        className="bg-[#00216e] w-1/2 rounded-t-sm transition-all hover:bg-[#0033a0]"
                        style={{ height: `${item.inc}%` }}
                        title={`Pendapatan: ${item.inc}%`}
                      ></div>
                      <div
                        className="bg-[#bb0013] w-1/2 rounded-t-sm transition-all hover:bg-red-700"
                        style={{ height: `${item.exp}%` }}
                        title={`Pengeluaran: ${item.exp}%`}
                      ></div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-[#444653] uppercase">{item.month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Resident Growth */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-[#1a1c1c]">Pertumbuhan Penduduk</h4>
                <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setGrowthPeriod('bulanan')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      growthPeriod === 'bulanan'
                        ? 'bg-[#00216e] text-white shadow-sm'
                        : 'text-[#444653] hover:bg-gray-200'
                    }`}
                  >
                    Bulanan
                  </button>
                  <button
                    onClick={() => setGrowthPeriod('kuartal')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                      growthPeriod === 'kuartal'
                        ? 'bg-[#00216e] text-white shadow-sm'
                        : 'text-[#444653] hover:bg-gray-200'
                    }`}
                  >
                    Kuartal
                  </button>
                </div>
              </div>

              <div className="h-60 relative px-2 flex flex-col justify-between">
                <svg className="w-full h-44" preserveAspectRatio="none" viewBox="0 0 400 160">
                  <path
                    d={
                      growthPeriod === 'bulanan'
                        ? 'M0,140 Q50,130 100,100 T200,80 T300,40 T400,15'
                        : 'M0,150 Q100,110 200,75 T300,45 T400,10'
                    }
                    fill="none"
                    stroke="#00216e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="0" cy={growthPeriod === 'bulanan' ? 140 : 150} r="5" fill="#00216e" />
                  <circle cx="100" cy={growthPeriod === 'bulanan' ? 100 : 110} r="5" fill="#00216e" />
                  <circle cx="200" cy={growthPeriod === 'bulanan' ? 80 : 75} r="5" fill="#00216e" />
                  <circle cx="300" cy={growthPeriod === 'bulanan' ? 40 : 45} r="5" fill="#00216e" />
                  <circle cx="400" cy={growthPeriod === 'bulanan' ? 15 : 10} r="5" fill="#00216e" />
                </svg>
                <div className="flex justify-between text-xs text-[#444653] font-semibold border-t border-gray-100 pt-2">
                  {chartLabels.map((lbl, idx) => (
                    <span key={idx} className={growthPeriod === 'kuartal' ? 'text-[#00216e] font-bold' : ''}>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 3: Monthly Activities */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-[#1a1c1c]">Intensitas Kegiatan</h4>
                <span className="px-3 py-1 rounded-full bg-red-50 text-[#bb0013] text-xs font-bold border border-red-100">
                  Tahun 2024
                </span>
              </div>

              <div className="h-60 flex items-end justify-between px-2 gap-2 border-b border-gray-100">
                {[
                  { month: 'JAN', count: 3, h: '40%' },
                  { month: 'FEB', count: 5, h: '60%' },
                  { month: 'MAR', count: 2, h: '30%' },
                  { month: 'APR', count: 7, h: '80%' },
                  { month: 'MEI', count: 8, h: '90%', active: true },
                  { month: 'JUN', count: 4, h: '50%' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm relative group cursor-pointer transition-all ${
                        item.active ? 'bg-[#bb0013]' : 'bg-[#bb0013]/30 hover:bg-[#bb0013]'
                      }`}
                      style={{ height: item.h }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10">
                        {item.count} Kegiatan
                      </div>
                    </div>
                    <span
                      className={`mt-3 text-xs uppercase font-semibold ${
                        item.active ? 'text-[#bb0013] font-bold' : 'text-[#444653]'
                      }`}
                    >
                      {item.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Dues Payment Status */}
            <div className="bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-[#1a1c1c]">Status Pembayaran Iuran</h4>
                <Link href="/iuran" className="text-[#00216e] font-bold text-xs hover:underline">
                  Detail Iuran →
                </Link>
              </div>

              <div className="h-60 flex items-center justify-center gap-8">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e2e2e2" strokeWidth="12" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#00216e"
                      strokeWidth="12"
                      strokeDasharray="213.6 251.2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#bb0013"
                      strokeWidth="12"
                      strokeDasharray="37.7 251.2"
                      strokeDashoffset="-213.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#1a1c1c]">85%</span>
                    <span className="text-[10px] text-[#444653] font-bold tracking-widest uppercase">
                      Lunas
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#00216e]"></span>
                    <div>
                      <p className="text-xs font-bold text-[#1a1c1c]">1.054 Warga</p>
                      <p className="text-[10px] text-[#444653] uppercase font-semibold">Sudah Bayar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-[#bb0013]"></span>
                    <div>
                      <p className="text-xs font-bold text-[#1a1c1c]">186 Warga</p>
                      <p className="text-[10px] text-[#444653] uppercase font-semibold">Belum Bayar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#e2e2e2] shadow-sm">
              <h4 className="font-semibold text-[#1a1c1c] mb-4">Aktivitas Terkini</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#00216e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#1a1c1c]">
                      Warga baru ditambahkan: <strong>Keluarga Bpk. Sastro</strong>
                    </p>
                    <p className="text-xs text-[#444653] mt-0.5">Hari ini, 10:24 WIB • Admin</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-[#bb0013] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#1a1c1c]">
                      Penerimaan Iuran Sampah & Keamanan dari <strong>Blok C-12</strong>
                    </p>
                    <p className="text-xs text-[#444653] mt-0.5">Kemarin, 16:45 WIB • Bendahara</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#012366] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">edit_document</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#1a1c1c]">
                      Surat Pengantar Domisili diterbitkan: <strong>Ananda Putri</strong>
                    </p>
                    <p className="text-xs text-[#444653] mt-0.5">12 Mei 2024, 09:12 WIB • Sekretaris</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="bg-[#00216e] text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-md">
              <div>
                <span className="material-symbols-outlined text-5xl opacity-40 mb-4 block">
                  campaign
                </span>
                <h4 className="text-xl font-bold mb-3">Pengumuman Penting</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Kerja bakti massal akan dilaksanakan pada hari Minggu depan, 26 Mei 2024 pukul 07:00 WIB di seluruh wilayah RW 09 Kebon Bawang.
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="/pengumuman"
                  className="w-full bg-white text-[#00216e] font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm text-center block shadow-sm"
                >
                  Lihat Semua Info
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { INITIAL_IURAN, Iuran } from '@/lib/store';

export default function IuranPage() {
  const [iuranList, setIuranList] = useState<Iuran[]>(INITIAL_IURAN);

  const toggleStatus = (id: string) => {
    setIuranList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Lunas' ? 'Belum' : 'Lunas' }
          : item
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar />

      <main className="ml-[280px] w-[calc(100%-280px)] min-h-screen flex flex-col">
        <Header title="Status Iuran Warga" />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold text-[#00216e]">Monitoring Iuran Bulanan</h2>
            <p className="text-sm text-[#444653] mt-1">
              Status pembayaran iuran kebersihan & keamanan per warga per blok.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="relative w-44 h-44 mb-4">
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
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[#00216e]">85%</span>
                  <span className="text-[10px] text-[#444653] font-bold tracking-widest uppercase">
                    Capaian Target
                  </span>
                </div>
              </div>
              <h4 className="font-bold text-[#1a1c1c]">Oktober 2024</h4>
              <p className="text-xs text-[#444653] mt-1">
                1.054 dari 1.240 warga telah melunasi iuran.
              </p>
            </div>

            <div className="lg:col-span-2 bg-white border border-[#e2e2e2] rounded-xl p-6 shadow-sm overflow-x-auto">
              <h4 className="font-bold text-[#1a1c1c] mb-4">Status Pembayaran Warga</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-[#444653] text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Blok / Warga</th>
                    <th className="px-4 py-3">Bulan</th>
                    <th className="px-4 py-3">Nominal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {iuranList.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#1a1c1c]">{item.namaWarga}</p>
                        <p className="text-xs text-[#444653]">{item.blok}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#444653]">
                        {item.bulan} {item.tahun}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#00216e]">
                        Rp {item.jumlah.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            item.status === 'Lunas'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-[#bb0013]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleStatus(item.id)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-[#00216e] text-xs font-bold rounded-lg transition-all"
                        >
                          Ubah Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

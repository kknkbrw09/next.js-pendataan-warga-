'use client';

import { useState } from 'react';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
}

export default function Header({ title, onSearch }: HeaderProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="h-16 flex justify-between items-center px-6 bg-white border-b border-[#e2e2e2] shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold text-[#00216e]">{title}</h2>
        <div className="relative ml-6 hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747684]">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Cari NIK, nama, atau data..."
            className="pl-10 pr-4 py-1.5 bg-[#f3f3f4] border border-[#c4c5d5] rounded-full text-sm focus:outline-none focus:border-[#00216e] w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f3f3f4] transition-colors text-[#444653] relative overflow-hidden shrink-0">
          <span className="material-symbols-outlined w-6 h-6 overflow-hidden shrink-0 flex items-center justify-center">notifications</span>
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#bb0013] rounded-full"></span>
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f3f3f4] transition-colors text-[#444653] overflow-hidden shrink-0">
          <span className="material-symbols-outlined w-6 h-6 overflow-hidden shrink-0 flex items-center justify-center">settings</span>
        </button>

        <div className="h-8 w-px bg-[#c4c5d5] mx-1"></div>

        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-[#1a1c1c] leading-none">
              Bpk. Ketua RW
            </p>
            <p className="text-[11px] text-[#444653] uppercase tracking-wider font-bold mt-1">
              Administrator
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#00216e]/20 bg-[#00216e] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            RW
          </div>
        </div>
      </div>
    </header>
  );
}

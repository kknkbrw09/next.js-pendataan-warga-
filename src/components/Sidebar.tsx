'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Route Guard: Check 'admin' role in localStorage on client mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('rw_role');
      if (role !== 'admin') {
        router.replace('/');
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rw_role');
      localStorage.removeItem('admin_name');
    }
    router.replace('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/warga', label: 'Data Warga', icon: 'group' },
    { href: '/keuangan', label: 'Keuangan', icon: 'account_balance_wallet' },
    { href: '/kegiatan', label: 'Kegiatan', icon: 'event_available' },
    { href: '/iuran', label: 'Iuran', icon: 'payments' },
    { href: '/surat', label: 'Surat Pengantar', icon: 'description' },
    { href: '/pengumuman', label: 'Pengumuman', icon: 'campaign' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-[#00216e] flex flex-col py-4 z-50 shadow-md">
      {/* Brand Header */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
          <span className="material-symbols-outlined text-[#00216e] font-bold text-2xl">
            home_work
          </span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-none">RW 09</h1>
          <p className="text-xs text-white/70 mt-1 font-medium">Kebon Bawang (Admin)</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 space-y-1 custom-scrollbar overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? 'text-white border-l-4 border-[#bb0013] bg-[#0033a0]/30 shadow-sm'
                  : 'text-white/80 hover:bg-[#0033a0]/20 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto px-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-[#bb0013]/20 hover:text-red-300 transition-all font-semibold text-sm"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

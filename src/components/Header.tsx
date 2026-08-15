'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { INITIAL_SURAT, SuratPengantar } from '@/lib/store';

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
}

export default function Header({ title, onSearch }: HeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<SuratPengantar[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  useEffect(() => {
    async function fetchSuratNotifs() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('surat_pengantar')
            .select('*')
            .neq('status', 'Selesai')
            .neq('status', 'Dibatalkan')
            .order('created_at', { ascending: false })
            .limit(5);

          if (data && !error) {
            const mapped: SuratPengantar[] = data.map((d: any) => ({
              id: d.id,
              noAntrian: d.no_antrian || 'A-001',
              namaPemohon: d.nama_pemohon,
              rt: d.rt || 'RT 001',
              keperluan: d.keperluan,
              tanggal: d.tanggal,
              status: d.status || 'Menunggu',
            }));
            setNotifications(mapped);
            return;
          }
        } catch (err) {
          console.log('Error fetching antrian notifications', err);
        }
      }
      setNotifications(INITIAL_SURAT.filter((item) => item.status !== 'Selesai' && item.status !== 'Dibatalkan'));
    }

    fetchSuratNotifs();

    if (typeof window !== 'undefined') {
      window.addEventListener('antrian_updated', fetchSuratNotifs);
      return () => window.removeEventListener('antrian_updated', fetchSuratNotifs);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            placeholder="Cari nama atau data..."
            className="pl-10 pr-4 py-1.5 bg-[#f3f3f4] border border-[#c4c5d5] rounded-full text-sm focus:outline-none focus:border-[#00216e] w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#f3f3f4] transition-colors text-[#444653] relative shrink-0"
            title="Notifikasi Antrian Pelayanan"
          >
            <span className="material-symbols-outlined text-2xl">notifications</span>
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-[#bb0013] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e2e2e2] py-3 z-50 animate-in fade-in-50 duration-150">
              <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00216e]">confirmation_number</span>
                  <h3 className="font-bold text-sm text-[#00216e]">Antrian Pelayanan Warga</h3>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  {notifications.length} Antrian
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs font-medium">
                    Belum ada antrian pelayanan.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIsNotifOpen(false);
                        router.push('/surat');
                      }}
                      className="p-3.5 hover:bg-blue-50/50 transition-colors cursor-pointer flex gap-3 items-start"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#00216e] flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        {item.noAntrian}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-[#1a1c1c] truncate">{item.namaPemohon}</p>
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">{item.tanggal}</span>
                        </div>
                        <p className="text-[11px] text-[#444653] truncate mt-0.5">{item.keperluan}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-[#00216e]">
                          {item.status} ({item.rt})
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    setIsNotifOpen(false);
                    router.push('/surat');
                  }}
                  className="w-full py-2 bg-[#00216e] hover:bg-[#0033a0] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Buka Papan Antrian</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>

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

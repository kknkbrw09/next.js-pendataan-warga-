'use client';

import { useEffect, useState } from 'react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('rw_role');
      if (role !== 'admin') {
        setAuthorized(false);
        window.location.href = '/';
      } else {
        setAuthorized(true);
      }
    }
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#00216e] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide">Memeriksa Hak Akses Admin...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

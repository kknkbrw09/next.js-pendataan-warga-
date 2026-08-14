'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { hashSensitiveData } from '@/lib/security';
import { getAppConfig } from '@/lib/configStore';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('rw_role');
      if (role === 'admin') {
        window.location.href = '/dashboard';
      } else if (role === 'guest') {
        window.location.href = '/guest';
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // 1. Generate SHA-256 hash of the input password
      const hashedPassword = await hashSensitiveData(cleanPassword);

      // 2. Try Supabase admin_users authentication using hashed password
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error: sbError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('username', cleanUsername)
            .eq('password', hashedPassword)
            .single();

          if (data && !sbError) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('rw_role', 'admin');
              localStorage.setItem('admin_name', data.nama_admin || username);
              window.location.href = '/dashboard';
            }
            return;
          }
        } catch (err) {
          console.log('Supabase auth check fallback', err);
        }
      }

      // 3. Fallback / AppConfig check for admin credentials
      const config = getAppConfig();
      const configuredUser = (config.adminUsername || 'admin').trim().toLowerCase();
      const configuredPass = (config.adminPassword || 'admin').trim();

      const isValidAdmin =
        (cleanUsername === configuredUser && cleanPassword === configuredPass) ||
        (cleanUsername === 'admin' &&
          (cleanPassword === 'Sayapakmimbar123#' ||
            cleanPassword === 'admin123' ||
            cleanPassword === 'admin'));

      if (isValidAdmin) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rw_role', 'admin');
          localStorage.setItem('admin_name', 'Pengurus RW 09');
          window.location.href = '/dashboard';
        }
      } else {
        setError('Username atau password salah. Silakan periksa kembali kombinasi username & password Anda.');
      }
    } catch {
      const config = getAppConfig();
      const configuredUser = (config.adminUsername || 'admin').trim().toLowerCase();
      const configuredPass = (config.adminPassword || 'admin').trim();

      const isValidAdmin =
        (cleanUsername === configuredUser && cleanPassword === configuredPass) ||
        (cleanUsername === 'admin' &&
          (cleanPassword === 'Sayapakmimbar123#' ||
            cleanPassword === 'admin123' ||
            cleanPassword === 'admin'));

      if (isValidAdmin) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rw_role', 'admin');
          localStorage.setItem('admin_name', 'Pengurus RW 09');
          window.location.href = '/dashboard';
        }
      } else {
        setError('Gagal melakukan autentikasi. Silakan periksa kembali kombinasi username & password Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('rw_role', 'guest');
      window.location.href = '/guest';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00216e] via-[#012366] to-[#bb0013] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0033a0]/40 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#bb0013]/30 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#00216e] text-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
            <span className="material-symbols-outlined text-4xl">home_work</span>
          </div>
          <h1 className="text-2xl font-bold text-[#00216e]">Portal RW 09</h1>
          <p className="text-sm font-semibold text-[#bb0013] tracking-wide mt-0.5">
            Kebon Bawang, Jakarta Utara
          </p>
          <p className="text-xs text-[#747684] mt-2">
            Silakan masuk untuk mengakses sistem informasi warga
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#bb0013] rounded-lg text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form Admin Login */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                person
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username admin"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#444653] mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password admin"
                className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00216e] focus:bg-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00216e] transition-colors focus:outline-none p-1"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00216e] hover:bg-[#0033a0] text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">
              {loading ? 'sync' : 'admin_panel_settings'}
            </span>
            {loading ? 'Memverifikasi...' : 'Masuk sebagai Admin'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <span className="relative px-3 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">
            atau
          </span>
        </div>

        {/* Guest Entry Button */}
        <button
          onClick={handleGuestLogin}
          type="button"
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-[#00216e] border border-gray-300 font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined text-lg">visibility</span>
          Masuk sebagai Tamu (Guest View)
        </button>


      </div>
    </div>
  );
}

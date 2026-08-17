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

  // Auto redirect if already logged in or checking Google OAuth callback session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('rw_role');
      if (role === 'admin') {
        window.location.href = '/dashboard';
        return;
      }
    }

    async function checkGoogleAuthSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            const userEmail = (data.session.user.email || '').toLowerCase();
            const allowedAdminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase();

            // Strict 1-email restriction check
            if (allowedAdminEmail && userEmail !== allowedAdminEmail) {
              await supabase.auth.signOut();
              setError(`Akses ditolak: Akun Google (${userEmail}) bukan email admin terdaftar!`);
              return;
            }

            // Valid Admin Google Login
            localStorage.setItem('rw_role', 'admin');
            localStorage.setItem('admin_name', data.session.user.user_metadata?.full_name || userEmail || 'Admin Google');
            window.location.href = '/dashboard';
          }
        } catch (err) {
          console.log('Google Auth session check error', err);
        }
      }
    }

    checkGoogleAuthSession();
  }, []);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      alert('Supabase belum terkonfigurasi. Pastikan NEXT_PUBLIC_SUPABASE_URL dan KEY diisi di .env.local');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { error: authErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (authErr) {
        setError(authErr.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses login Google');
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00216e] via-[#012366] to-[#bb0013] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0033a0]/40 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#bb0013]/30 rounded-full blur-3xl"></div>

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-md p-2 border border-gray-100">
            <img src="/favicon.ico" alt="Logo RW 09" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-[#00216e]">Portal Admin RW 09</h1>
          <p className="text-sm font-semibold text-[#bb0013] tracking-wide mt-0.5">
            Kebon Bawang, Jakarta Utara
          </p>
          <p className="text-xs text-[#747684] mt-2">
            Masuk dengan Google Auth atau akun Admin resmi
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#bb0013] rounded-xl text-xs font-semibold text-center animate-in fade-in duration-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* 1. Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 font-bold border border-gray-300 rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <span className="relative px-3 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">
              atau Login Kredensial
            </span>
          </div>

          {/* 2. Form Admin Login (Username & Password) */}
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
        </div>
      </div>
    </div>
  );
}

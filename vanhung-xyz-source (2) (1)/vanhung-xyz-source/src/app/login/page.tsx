'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng nhập thất bại.');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Không thể kết nối máy chủ.');
      setLoading(false);
    }
  };

  return (
    <div className="cyber-bg min-h-screen flex items-center justify-center p-4">
      <div className="glass-panel max-w-md w-full rounded-2xl p-8 border border-slate-800 space-y-6">
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-block font-extrabold text-2xl tracking-tight">
            VANHUNG<span className="text-emerald-400">.XYZ</span>
          </Link>
          <p className="text-xs text-slate-400">Đăng nhập hệ thống tài nguyên MMO &amp; AI tự động</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Tên đăng nhập hoặc Email</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin_vanhung hoặc email@..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60 text-slate-950 font-extrabold text-sm transition"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-emerald-400 font-semibold hover:underline">
            Tạo tài khoản miễn phí
          </Link>
        </div>
      </div>
    </div>
  );
}

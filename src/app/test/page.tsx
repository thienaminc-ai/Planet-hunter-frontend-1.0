// src/app/test/page.tsx - Trang 3: Kiểm thử Mô hình (gọi API /test)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TestPage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const t = {
    title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
    description: language === 'vi' ? 'Kiểm tra mô hình đã huấn luyện qua API backend.' : 'Test the trained model via backend API.',
    button: language === 'vi' ? 'Kiểm thử' : 'Test',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang kiểm thử...' : 'Testing...',
    error: (msg: string) => language === 'vi' ? `Lỗi: ${msg}` : `Error: ${msg}`,
    result: language === 'vi' ? 'Kết quả kiểm thử:' : 'Test result:'
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API Flask backend (giả sử http://localhost:5000/test)
      const response = await fetch('http://localhost:5000/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_exoplanet_model' }) // Payload mẫu
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(t.error((err as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col">
      <header className="flex justify-between items-center p-4 sm:p-6 bg-black/20 backdrop-blur-sm border-b border-indigo-500/30">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🪐</span>
          <h2 className="text-xl font-bold">Exoplanet Hunter</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">
            {t.back}
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-gray-300">
            {t.description}
          </p>
        </div>

        <div className="w-full max-w-md">
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? t.loading : t.button}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-red-300">
              {error}
            </div>
          )}

          {data && (
            <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-md">
              <h3 className="font-semibold mb-2">{t.result}</h3>
              <pre className="text-sm text-purple-300 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-black/30 border-t border-indigo-500/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          © 2025 Exoplanet Hunter. Powered by Flask Backend.
        </div>
      </footer>
    </div>
  );
}
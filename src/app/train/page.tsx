// src/app/train/page.tsx - Trang 2: Huấn luyện Mô hình (gọi API /train)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrainPage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const t = {
    title: language === 'vi' ? 'Huấn luyện Mô hình' : 'Model Training',
    description: language === 'vi' ? 'Huấn luyện mô hình từ dữ liệu đã xử lý qua API backend.' : 'Train model from processed data via backend API.',
    button: language === 'vi' ? 'Bắt đầu Huấn luyện' : 'Start Training',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang huấn luyện...' : 'Training...',
    error: (msg: string) => language === 'vi' ? `Lỗi: ${msg}` : `Error: ${msg}`,
    result: language === 'vi' ? 'Kết quả huấn luyện:' : 'Training result:'
  };

  const handleTrain = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API Flask backend (giả sử http://localhost:5000/train)
      const response = await fetch('http://localhost:5000/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'train_exoplanet_model' }) // Payload mẫu
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
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-gray-300">
            {t.description}
          </p>
        </div>

        <div className="w-full max-w-md">
          <button
            onClick={handleTrain}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? t.loading : t.button}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-red-300">
              {error}
            </div>
          )}

          {data && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-md">
              <h3 className="font-semibold mb-2">{t.result}</h3>
              <pre className="text-sm text-green-300 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
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
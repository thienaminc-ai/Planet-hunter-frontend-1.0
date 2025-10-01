// src/app/page.tsx - Trang chính (cập nhật để dùng Link cho navigation)
'use client';

import { useState } from 'react';
import Image from "next/image";
import Link from 'next/link';

export default function Home() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi'); // Default tiếng Việt

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'vi' ? 'en' : 'vi');
  };

  const t = {
    title: language === 'vi' ? 'Chương trình Machine Learning Exoplanet Hunter' : 'Machine Learning Exoplanet Hunter Program',
    description: language === 'vi' ? 'Khám phá và săn tìm các hành tinh ngoài hệ mặt trời sử dụng trí tuệ nhân tạo.' : 'Discover and hunt for exoplanets using artificial intelligence.',
    option1: {
      title: language === 'vi' ? 'Tiền xử lý Dữ liệu' : 'Data Preprocessing',
      desc: language === 'vi' ? 'Làm sạch và chuẩn bị dữ liệu thiên văn cho việc huấn luyện mô hình.' : 'Clean and prepare astronomical data for model training.'
    },
    option2: {
      title: language === 'vi' ? 'Huấn luyện Mô hình' : 'Model Training',
      desc: language === 'vi' ? 'Huấn luyện mô hình ML để phát hiện hành tinh từ dữ liệu kính thiên văn.' : 'Train ML models to detect exoplanets from telescope data.'
    },
    option3: {
      title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
      desc: language === 'vi' ? 'Đánh giá hiệu suất mô hình trong việc dự đoán hành tinh mới.' : 'Evaluate model performance in predicting new exoplanets.'
    },
    button: language === 'vi' ? 'Chọn' : 'Select',
    toggle: language === 'vi' ? 'EN' : 'VI',
    footer: {
      copyright: language === 'vi' ? '© 2025 Exoplanet Hunter. Built with Next.js & Tailwind.' : '© 2025 Exoplanet Hunter. Built with Next.js & Tailwind.',
      learn: language === 'vi' ? 'Học hỏi' : 'Learn',
      examples: language === 'vi' ? 'Ví dụ' : 'Examples',
      nextjs: language === 'vi' ? 'Đến nextjs.org →' : 'Go to nextjs.org →'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center p-4 sm:p-6 bg-black/20 backdrop-blur-sm border-b border-indigo-500/30">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🪐</span>
          <h2 className="text-xl font-bold">Exoplanet Hunter</h2>
        </div>
        <button
          onClick={toggleLanguage}
          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          {t.toggle}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-gray-300 max-w-md">
            {t.description}
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl w-full">
          {/* Option 1: Data Preprocessing */}
          <Link href="/preprocess">
            <div className="bg-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">
                {t.option1.title}
              </h3>
              <p className="text-gray-300 text-center mb-4 flex-grow">
                {t.option1.desc}
              </p>
              <div className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full text-center">
                {t.button}
              </div>
            </div>
          </Link>

          {/* Option 2: Model Training */}
          <Link href="/train">
            <div className="bg-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">
                {t.option2.title}
              </h3>
              <p className="text-gray-300 text-center mb-4 flex-grow">
                {t.option2.desc}
              </p>
              <div className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors w-full text-center">
                {t.button}
              </div>
            </div>
          </Link>

          {/* Option 3: Model Testing */}
          <Link href="/test">
            <div className="bg-white/10 rounded-lg shadow-lg p-6 flex flex-col items-center backdrop-blur-sm border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                <span className="text-2xl">🔭</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">
                {t.option3.title}
              </h3>
              <p className="text-gray-300 text-center mb-4 flex-grow">
                {t.option3.desc}
              </p>
              <div className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors w-full text-center">
                {t.button}
              </div>
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-indigo-500/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-center sm:justify-between items-center space-y-4 sm:space-y-0 sm:space-x-8">
          <div className="text-sm text-gray-400 text-center sm:text-left">
            {t.footer.copyright}
          </div>
          <div className="flex space-x-6">
            <a
              href="https://nextjs.org/learn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} className="dark:invert" />
              <span>{t.footer.learn}</span>
            </a>
            <a
              href="https://vercel.com/templates?framework=next.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} className="dark:invert" />
              <span>{t.footer.examples}</span>
            </a>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} className="dark:invert" />
              <span>{t.footer.nextjs}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
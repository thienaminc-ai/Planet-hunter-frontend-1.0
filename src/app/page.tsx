'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number }>({ x: -100, y: 50 });
  const [blackHoleRotation, setBlackHoleRotation] = useState<number>(0);
  const [scrollY, setScrollY] = useState<number>(0);
  
  // NEW: Client-mount flag to safely apply dynamic styles after hydration
  const [isClient, setIsClient] = useState(false);
  
  // NEW: Stars data generated client-side only to avoid SSR mismatch
  const [stars, setStars] = useState<{ id: number; width: number; height: number; top: number; left: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // NEW: Set client flag after mount
    setIsClient(true);
    
    // NEW: Generate stars after mount (server & initial client render have empty array)
    const generatedStars = [...Array(150)].map((_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleScroll = (): void => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const moveRocket = setInterval(() => {
      setRocketPos(prev => {
        const newX = prev.x + 2;
        const newY = 50 + Math.sin(newX / 50) * 20;
        if (typeof window !== 'undefined') {
          return newX > window.innerWidth + 100 ? { x: -100, y: 50 } : { x: newX, y: newY };
        }
        return { x: newX, y: newY };
      });
    }, 50);
    return () => clearInterval(moveRocket);
  }, []);

  const toggleLanguage = (): void => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const handlePlanetClick = (route: string): void => {
    setBlackHoleRotation(prev => prev - 120);
    window.location.href = route;
  };

  const t = {
    title: language === 'vi' ? 'Seishinteki' : 'Seishinteki',
    subtitle: language === 'vi' ? '2025 NASA Space Apps Challenge' : '2025 NASA Space Apps Challenge',
    description: language === 'vi' ? 'Khám phá và phân tích các hành tinh ngoài hệ mặt trời với trí tuệ nhân tạo.' : 'Discover and analyze exoplanets using artificial intelligence.',
    option1: {
      title: language === 'vi' ? 'Tiền xử lý Dữ liệu' : 'Data Preprocessing',
      desc: language === 'vi' ? 'Làm sạch và chuẩn bị dữ liệu thiên văn' : 'Clean and prepare astronomical data'
    },
    option2: {
      title: language === 'vi' ? 'Huấn luyện Mô hình' : 'Model Training',
      desc: language === 'vi' ? 'Huấn luyện ML phát hiện hành tinh' : 'Train ML to detect exoplanets'
    },
    option3: {
      title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
      desc: language === 'vi' ? 'Đánh giá hiệu suất mô hình' : 'Evaluate model performance'
    },
    toggle: language === 'vi' ? 'EN' : 'VI',
    footer: {
      copyright: language === 'vi' ? '© 2025 Seishinteki - NASA Space Apps Challenge' : '© 2025 Seishinteki - NASA Space Apps Challenge'
    }
  };

  const blackHoleX = 70 - scrollY * 0.15;
  const blackHoleY = 25 + scrollY * 0.05;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden">
      {/* Animated starfield background - now client-only to fix hydration */}
      <div className="fixed inset-0 overflow-hidden">
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`
            }}
          />
        ))}
      </div>
      
      {/* 3D Black hole with nebula */}
      <div
        className="fixed w-[500px] h-[500px] pointer-events-none transition-all duration-700 ease-out z-5"
        style={{
          top: `${blackHoleY}%`,
          left: `${blackHoleX}%`,
          transform: `rotate(${blackHoleRotation}deg)`
        }}
      >
        {/* Outer nebula rings */}
        <div className="absolute -inset-32 rounded-full opacity-40 animate-pulse" style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(138, 43, 226, 0.3) 50%, rgba(255, 0, 128, 0.2) 70%, transparent 90%)',
          animationDuration: '5s',
          filter: 'blur(20px)'
        }} />
       
        <div className="absolute -inset-24 rounded-full opacity-50 animate-pulse" style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(75, 0, 130, 0.4) 60%, rgba(138, 43, 226, 0.3) 75%, transparent 90%)',
          animationDuration: '6s',
          animationDelay: '1s',
          filter: 'blur(15px)'
        }} />
        {/* 3D Sphere black hole core */}
        <div className="absolute inset-0 rounded-full" style={{
          background: 'radial-gradient(circle at 35% 35%, rgba(40, 40, 60, 0.8) 0%, rgba(10, 10, 20, 0.95) 40%, #000000 70%)',
          boxShadow: `
            inset -40px -40px 80px rgba(138, 43, 226, 0.4),
            inset 40px 40px 80px rgba(0, 0, 0, 0.9),
            0 0 150px 50px rgba(138, 43, 226, 0.6),
            0 0 250px 100px rgba(75, 0, 130, 0.4)
          `
        }}>
          {/* Event horizon with 3D effect */}
          <div className="absolute inset-8 rounded-full" style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(20, 0, 40, 0.5) 0%, #000000 60%)',
            border: '2px solid rgba(138, 43, 226, 0.3)',
            boxShadow: 'inset 0 0 50px rgba(138, 43, 226, 0.3)'
          }} />
         
          {/* Inner core darkness */}
          <div className="absolute inset-20 rounded-full bg-black" style={{
            boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 1), 0 0 40px rgba(138, 43, 226, 0.5)'
          }} />
        </div>
       
        {/* Rotating accretion disk */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '25s' }}>
          <div className="absolute inset-0 rounded-full opacity-80" style={{
            background: 'conic-gradient(from 0deg, transparent 10%, rgba(138, 43, 226, 0.5) 20%, rgba(255, 140, 0, 0.7) 30%, rgba(255, 0, 128, 0.6) 40%, transparent 50%)',
            filter: 'blur(12px)'
          }} />
        </div>
        {/* Secondary accretion disk */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '35s', animationDirection: 'reverse' }}>
          <div className="absolute inset-0 rounded-full opacity-60" style={{
            background: 'conic-gradient(from 180deg, transparent 20%, rgba(75, 0, 130, 0.4) 35%, rgba(138, 43, 226, 0.5) 45%, transparent 60%)',
            filter: 'blur(15px)'
          }} />
        </div>
        {/* Gravitational lensing rings with 3D depth */}
        <div className="absolute -inset-16 rounded-full border-2 opacity-30 animate-pulse" style={{
          borderColor: 'rgba(138, 43, 226, 0.4)',
          animationDuration: '3s',
          boxShadow: '0 0 30px rgba(138, 43, 226, 0.3)'
        }} />
        <div className="absolute -inset-28 rounded-full border opacity-20 animate-pulse" style={{
          borderColor: 'rgba(138, 43, 226, 0.3)',
          animationDuration: '4s',
          animationDelay: '1s',
          boxShadow: '0 0 40px rgba(138, 43, 226, 0.2)'
        }} />
        <div className="absolute -inset-40 rounded-full border opacity-10 animate-pulse" style={{
          borderColor: 'rgba(75, 0, 130, 0.2)',
          animationDuration: '5s',
          animationDelay: '2s'
        }} />
       
        {/* Space distortion effect - FIXED: Use isClient to match server initial render */}
        <div
          className="absolute -inset-48 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, transparent 50%, rgba(138, 43, 226, 0.1) 70%, transparent 90%)',
            transform: isClient 
              ? `translate(${(mousePos.x - window.innerWidth / 2) / 80}px, ${(mousePos.y - window.innerHeight / 2) / 80}px)` 
              : 'none',
            filter: 'blur(25px)'
          }}
        />
      </div>
      
      {/* Flying rocket */}
      <div
        className="fixed text-6xl transform -rotate-45 transition-all duration-100 pointer-events-none z-20"
        style={{
          left: `${rocketPos.x}px`,
          top: `${rocketPos.y}%`,
          filter: 'drop-shadow(0 0 20px rgba(255, 140, 0, 0.8))'
        }}
      >
        🚀
      </div>
      
      <header className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-lg border-b border-purple-500/30 relative z-10">
        <div className="flex items-center space-x-3">
          <span className="text-3xl animate-spin" style={{ animationDuration: '10s' }}>🌌</span>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Seishinteki
            </h2>
            <p className="text-xs text-purple-300/70">2025 NASA Space Apps Challenge</p>
          </div>
        </div>
        <button
          onClick={toggleLanguage}
          className="px-4 py-2 bg-purple-600/80 text-white rounded-lg hover:bg-purple-700 transition-all hover:scale-105 text-sm font-medium shadow-lg border border-purple-400/50"
        >
          {t.toggle}
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 max-w-3xl">
          <p className="text-sm text-purple-300/80 mb-2 tracking-wider uppercase">
            {t.subtitle}
          </p>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
            {t.title}
          </h1>
          <p className="text-xl text-purple-200">
            {t.description}
          </p>
        </div>
        <div className="relative w-full max-w-7xl h-[900px]">
          {/* Sun-like planet (Orange) - Largest, Top Right */}
          <div
            className="absolute top-12 right-32 w-96 h-96 cursor-pointer group"
            onClick={() => handlePlanetClick('/train')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-red-600 blur-3xl opacity-70 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full w-full h-full flex flex-col items-center justify-center border-4 border-orange-600 shadow-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"
              style={{
                boxShadow: 'inset -30px -30px 80px rgba(0,0,0,0.4), inset 30px 30px 80px rgba(255,255,255,0.3), 0 0 120px rgba(255, 140, 0, 0.9), 0 0 200px rgba(255, 100, 0, 0.5)'
              }}>
              {/* Enhanced Solar flares with depth */}
              <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-yellow-400/40 shadow-inner blur-md animate-pulse" style={{ animationDuration: '3s' }} />
              <div className="absolute bottom-10 left-12 w-16 h-16 rounded-full bg-orange-600/50 shadow-inner blur-sm animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-28 left-20 w-14 h-14 rounded-full bg-red-500/40 shadow-inner blur-sm" />
              <div className="absolute top-40 right-24 w-12 h-12 rounded-full bg-yellow-300/50 shadow-inner blur-md animate-pulse" style={{ animationDuration: '2.5s' }} />
              <div className="absolute bottom-32 right-32 w-10 h-10 rounded-full bg-orange-500/35 shadow-inner" />
             
              {/* Highlight sphere effect */}
              <div className="absolute top-12 left-16 w-32 h-32 rounded-full bg-yellow-200/20 blur-2xl" />
             
              <div className="relative z-10 text-center px-8 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-7xl mb-5 block filter drop-shadow-2xl animate-pulse" style={{ animationDuration: '3s' }}>🤖</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 drop-shadow-lg">
                  {t.option2.title}
                </h3>
                <p className="text-base text-gray-800 drop-shadow-md">
                  {t.option2.desc}
                </p>
              </div>
            </div>
          </div>
          {/* Moon-like planet (Gray) - Smallest, Bottom Left */}
          <div
            className="absolute bottom-20 left-24 w-52 h-52 cursor-pointer group"
            onClick={() => handlePlanetClick('/preprocess')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-400 to-gray-800 blur-2xl opacity-50 group-hover:opacity-80 transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-gray-100 via-gray-400 to-gray-700 rounded-full w-full h-full flex flex-col items-center justify-center border-4 border-gray-600 shadow-2xl transform group-hover:scale-115 group-hover:-rotate-12 transition-all duration-500"
              style={{
                boxShadow: 'inset -25px -25px 60px rgba(0,0,0,0.6), inset 25px 25px 60px rgba(255,255,255,0.15), 0 0 70px rgba(150, 150, 150, 0.5)'
              }}>
              {/* Enhanced Moon craters with varied sizes */}
              <div className="absolute top-6 right-12 w-16 h-16 rounded-full bg-gray-800/60 shadow-inner border border-gray-700/30" />
              <div className="absolute bottom-16 left-10 w-12 h-12 rounded-full bg-gray-800/50 shadow-inner border border-gray-700/20" />
              <div className="absolute top-20 left-14 w-10 h-10 rounded-full bg-gray-800/45 shadow-inner" />
              <div className="absolute bottom-28 right-18 w-8 h-8 rounded-full bg-gray-800/40 shadow-inner" />
              <div className="absolute top-32 right-20 w-6 h-6 rounded-full bg-gray-800/35 shadow-inner" />
              <div className="absolute bottom-36 left-24 w-5 h-5 rounded-full bg-gray-800/30 shadow-inner" />
             
              {/* Highlight */}
              <div className="absolute top-8 left-10 w-20 h-20 rounded-full bg-white/10 blur-xl" />
             
              <div className="relative z-10 text-center px-6 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl mb-4 block filter drop-shadow-2xl">📊</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 drop-shadow-md">
                  {t.option1.title}
                </h3>
                <p className="text-sm text-gray-800 drop-shadow-sm">
                  {t.option1.desc}
                </p>
              </div>
            </div>
          </div>
          {/* Ocean planet (Blue) - Medium, Top Center-Left */}
          <div
            className="absolute top-32 left-1/4 -translate-x-1/2 w-80 h-80 cursor-pointer group"
            onClick={() => handlePlanetClick('/test')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-blue-800 blur-3xl opacity-65 group-hover:opacity-95 transition-all duration-500" />
            <div className="relative bg-gradient-to-br from-cyan-200 via-blue-400 to-blue-800 rounded-full w-full h-full flex flex-col items-center justify-center border-4 border-blue-700 shadow-2xl transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
              style={{
                boxShadow: 'inset -28px -28px 70px rgba(0,0,0,0.5), inset 28px 28px 70px rgba(255,255,255,0.25), 0 0 100px rgba(0, 150, 255, 0.7), 0 0 150px rgba(0, 100, 200, 0.4)'
              }}>
              {/* Enhanced Ocean patterns with swirls */}
              <div className="absolute top-10 right-14 w-24 h-20 rounded-full bg-blue-700/40 shadow-inner blur-md" />
              <div className="absolute bottom-16 left-16 w-22 h-18 rounded-full bg-cyan-300/50 shadow-inner blur-sm animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute top-24 left-20 w-18 h-16 rounded-full bg-blue-800/45 shadow-inner blur-sm" />
              <div className="absolute bottom-32 right-24 w-14 h-12 rounded-full bg-cyan-400/40 shadow-inner blur-md" />
              <div className="absolute top-36 right-32 w-10 h-8 rounded-full bg-blue-600/35 shadow-inner" />
             
              {/* Water shimmer effect */}
              <div className="absolute top-16 left-12 w-28 h-28 rounded-full bg-cyan-300/20 blur-2xl animate-pulse" style={{ animationDuration: '5s' }} />
             
              {/* Cloud-like formations */}
              <div className="absolute top-32 right-20 w-16 h-12 rounded-full bg-white/20 blur-lg" />
              <div className="absolute bottom-40 left-28 w-20 h-14 rounded-full bg-white/15 blur-lg" />
             
              <div className="relative z-10 text-center px-7 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-7xl mb-5 block filter drop-shadow-2xl">🔭</span>
                <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                  {t.option3.title}
                </h3>
                <p className="text-base text-blue-50 drop-shadow-md">
                  {t.option3.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-lg border-t border-purple-500/30 py-6 relative z-10 mt-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-sm text-purple-200/70">
            {t.footer.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
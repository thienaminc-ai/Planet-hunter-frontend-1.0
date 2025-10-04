'use client';
import { useState, useEffect } from 'react';
import BlackHoleScene from './components/BlackHoleScene';

export default function Home() {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number }>({ x: -100, y: 50 });
  const [stars, setStars] = useState<{ id: number; width: number; height: number; top: number; left: number; delay: number; duration: number }[]>([]);
  const [moonRotation, setMoonRotation] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
    const rotateMoons = setInterval(() => {
      setMoonRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(rotateMoons);
  }, []);

  const toggleLanguage = (): void => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const handlePlanetClick = (route: string): void => {
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
    option4: {
      title: language === 'vi' ? 'Bách khoa Dữ liệu' : 'Data Dictionary',
      desc: language === 'vi' ? 'Tìm hiểu về dữ liệu ngoại hành tinh' : 'Learn about exoplanet data'
    },
    toggle: language === 'vi' ? 'EN' : 'VI',
    footer: {
      copyright: language === 'vi' ? '© 2025 Seishinteki - NASA Space Apps Challenge' : '© 2025 Seishinteki - NASA Space Apps Challenge'
    }
  };

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden z-5">
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
      
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <BlackHoleScene width={windowWidth} height={windowHeight} />
      </div>
      
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
          {/* Sun-like planet (Orange) - Largest, Top Right with 2 moons */}
          <div
            className="absolute top-12 right-32 w-96 h-96 cursor-pointer group"
            onClick={() => handlePlanetClick('/train')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-red-600 blur-3xl opacity-70 group-hover:opacity-100 transition-all duration-500" />
            <div className="relative rounded-full w-full h-full flex flex-col items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #ffd700, #ff8c00 40%, #ff4500 70%, #8b0000)',
                boxShadow: 'inset -40px -40px 100px rgba(0,0,0,0.6), inset 20px 20px 80px rgba(255,255,255,0.2), 0 0 120px rgba(255, 140, 0, 0.9)'
              }}>
              <div className="relative z-10 text-center px-8 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-7xl mb-5 block filter drop-shadow-2xl animate-pulse" style={{ animationDuration: '3s' }}>🤖</span>
                <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
                  {t.option2.title}
                </h3>
                <p className="text-base text-gray-100 drop-shadow-md">
                  {t.option2.desc}
                </p>
              </div>
            </div>
            {/* Moon 1 */}
            <div
              className="absolute w-16 h-16 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #e0e0e0, #909090 60%, #505050)',
                boxShadow: 'inset -8px -8px 20px rgba(0,0,0,0.7), inset 4px 4px 15px rgba(255,255,255,0.2), 0 0 30px rgba(150, 150, 150, 0.4)',
                top: '50%',
                left: '50%',
                transform: `rotate(${moonRotation}deg) translateX(240px) translateY(-50%)`,
                transformOrigin: '0 0'
              }}
            />
            {/* Moon 2 */}
            <div
              className="absolute w-12 h-12 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 40% 40%, #d4b896, #8b7355 60%, #5a4a3a)',
                boxShadow: 'inset -6px -6px 15px rgba(0,0,0,0.7), inset 3px 3px 10px rgba(255,255,255,0.2), 0 0 20px rgba(139, 115, 85, 0.4)',
                top: '50%',
                left: '50%',
                transform: `rotate(${moonRotation * 1.5}deg) translateX(-260px) translateY(-50%)`,
                transformOrigin: '0 0'
              }}
            />
          </div>

          {/* Moon-like planet (Gray) - Smallest, Bottom Left */}
          <div
            className="absolute bottom-20 left-24 w-52 h-52 cursor-pointer group"
            onClick={() => handlePlanetClick('/preprocess')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-400 to-gray-800 blur-2xl opacity-50 group-hover:opacity-80 transition-all duration-500" />
            <div className="relative rounded-full w-full h-full flex flex-col items-center justify-center shadow-2xl transform group-hover:scale-115 transition-all duration-500"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #d3d3d3, #808080 50%, #404040 80%, #1a1a1a)',
                boxShadow: 'inset -30px -30px 70px rgba(0,0,0,0.8), inset 15px 15px 50px rgba(255,255,255,0.15), 0 0 60px rgba(120, 120, 120, 0.4)'
              }}>
              <div className="absolute top-8 right-14 w-14 h-14 rounded-full bg-black/40 blur-sm" />
              <div className="absolute bottom-18 left-12 w-10 h-10 rounded-full bg-black/35 blur-sm" />
              <div className="absolute top-24 left-16 w-8 h-8 rounded-full bg-black/30" />
              <div className="relative z-10 text-center px-6 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl mb-4 block filter drop-shadow-2xl">📊</span>
                <h3 className="text-lg font-bold text-white mb-2 drop-shadow-md">
                  {t.option1.title}
                </h3>
                <p className="text-sm text-gray-200 drop-shadow-sm">
                  {t.option1.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Ocean planet (Blue) - Medium, Top Center-Left with 1 moon */}
          <div
            className="absolute top-32 left-1/4 -translate-x-1/2 w-80 h-80 cursor-pointer group"
            onClick={() => handlePlanetClick('/test')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-blue-800 blur-3xl opacity-65 group-hover:opacity-95 transition-all duration-500" />
            <div className="relative rounded-full w-full h-full flex flex-col items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #87ceeb, #4682b4 45%, #00008b 75%, #000033)',
                boxShadow: 'inset -35px -35px 80px rgba(0,0,0,0.6), inset 18px 18px 60px rgba(255,255,255,0.2), 0 0 100px rgba(0, 150, 255, 0.7)'
              }}>
              <div className="absolute top-12 right-16 w-28 h-24 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute bottom-20 left-20 w-24 h-20 rounded-full bg-blue-900/40 blur-xl" />
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
            {/* Moon */}
            <div
              className="absolute w-14 h-14 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 38% 38%, #f5f5f5, #a0a0a0 55%, #606060)',
                boxShadow: 'inset -7px -7px 18px rgba(0,0,0,0.7), inset 3px 3px 12px rgba(255,255,255,0.2), 0 0 25px rgba(160, 160, 160, 0.4)',
                top: '50%',
                left: '50%',
                transform: `rotate(${moonRotation * 0.8}deg) translateX(200px) translateY(-50%)`,
                transformOrigin: '0 0'
              }}
            />
          </div>

          {/* Dictionary planet (Purple) - Medium, Bottom Right with 2 moons */}
          <div
            className="absolute bottom-32 right-24 w-72 h-72 cursor-pointer group"
            onClick={() => handlePlanetClick('/dictionary')}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-300 to-indigo-800 blur-3xl opacity-65 group-hover:opacity-95 transition-all duration-500" />
            <div className="relative rounded-full w-full h-full flex flex-col items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-500"
              style={{
                background: 'radial-gradient(circle at 32% 32%, #dda0dd, #9370db 45%, #4b0082 75%, #1a001a)',
                boxShadow: 'inset -32px -32px 75px rgba(0,0,0,0.6), inset 16px 16px 55px rgba(255,255,255,0.2), 0 0 90px rgba(138, 43, 226, 0.7)'
              }}>
              <div className="absolute top-14 right-14 w-26 h-22 rounded-full bg-white/12 blur-2xl" />
              <div className="absolute bottom-18 left-18 w-22 h-18 rounded-full bg-indigo-900/35 blur-xl" />
              <div className="relative z-10 text-center px-6 transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-7xl mb-5 block filter drop-shadow-2xl">📚</span>
                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-lg">
                  {t.option4.title}
                </h3>
                <p className="text-base text-purple-50 drop-shadow-md">
                  {t.option4.desc}
                </p>
              </div>
            </div>
            {/* Moon 1 */}
            <div
              className="absolute w-12 h-12 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 40% 40%, #faf0e6, #c4a77d 55%, #8b7355)',
                boxShadow: 'inset -6px -6px 15px rgba(0,0,0,0.7), inset 3px 3px 10px rgba(255,255,255,0.2), 0 0 20px rgba(196, 167, 125, 0.4)',
                top: '50%',
                left: '50%',
                transform: `rotate(${moonRotation * 1.2}deg) translateX(180px) translateY(-50%)`,
                transformOrigin: '0 0'
              }}
            />
            {/* Moon 2 */}
            <div
              className="absolute w-10 h-10 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 42% 42%, #e6e6fa, #9999cc 55%, #666699)',
                boxShadow: 'inset -5px -5px 12px rgba(0,0,0,0.7), inset 2px 2px 8px rgba(255,255,255,0.2), 0 0 18px rgba(153, 153, 204, 0.4)',
                top: '50%',
                left: '50%',
                transform: `rotate(${moonRotation * 1.8}deg) translateX(-200px) translateY(-50%)`,
                transformOrigin: '0 0'
              }}
            />
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
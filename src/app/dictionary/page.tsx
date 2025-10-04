
'use client';
import { useState, useEffect } from 'react';
import dictionaryData from '../../../exoplanet-data-dictionary.json';

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

interface Field {
  vi: string;
  en: string;
}

interface Dataset {
  name: string;
  history: Field;
  characteristics: Field;
  fields: Record<string, Field>;
}

interface DictionaryData {
  title: Field;
  transit_explanation: Field;
  datasets: Dataset[];
  references: Field;
}

export default function CosmicDictionary() {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const data = dictionaryData as unknown as DictionaryData;

  useEffect(() => {
    setIsClient(true);
    const generatedStars: Star[] = [...Array(200)].map((_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      top: Math.random() * 300,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent): void => {
      setMousePos({ x: event.clientX, y: event.clientY });
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

  const toggleLanguage = (): void => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const toggleSection = (section: string): void => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  const filteredFields = (fields: Record<string, Field>): [string, Field][] => {
    return Object.entries(fields).filter(([field]) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const keplerDataset = data.datasets[0];
  const tessDataset = data.datasets[1];

  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-x-hidden">
      {/* Starfield background */}
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

      {/* Floating nebula backgrounds */}
      <div 
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-700"
        style={{
          top: `${20 - scrollY * 0.1}%`,
          left: `${10 + scrollY * 0.05}%`,
          background: 'radial-gradient(circle, rgba(138, 43, 226, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          opacity: 0.6
        }}
      />
      <div 
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none transition-all duration-700"
        style={{
          top: `${60 + scrollY * 0.08}%`,
          right: `${15 - scrollY * 0.04}%`,
          background: 'radial-gradient(circle, rgba(255, 0, 128, 0.25) 0%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: 0.5
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-lg border-b border-purple-500/30">
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
          {language === 'vi' ? 'EN' : 'VI'}
        </button>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4">
        <div 
          className="text-center mb-20 transform transition-all duration-500"
          style={{
            transform: isClient ? `translateY(${scrollY * 0.3}px)` : 'none'
          }}
        >
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
            {data.title[language]}
          </h1>
          <p className="text-xl text-purple-200 mb-8 max-w-3xl mx-auto">
            {language === 'vi' ? 'Khám phá chi tiết các trường dữ liệu từ Kepler và TESS' : 'Explore detailed data fields from Kepler and TESS'}
          </p>
          
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder={language === 'vi' ? 'Tìm kiếm trường dữ liệu...' : 'Search data fields...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 bg-gray-900/50 text-white rounded-full border-2 border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-400 backdrop-blur-sm text-lg"
            />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-purple-300">
            <span className="text-sm mb-2">{language === 'vi' ? 'Cuộn xuống' : 'Scroll down'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Transit Phenomenon */}
      <section className="relative py-32 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            className="relative"
            style={{
              transform: isClient ? `translateX(${(mousePos.x - windowWidth / 2) / 50}px) translateY(${(mousePos.y - windowHeight / 2) / 50}px)` : 'none',
              transition: 'transform 0.3s ease-out'
            }}
          >
            <div className="relative w-64 h-64 mx-auto mb-12">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 animate-pulse"
                style={{
                  boxShadow: '0 0 120px rgba(255, 140, 0, 0.9), inset -30px -30px 80px rgba(0,0,0,0.4)',
                  animationDuration: '3s'
                }}
              />
              <div className="absolute inset-8 rounded-full bg-yellow-200/20 blur-2xl" />
            </div>

            <div 
              className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8"
              style={{
                transform: `rotate(${scrollY * 0.5}deg) translateX(150px)`,
                transition: 'transform 0.1s linear'
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-800"
                style={{
                  boxShadow: '0 0 40px rgba(0, 150, 255, 0.7), inset -10px -10px 30px rgba(0,0,0,0.5)'
                }}
              />
            </div>
          </div>

          <div className="text-center mt-20 bg-gray-900/30 backdrop-blur-sm rounded-3xl p-8 border border-purple-500/30">
            <h2 className="text-4xl font-bold text-purple-300 mb-6">
              {language === 'vi' ? 'Hiện tượng Quá cảnh' : 'Transit Phenomenon'}
            </h2>
            <p className="text-lg text-purple-100 leading-relaxed">{data.transit_explanation[language]}</p>
          </div>
        </div>
      </section>

      {/* Kepler Mission */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Kepler Planet - Sticky */}
            <div className="lg:col-span-2 lg:sticky lg:top-24">
              <div 
                className="relative"
                style={{
                  transform: isClient ? `translateY(${Math.sin(scrollY * 0.002) * 30}px)` : 'none',
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <div className="w-full max-w-md mx-auto relative group cursor-pointer"
                  onClick={() => setSelectedPlanet(selectedPlanet === 'kepler' ? null : 'kepler')}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 to-red-600 blur-3xl opacity-70 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 rounded-full aspect-square flex items-center justify-center border-4 border-orange-600 shadow-2xl transform group-hover:scale-105 transition-all duration-500"
                    style={{
                      boxShadow: 'inset -30px -30px 80px rgba(0,0,0,0.4), inset 30px 30px 80px rgba(255,255,255,0.3), 0 0 120px rgba(255, 140, 0, 0.9)'
                    }}>
                    <div className="absolute top-8 right-12 w-24 h-24 rounded-full bg-yellow-400/40 blur-md animate-pulse" />
                    <div className="absolute bottom-16 left-16 w-20 h-20 rounded-full bg-orange-600/50 blur-sm" />
                    <span className="text-8xl filter drop-shadow-2xl">🔭</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h2 className="text-5xl font-bold text-orange-300 mb-4">{keplerDataset.name}</h2>
                  <p className="text-lg text-orange-100">{language === 'vi' ? 'Click để xem các trường dữ liệu' : 'Click to view data fields'}</p>
                </div>
              </div>
            </div>

            {/* Kepler Content */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
                <h3 className="text-2xl font-bold text-orange-200 mb-3">
                  {language === 'vi' ? 'Lịch sử' : 'History'}
                </h3>
                <p className="text-orange-100 leading-relaxed">{keplerDataset.history[language]}</p>
              </div>

              <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30">
                <h3 className="text-2xl font-bold text-orange-200 mb-3">
                  {language === 'vi' ? 'Đặc điểm' : 'Characteristics'}
                </h3>
                <p className="text-orange-100 leading-relaxed">{keplerDataset.characteristics[language]}</p>
              </div>
              
              {selectedPlanet === 'kepler' && (
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-orange-300 mb-6">
                    {language === 'vi' ? '📊 Các Trường Dữ Liệu' : '📊 Data Fields'}
                  </h3>
                  <div className="grid gap-3">
                    {filteredFields(keplerDataset.fields).map(([field, desc]) => (
                      <div key={field} className="border border-orange-500/30 rounded-xl bg-gray-900/40 backdrop-blur-sm overflow-hidden hover:border-orange-400/50 transition-all">
                        <button
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-orange-500/10 transition-colors"
                          onClick={() => toggleSection(`kepler-${field}`)}
                        >
                          <span className="font-mono text-orange-300 font-semibold text-sm">{field}</span>
                          <span className="text-orange-400 text-xl">{expandedSections[`kepler-${field}`] ? '−' : '+'}</span>
                        </button>
                        {expandedSections[`kepler-${field}`] && (
                          <div className="p-4 text-orange-50 border-t border-orange-500/20 bg-gray-900/60 text-sm leading-relaxed">
                            {desc[language]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TESS Mission */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* TESS Content */}
            <div className="lg:col-span-3 space-y-6 lg:order-1 order-2">
              <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                <h3 className="text-2xl font-bold text-cyan-200 mb-3">
                  {language === 'vi' ? 'Lịch sử' : 'History'}
                </h3>
                <p className="text-cyan-100 leading-relaxed">{tessDataset.history[language]}</p>
              </div>

              <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
                <h3 className="text-2xl font-bold text-cyan-200 mb-3">
                  {language === 'vi' ? 'Đặc điểm' : 'Characteristics'}
                </h3>
                <p className="text-cyan-100 leading-relaxed">{tessDataset.characteristics[language]}</p>
              </div>
              
              {selectedPlanet === 'tess' && (
                <div className="space-y-3">
                  <h3 className="text-3xl font-bold text-cyan-300 mb-6">
                    {language === 'vi' ? '📊 Các Trường Dữ Liệu' : '📊 Data Fields'}
                  </h3>
                  <div className="grid gap-3">
                    {filteredFields(tessDataset.fields).map(([field, desc]) => (
                      <div key={field} className="border border-cyan-500/30 rounded-xl bg-gray-900/40 backdrop-blur-sm overflow-hidden hover:border-cyan-400/50 transition-all">
                        <button
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-cyan-500/10 transition-colors"
                          onClick={() => toggleSection(`tess-${field}`)}
                        >
                          <span className="font-mono text-cyan-300 font-semibold text-sm">{field}</span>
                          <span className="text-cyan-400 text-xl">{expandedSections[`tess-${field}`] ? '−' : '+'}</span>
                        </button>
                        {expandedSections[`tess-${field}`] && (
                          <div className="p-4 text-cyan-50 border-t border-cyan-500/20 bg-gray-900/60 text-sm leading-relaxed">
                            {desc[language]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TESS Planet - Sticky */}
            <div className="lg:col-span-2 lg:sticky lg:top-24 lg:order-2 order-1">
              <div 
                className="relative"
                style={{
                  transform: isClient ? `translateY(${Math.cos(scrollY * 0.002) * 30}px)` : 'none',
                  transition: 'transform 0.3s ease-out'
                }}
              >
                <div className="w-full max-w-md mx-auto relative group cursor-pointer"
                  onClick={() => setSelectedPlanet(selectedPlanet === 'tess' ? null : 'tess')}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300 to-blue-800 blur-3xl opacity-65 group-hover:opacity-95 transition-all duration-500" />
                  <div className="relative bg-gradient-to-br from-cyan-200 via-blue-400 to-blue-800 rounded-full aspect-square flex items-center justify-center border-4 border-blue-700 shadow-2xl transform group-hover:scale-105 transition-all duration-500"
                    style={{
                      boxShadow: 'inset -28px -28px 70px rgba(0,0,0,0.5), inset 28px 28px 70px rgba(255,255,255,0.25), 0 0 100px rgba(0, 150, 255, 0.7)'
                    }}>
                    <div className="absolute top-16 right-20 w-32 h-28 rounded-full bg-blue-700/40 blur-md" />
                    <div className="absolute bottom-24 left-24 w-28 h-24 rounded-full bg-cyan-300/50 blur-sm animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute top-20 left-16 w-28 h-28 rounded-full bg-cyan-300/20 blur-2xl" />
                    <span className="text-8xl filter drop-shadow-2xl">🌊</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <h2 className="text-5xl font-bold text-cyan-300 mb-4">{tessDataset.name}</h2>
                  <p className="text-lg text-cyan-100">{language === 'vi' ? 'Click để xem các trường dữ liệu' : 'Click to view data fields'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-lg border-t border-purple-500/30 py-8 mt-32">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-sm text-purple-200/70 mb-4">
            © 2025 Seishinteki - NASA Space Apps Challenge
          </div>
          <div className="text-purple-300/80">
            <a href="http://exoplanetarchive.ipac.caltech.edu" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition-colors underline">
              {data.references[language]}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

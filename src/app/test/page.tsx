'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface InputData {
  [key: string]: number;
}

interface FieldExplanation {
  vi: string;
  en: string;
  type: string;
}

type FieldsData = Record<string, FieldExplanation>;

interface PredictResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

// Mock data dictionaries
const keplerFields: FieldsData = {
  koi_score: { vi: 'Điểm tin cậy (0-1)', en: 'Confidence score (0-1)', type: 'numeric' },
  koi_fpflag_nt: { vi: 'Cờ không phải quá cảnh', en: 'Not transit flag', type: 'flag' },
  koi_fpflag_ss: { vi: 'Cờ nhật thực sao', en: 'Stellar eclipse flag', type: 'flag' },
  koi_fpflag_co: { vi: 'Cờ lệch tâm', en: 'Centroid offset flag', type: 'flag' },
  koi_fpflag_ec: { vi: 'Cờ nhiễu ephemeris', en: 'Ephemeris match flag', type: 'flag' },
  koi_period: { vi: 'Chu kỳ quỹ đạo (ngày)', en: 'Orbital period (days)', type: 'important' },
  koi_impact: { vi: 'Tham số va chạm', en: 'Impact parameter', type: 'important' },
  koi_duration: { vi: 'Thời gian quá cảnh (giờ)', en: 'Transit duration (hours)', type: 'important' },
  koi_depth: { vi: 'Độ sâu quá cảnh (ppm)', en: 'Transit depth (ppm)', type: 'important' },
  koi_prad: { vi: 'Bán kính hành tinh (so với Trái Đất)', en: 'Planet radius (Earth radii)', type: 'important' },
  koi_teq: { vi: 'Nhiệt độ cân bằng (K)', en: 'Equilibrium temperature (K)', type: 'important' },
  koi_insol: { vi: 'Dòng bức xạ (so với Trái Đất)', en: 'Insolation flux (Earth flux)', type: 'important' },
  koi_steff: { vi: 'Nhiệt độ ngôi sao (K)', en: 'Stellar temperature (K)', type: 'important' },
  koi_slogg: { vi: 'Trọng lực bề mặt sao', en: 'Stellar surface gravity', type: 'important' },
  koi_srad: { vi: 'Bán kính sao (so với Mặt Trời)', en: 'Stellar radius (Solar radii)', type: 'important' },
};

const tessFields: FieldsData = {
  pl_orbper: { vi: 'Chu kỳ quỹ đạo (ngày)', en: 'Orbital period (days)', type: 'important' },
  pl_trandurh: { vi: 'Thời gian quá cảnh (giờ)', en: 'Transit duration (hours)', type: 'important' },
  pl_trandep: { vi: 'Độ sâu quá cảnh (ppm)', en: 'Transit depth (ppm)', type: 'important' },
  pl_rade: { vi: 'Bán kính hành tinh (so với Trái Đất)', en: 'Planet radius (Earth radii)', type: 'important' },
  pl_insol: { vi: 'Dòng bức xạ (so với Trái Đất)', en: 'Insolation flux (Earth flux)', type: 'important' },
  pl_eqt: { vi: 'Nhiệt độ cân bằng (K)', en: 'Equilibrium temperature (K)', type: 'important' },
  st_tmag: { vi: 'Độ sáng TESS (magnitude)', en: 'TESS magnitude', type: 'important' },
  st_dist: { vi: 'Khoảng cách (parsecs)', en: 'Distance (parsecs)', type: 'important' },
  st_teff: { vi: 'Nhiệt độ ngôi sao (K)', en: 'Stellar temperature (K)', type: 'important' },
  st_logg: { vi: 'Trọng lực bề mặt sao', en: 'Stellar surface gravity', type: 'important' },
  st_rad: { vi: 'Bán kính sao (so với Mặt Trời)', en: 'Stellar radius (Solar radii)', type: 'important' },
};

// Validation ranges
const fieldRanges: Record<string, { min: number; max: number; step?: number }> = {
  // Flags
  koi_fpflag_nt: { min: 0, max: 1, step: 1 },
  koi_fpflag_ss: { min: 0, max: 1, step: 1 },
  koi_fpflag_co: { min: 0, max: 1, step: 1 },
  koi_fpflag_ec: { min: 0, max: 1, step: 1 },
  // Scores
  koi_score: { min: 0, max: 1, step: 0.01 },
  // Periods
  koi_period: { min: 0.1, max: 1000 },
  pl_orbper: { min: 0.1, max: 1000 },
  // Durations
  koi_duration: { min: 0.1, max: 24 },
  pl_trandurh: { min: 0.1, max: 24 },
  // Depths
  koi_depth: { min: 0, max: 100000 },
  pl_trandep: { min: 0, max: 100000 },
  // Radii
  koi_prad: { min: 0.1, max: 30 },
  pl_rade: { min: 0.1, max: 30 },
  koi_srad: { min: 0.1, max: 100 },
  st_rad: { min: 0.1, max: 100 },
  // Temperatures
  koi_teq: { min: 0, max: 5000 },
  pl_eqt: { min: 0, max: 5000 },
  koi_steff: { min: 2000, max: 50000 },
  st_teff: { min: 2000, max: 50000 },
  // Others
  koi_impact: { min: 0, max: 2 },
  koi_insol: { min: 0, max: 10000 },
  pl_insol: { min: 0, max: 10000 },
  koi_slogg: { min: 0, max: 5 },
  st_logg: { min: 0, max: 5 },
  st_tmag: { min: 0, max: 20 },
  st_dist: { min: 0, max: 5000 },
};

export default function TestPage() {
  const [dataset, setDataset] = useState<'kepler' | 'tess' | null>(null);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [inputData, setInputData] = useState<InputData>({});
  const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const fieldsData: FieldsData = dataset === 'kepler' ? keplerFields : dataset === 'tess' ? tessFields : {};
  const featureFields = Object.keys(fieldsData);

  const t = {
    title: language === 'vi' ? 'Kiểm thử Mô hình ML' : 'ML Model Testing',
    selectDataset: language === 'vi' ? 'Chọn Bộ Dữ Liệu' : 'Select Dataset',
    step1: language === 'vi' ? 'Bước 1: Chọn dữ liệu' : 'Step 1: Select Data',
    step2: language === 'vi' ? 'Bước 2: Nhập thông số' : 'Step 2: Input Parameters',
    step3: language === 'vi' ? 'Bước 3: Kết quả dự đoán' : 'Step 3: Prediction Results',
    next: language === 'vi' ? 'Tiếp theo' : 'Next',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    predict: language === 'vi' ? 'Dự đoán' : 'Predict',
    close: language === 'vi' ? 'Đóng' : 'Close',
    loading: language === 'vi' ? 'Đang xử lý...' : 'Processing...',
    prediction: language === 'vi' ? 'Kết quả' : 'Result',
    confidence: language === 'vi' ? 'Độ tin cậy' : 'Confidence',
    probabilities: language === 'vi' ? 'Xác suất các lớp' : 'Class Probabilities',
    fillDefaults: language === 'vi' ? 'Điền mẫu' : 'Fill Sample',
    resetForm: language === 'vi' ? 'Xóa hết' : 'Reset All',
    toggle: language === 'vi' ? 'EN' : 'VI',
  };

  const defaultValues: Record<string, InputData> = {
    kepler: {
      koi_score: 0.95,
      koi_fpflag_nt: 0,
      koi_fpflag_ss: 0,
      koi_fpflag_co: 0,
      koi_fpflag_ec: 0,
      koi_period: 9.48,
      koi_impact: 0.146,
      koi_duration: 2.96,
      koi_depth: 615.8,
      koi_prad: 2.26,
      koi_teq: 793,
      koi_insol: 35.8,
      koi_steff: 5455,
      koi_slogg: 4.47,
      koi_srad: 0.93,
    },
    tess: {
      pl_orbper: 5.43,
      pl_trandurh: 3.96,
      pl_trandep: 14939.63,
      pl_rade: 2.5,
      pl_insol: 273.59,
      pl_eqt: 1037.28,
      st_tmag: 7.61,
      st_dist: 510.3,
      st_teff: 8868.7,
      st_logg: 4.2,
      st_rad: 1.5,
    },
  };

  const handleInputChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const range = fieldRanges[key];
      if (range) {
        const clampedValue = Math.max(range.min, Math.min(range.max, num));
        setInputData(prev => ({ ...prev, [key]: clampedValue }));
      } else {
        setInputData(prev => ({ ...prev, [key]: num }));
      }
    }
  };

  const fillDefaults = () => {
    if (dataset) {
      setInputData(defaultValues[dataset]);
    }
  };

  const resetForm = () => {
    setInputData({});
  };

  const handlePredict = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const mockResult: PredictResult = {
        prediction: Math.random() > 0.5 ? 'CONFIRMED' : 'CANDIDATE',
        confidence: 0.85 + Math.random() * 0.14,
        probabilities: {
          'CONFIRMED': 0.87,
          'CANDIDATE': 0.10,
          'FALSE POSITIVE': 0.03,
        },
      };
      setPredictResult(mockResult);
      setCurrentStep(2);
      setLoading(false);
    }, 1500);
  };

  const getRange = (key: string) => fieldRanges[key];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans relative overflow-hidden">
      {/* Starfield */}
      <div className="fixed inset-0 overflow-hidden">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
      </div>

      <header className="relative flex justify-between items-center p-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 backdrop-blur-lg border-b border-purple-500/30 z-10">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🔬</span>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Exoplanet Hunter
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-purple-400 hover:text-purple-200 transition-colors">
            ← Home
          </Link>
          <button
            onClick={() => setLanguage(prev => prev === 'vi' ? 'en' : 'vi')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-medium"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center py-12 px-4 z-10">
        <div className="text-center mb-12 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-xl text-purple-200">
            {language === 'vi' ? 'Sử dụng AI để dự đoán hành tinh ngoài hệ mặt trời' : 'Use AI to predict exoplanets'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-xl font-semibold shadow-lg transform hover:scale-105"
        >
          🚀 {language === 'vi' ? 'Bắt đầu kiểm thử' : 'Start Testing'}
        </button>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-7xl max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-500/30">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
              <div>
                <h2 className="text-3xl font-bold text-purple-300">
                  {currentStep === 0 ? t.step1 : currentStep === 1 ? t.step2 : t.step3}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {language === 'vi' ? `Bước ${currentStep + 1}/3` : `Step ${currentStep + 1}/3`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(0);
                  setDataset(null);
                  setInputData({});
                  setPredictResult(null);
                }}
                className="text-gray-400 hover:text-white text-4xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Step 0: Select Dataset */}
            {currentStep === 0 && (
              <div className="py-12">
                <h3 className="text-3xl font-bold text-center mb-12 text-purple-300">{t.selectDataset}</h3>
                <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
                  <button
                    onClick={() => {
                      setDataset('kepler');
                      setCurrentStep(1);
                      setInputData(defaultValues.kepler);
                    }}
                    className="group relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-center">
                      <div className="text-7xl mb-4">🔭</div>
                      <h4 className="text-3xl font-bold text-white mb-2">Kepler</h4>
                      <p className="text-orange-100">2009-2018</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setDataset('tess');
                      setCurrentStep(1);
                      setInputData(defaultValues.tess);
                    }}
                    className="group relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 p-12 rounded-2xl hover:scale-105 transition-all shadow-2xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-center">
                      <div className="text-7xl mb-4">🛸</div>
                      <h4 className="text-3xl font-bold text-white mb-2">TESS</h4>
                      <p className="text-cyan-100">2018-Present</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Input Data */}
            {currentStep === 1 && dataset && (
              <div className="py-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-purple-300">
                    {language === 'vi' ? `Nhập thông số ${dataset.toUpperCase()}` : `Input ${dataset.toUpperCase()} Parameters`}
                  </h3>
                  <div className="space-x-3">
                    <button
                      onClick={fillDefaults}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                    >
                      📋 {t.fillDefaults}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm font-medium"
                    >
                      🗑️ {t.resetForm}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4">
                  {featureFields.map((key) => {
                    const field = fieldsData[key];
                    const range = getRange(key);
                    const isFlag = field?.type === 'flag';
                    
                    return (
                      <div
                        key={key}
                        className="group relative bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
                        title={field?.[language] || key}
                      >
                        <label className="block mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-300 truncate pr-2">
                              {key}
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              ℹ️
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                            {field?.[language] || ''}
                          </p>
                          
                          {isFlag ? (
                            <select
                              value={inputData[key] ?? 0}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-white text-lg font-medium"
                            >
                              <option value="0">0 (No)</option>
                              <option value="1">1 (Yes)</option>
                            </select>
                          ) : (
                            <input
                              type="number"
                              step={range?.step || 'any'}
                              min={range?.min}
                              max={range?.max}
                              value={inputData[key] ?? ''}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              placeholder={range ? `${range.min}-${range.max}` : '0'}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-white text-lg"
                            />
                          )}
                          {range && !isFlag && (
                            <div className="mt-2 text-xs text-gray-500">
                              Range: {range.min} - {range.max}
                            </div>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Results */}
            {currentStep === 2 && predictResult && (
              <div className="py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="text-center">
                    <div className="text-8xl mb-6">
                      {predictResult.prediction === 'CONFIRMED' ? '✅' : '❓'}
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-teal-600 p-8 rounded-2xl shadow-2xl">
                      <p className="text-lg text-white/80 mb-2">{t.prediction}</p>
                      <p className="text-4xl font-bold text-white mb-4">{predictResult.prediction}</p>
                      <p className="text-xl text-white/90">
                        {t.confidence}: {(predictResult.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700">
                    <h4 className="text-xl font-bold text-purple-300 mb-4">{t.probabilities}</h4>
                    <div className="space-y-4">
                      {Object.entries(predictResult.probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cls, prob]) => (
                          <div key={cls} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-white">{cls}</span>
                              <span className="text-green-400 font-bold">{(prob * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-4">
                              <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-full h-4 transition-all duration-500"
                                style={{ width: `${prob * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-700 mt-6">
              <button
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                    if (currentStep === 1) setDataset(null);
                  }
                }}
                disabled={currentStep === 0}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                ← {t.back}
              </button>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              {currentStep === 1 ? (
                <button
                  onClick={handlePredict}
                  disabled={loading || featureFields.some(key => inputData[key] === undefined)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      {t.loading}
                    </>
                  ) : (
                    `${t.predict} 🔮`
                  )}
                </button>
              ) : currentStep === 2 ? (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setCurrentStep(0);
                    setDataset(null);
                    setInputData({});
                    setPredictResult(null);
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
                >
                  {t.close}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
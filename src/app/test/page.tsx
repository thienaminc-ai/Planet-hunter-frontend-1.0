'use client';
import { useState, useEffect } from 'react';

interface FieldsExplanation {
  vi: string;
  en: string;
  type: string;
}

interface InputData {
  [key: string]: number | '';
}

type FieldsData = Record<string, FieldsExplanation>;

interface PredictResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

interface PredictResponse {
  status: string;
  message: string;
  model_name: string;
  result: PredictResult;
}

interface RangeConstraints {
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: number[];
}

const getRangeConstraints = (key: string, dataset: 'kepler' | 'tess', fieldsData: FieldsData, sample: Record<string, number | string>): RangeConstraints => {
  const value = sample[key];
  const fieldInfo = fieldsData[key];

  if (fieldInfo?.type === 'flag') {
    return { allowedValues: [0, 1] };
  }

  if (typeof value !== 'number') {
    return {};
  }

  const baseValue = value as number;
  if (key.includes('period') || key.includes('tranmid')) {
    return { min: 0, max: baseValue * 10, step: 0.0001 };
  }
  if (key.includes('depth') || key.includes('trandep')) {
    return { min: 0, max: baseValue * 10, step: 0.1 };
  }
  if (key.includes('duration') || key.includes('trandurh')) {
    return { min: 0, max: baseValue * 10, step: 0.01 };
  }
  if (key.includes('prad') || key.includes('rade')) {
    return { min: 0, max: baseValue * 10, step: 0.01 };
  }
  if (key.includes('teq') || key.includes('eqt')) {
    return { min: 0, max: 5000, step: 0.1 };
  }
  if (key.includes('insol')) {
    return { min: 0, max: baseValue * 10, step: 0.1 };
  }
  return { min: -baseValue * 10, max: baseValue * 10, step: 0.01 };
};

export default function TestPage() {
  const [dataset, setDataset] = useState<'kepler' | 'tess' | null>(null);
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [models] = useState<string[]>(['kepler_demo', 'tess_demo', 'model_v1', 'model_v2']);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelFeatures, setModelFeatures] = useState<string[]>([]);
  const [inputData, setInputData] = useState<InputData>({});
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Mock data
  const fieldsData: FieldsData = dataset === 'kepler' 
    ? {
        'koi_period': { vi: 'Chu kỳ quỹ đạo', en: 'Orbital period', type: 'numeric' },
        'koi_depth': { vi: 'Độ sâu quá cảnh', en: 'Transit depth', type: 'numeric' },
        'koi_duration': { vi: 'Thời gian quá cảnh', en: 'Transit duration', type: 'numeric' },
        'koi_prad': { vi: 'Bán kính hành tinh', en: 'Planet radius', type: 'numeric' },
        'koi_teq': { vi: 'Nhiệt độ cân bằng', en: 'Equilibrium temp', type: 'numeric' },
        'koi_insol': { vi: 'Bức xạ', en: 'Insolation flux', type: 'numeric' },
      }
    : dataset === 'tess' 
    ? {
        'period': { vi: 'Chu kỳ', en: 'Period', type: 'numeric' },
        'duration': { vi: 'Thời gian', en: 'Duration', type: 'numeric' },
        'depth': { vi: 'Độ sâu', en: 'Depth', type: 'numeric' },
        'tmag': { vi: 'Độ sáng', en: 'TESS mag', type: 'numeric' },
      }
    : {};

  const currentSampleData: Record<string, number | string> = dataset === 'kepler'
    ? { 'koi_period': 10.5, 'koi_depth': 500, 'koi_duration': 3.2, 'koi_prad': 2.5, 'koi_teq': 800, 'koi_insol': 50 }
    : dataset === 'tess'
    ? { 'period': 8.3, 'duration': 2.8, 'depth': 450, 'tmag': 12.5 }
    : {};

  const featureFields = Object.keys(currentSampleData);

  const toggleLanguage = () => setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));

  const t = {
    title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
    description: language === 'vi' ? 'Chọn bộ dữ liệu và mô hình để dự đoán.' : 'Select dataset and model to predict.',
    testButton: language === 'vi' ? 'Bắt đầu Kiểm thử' : 'Start Testing',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    preprocess: language === 'vi' ? 'Tiền xử lý' : 'Preprocess',
    prev: language === 'vi' ? 'Quay lại' : 'Back',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang dự đoán...' : 'Predicting...',
    selectDatasetTitle: language === 'vi' ? 'Chọn Bộ Dữ Liệu' : 'Select Dataset',
    step1Title: language === 'vi' ? 'Bước 1: Chọn mô hình' : 'Step 1: Select Model',
    step2Title: language === 'vi' ? 'Bước 2: Nhập dữ liệu' : 'Step 2: Input Data',
    step3Title: language === 'vi' ? 'Bước 3: Kết quả' : 'Step 3: Results',
    modelLabel: language === 'vi' ? 'Mô hình:' : 'Model:',
    modelPlaceholder: language === 'vi' ? 'Chọn mô hình' : 'Select model',
    nextButtonStep1: language === 'vi' ? 'Tiếp theo' : 'Next',
    predictButtonStep2: language === 'vi' ? 'Dự đoán' : 'Predict',
    closeButton: language === 'vi' ? 'Đóng' : 'Close',
    prediction: language === 'vi' ? 'Dự đoán:' : 'Prediction:',
    confidence: language === 'vi' ? 'Độ tin cậy:' : 'Confidence:',
    probabilities: language === 'vi' ? 'Xác suất các lớp:' : 'Class Probabilities:',
    noModels: language === 'vi' ? 'Không tìm thấy mô hình.' : 'No models found.',
    inputLabel: language === 'vi' ? 'Dữ liệu đầu vào:' : 'Input Data:',
    totalFields: language === 'vi' ? 'Tổng số trường:' : 'Total fields:',
    modelUsed: language === 'vi' ? 'Mô hình:' : 'Model:',
    errorSelect: language === 'vi' ? 'Vui lòng chọn mô hình.' : 'Please select a model.',
    loadingFeatures: language === 'vi' ? 'Đang tải...' : 'Loading...',
    invalidInput: language === 'vi' ? 'Giá trị không hợp lệ' : 'Invalid value',
  };

  useEffect(() => {
    if (dataset && models.length > 0) {
      setSelectedModel(models[0]);
    }
  }, [dataset, models]);

  const fetchModelFeatures = async (modelName: string): Promise<boolean> => {
    if (!dataset) return false;
    
    setLoadingFeatures(true);
    setError(null);
    
    setTimeout(() => {
      const features = featureFields;
      setModelFeatures(features);
      const defaults = features.reduce((acc: InputData, featKey: string) => {
        const sampleValue = currentSampleData[featKey];
        acc[featKey] = typeof sampleValue === 'number' ? sampleValue : 0;
        return acc;
      }, {});
      setInputData(defaults);
      setLoadingFeatures(false);
    }, 500);
    
    return true;
  };

  const handleInputChange = (key: string, value: string) => {
    const constraints = getRangeConstraints(key, dataset || 'kepler', fieldsData, currentSampleData);
    if (value === '') {
      setInputData(prev => ({ ...prev, [key]: '' }));
      return;
    }

    const num = Number(value);
    if (isNaN(num)) {
      setError(`${t.invalidInput} ${key}`);
      return;
    }

    if (constraints.allowedValues && !constraints.allowedValues.includes(num)) {
      setError(`${t.invalidInput} ${key}`);
      return;
    }

    if (constraints.min !== undefined && num < constraints.min) {
      setError(`${t.invalidInput} ${key}`);
      return;
    }
    if (constraints.max !== undefined && num > constraints.max) {
      setError(`${t.invalidInput} ${key}`);
      return;
    }

    setError(null);
    setInputData(prev => ({ ...prev, [key]: num }));
  };

  const handlePredict = async () => {
    if (!dataset || !selectedModel) {
      setError(t.errorSelect);
      return;
    }

    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      const mockResult: PredictResponse = {
        status: 'success',
        message: 'Prediction successful',
        model_name: selectedModel,
        result: {
          prediction: 'CONFIRMED',
          confidence: 0.92,
          probabilities: { 'CONFIRMED': 0.92, 'CANDIDATE': 0.05, 'FALSE POSITIVE': 0.03 },
        },
      };
      setPredictResult(mockResult);
      setCurrentStep(2);
      setLoading(false);
    }, 1500);
  };

  const handleNextStep0 = async () => {
    if (!selectedModel) {
      setError(t.errorSelect);
      return;
    }
    const success = await fetchModelFeatures(selectedModel);
    if (success) {
      setCurrentStep(1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 1) {
      setModelFeatures([]);
      setInputData({});
    }
    setCurrentStep(currentStep - 1);
  };

  const getLabel = (key: string): string => {
    return key;
  };

  const getExplanation = (key: string): string => {
    const langKey = language as keyof FieldsExplanation;
    return fieldsData[key]?.[langKey] || key;
  };

  const handleCloseModal = () => {
    setShowStepModal(false);
    setCurrentStep(0);
    setSelectedModel('');
    setModelFeatures([]);
    setInputData({});
    setPredictResult(null);
    setError(null);
    setHoveredField(null);
    setFocusedField(null);
  };

  const descriptionText = language === 'vi'
    ? (dataset ? `Chọn mô hình và nhập dữ liệu từ ${dataset.toUpperCase()}.` : 'Chọn bộ dữ liệu để kiểm thử.')
    : (dataset ? `Select model and input data from ${dataset?.toUpperCase()}.` : 'Select dataset to test.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white text-gray-800 flex flex-col font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      {/* Header - Responsive */}
      <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 shadow-sm gap-3 sm:gap-0">
        <div className="flex items-center space-x-2">
          <span className="text-2xl sm:text-3xl">🪐</span>
          <h2 className="text-lg sm:text-2xl font-bold text-orange-600 truncate">
            {dataset ? `${dataset.toUpperCase()} Hunter` : 'Exoplanet Hunter'}
          </h2>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
          <button className="text-orange-500 hover:text-orange-700 font-medium transition-colors text-sm sm:text-base">
            {t.back}
          </button>
          <button className="text-orange-500 hover:text-orange-700 font-medium transition-colors text-sm sm:text-base">
            {t.preprocess}
          </button>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-300 text-xs sm:text-sm font-medium shadow-md"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      {/* Main Content - Responsive */}
      <main className="relative flex-1 flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-6 sm:mb-8 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            {descriptionText}
          </p>
        </div>

        <div className="w-full max-w-md space-y-4 sm:space-y-6 px-4">
          <button
            onClick={() => setShowDatasetModal(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 sm:py-4 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-300 text-lg sm:text-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                {t.loading}
              </>
            ) : (
              t.testButton
            )}
          </button>

          {error && (
            <div className="p-3 sm:p-4 bg-orange-100 border border-orange-300 rounded-lg text-orange-600 text-center font-medium text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Dataset Selection Modal - Responsive */}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-2xl flex flex-col items-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">{t.selectDatasetTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
              <button
                onClick={() => {
                  setDataset('kepler');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-orange-400 to-amber-500 text-white px-6 py-10 sm:px-8 sm:py-12 rounded-xl hover:from-orange-500 hover:to-amber-600 transition-all duration-300 text-xl sm:text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Kepler
              </button>
              <button
                onClick={() => {
                  setDataset('tess');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-6 py-10 sm:px-8 sm:py-12 rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all duration-300 text-xl sm:text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                TESS
              </button>
            </div>
            <button
              onClick={() => setShowDatasetModal(false)}
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all text-sm font-semibold"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      )}

      {/* Step Modal - Responsive */}
      {showStepModal && dataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-8">
                {/* Header - Responsive */}
                <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                      {currentStep === 0 ? t.step1Title : currentStep === 1 ? t.step2Title : t.step3Title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Bước {currentStep + 1}/3</p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl font-bold transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Step 0 - Model Selection */}
                {currentStep === 0 && (
                  <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-50 rounded-xl">
                    <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">🔭</div>
                    <div className="w-full max-w-2xl p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-md">
                      <label className="block text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">{t.modelLabel}</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 text-sm sm:text-base"
                      >
                        <option value="">{t.modelPlaceholder}</option>
                        {models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 1 - Input Data - Responsive Grid */}
                {currentStep === 1 && (
                  <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-50 rounded-xl">
                    <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">📡</div>
                    <div className="w-full max-w-6xl p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-md space-y-4 sm:space-y-6">
                      <label className="block text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">{t.inputLabel}</label>
                      <div className="text-xs sm:text-sm text-gray-600 text-center">
                        <strong>{t.totalFields}</strong> {modelFeatures.length}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {modelFeatures.map((featKey) => {
                          const isHovered = hoveredField === featKey;
                          const isFocused = focusedField === featKey;
                          const constraints = getRangeConstraints(featKey, dataset, fieldsData, currentSampleData);
                          const explanation = getExplanation(featKey);
                          const currentValue = inputData[featKey];
                          const showExplanation = !isFocused && isHovered;
                          return (
                            <div key={featKey} className="space-y-2 sm:space-y-3 relative">
                              <label className="block text-xs sm:text-sm font-semibold text-gray-700 truncate">
                                {getLabel(featKey)}
                              </label>
                              <div 
                                className={`relative w-full ${showExplanation ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}
                                onMouseEnter={() => setHoveredField(featKey)}
                                onMouseLeave={() => setHoveredField(null)}
                              >
                                {showExplanation ? (
                                  <div 
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm cursor-pointer select-none text-center leading-relaxed"
                                    onClick={() => setFocusedField(featKey)}
                                  >
                                    {explanation}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    step={constraints.step || 'any'}
                                    min={constraints.min}
                                    max={constraints.max}
                                    value={isFocused ? (currentValue === '' ? '' : String(currentValue || 0)) : ''}
                                    onChange={(e) => handleInputChange(featKey, e.target.value)}
                                    onFocus={() => setFocusedField(featKey)}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder={String(currentSampleData[featKey] || 0)}
                                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm sm:text-base"
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 - Results - Responsive */}
                {currentStep === 2 && predictResult && (
                  <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-50 rounded-xl">
                    <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">✅</div>
                    <div className="w-full max-w-5xl p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-md space-y-4 sm:space-y-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">{t.step3Title}</h3>
                      <div className="bg-gradient-to-br from-green-400 to-teal-500 text-white p-4 sm:p-6 rounded-xl text-center shadow-md">
                        <p className="text-xs sm:text-sm opacity-90">{t.prediction}</p>
                        <p className="text-2xl sm:text-3xl font-bold mt-1">{predictResult.result.prediction}</p>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">{t.confidence} {(predictResult.result.confidence * 100).toFixed(2)}%</p>
                      </div>
                      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg border border-gray-200">
                        <strong className="text-orange-600 mb-2 block text-sm sm:text-base">{t.probabilities}</strong>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                          {Object.entries(predictResult.result.probabilities)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cls, prob]) => (
                              <li key={cls} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-3 bg-white rounded-lg gap-2">
                                <span className="font-medium">{cls}</span>
                                <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                                  <div className="flex-1 sm:w-20 bg-gray-200 rounded-full h-2 sm:h-3">
                                    <div
                                      className="bg-green-400 rounded-full h-2 sm:h-3"
                                      style={{ width: `${prob * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-bold text-green-500">{(prob * 100).toFixed(2)}%</span>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div className="text-center mt-3 sm:mt-4 text-gray-600">
                        <strong className="text-orange-600 text-base sm:text-lg">{t.modelUsed}</strong> {predictResult.model_name}
                      </div>
                      <div className="text-center">
                        <button className="px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-xs sm:text-sm font-semibold shadow-md">
                          {t.preprocess}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Footer - Responsive */}
            <div className="bg-white border-t border-gray-200 px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 shrink-0">
              <button
                onClick={currentStep > 0 ? handlePrevStep : handleCloseModal}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all text-xs sm:text-sm font-semibold shadow-md"
              >
                ← {t.prev}
              </button>

              {error && (
                <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-orange-100 border border-orange-300 rounded-lg text-orange-600 text-xs sm:text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <div className="w-full sm:w-auto">
                {currentStep === 0 && (
                  <button
                    onClick={handleNextStep0}
                    disabled={!selectedModel || loadingFeatures}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center"
                  >
                    {loadingFeatures ? (
                      <>
                        <span className="mr-2 animate-spin">⏳</span>
                        {t.loadingFeatures}
                      </>
                    ) : (
                      `${t.nextButtonStep1} →`
                    )}
                  </button>
                )}
                {currentStep === 1 && (
                  <button
                    onClick={handlePredict}
                    disabled={loading || modelFeatures.length === 0}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <span className="mr-2 animate-spin">⏳</span>
                        {t.loading}
                      </>
                    ) : (
                      `${t.predictButtonStep2} 🔮`
                    )}
                  </button>
                )}
                {currentStep === 2 && (
                  <button
                    onClick={handleCloseModal}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all text-xs sm:text-sm font-semibold shadow-md"
                  >
                    {t.closeButton}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
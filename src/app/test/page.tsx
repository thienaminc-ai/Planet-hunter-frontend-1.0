'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { exoplanetAPI, PredictResponse, ListModelsResponse, ModelFeaturesResponse } from '../services/api';
import keplerData from '../../../kepler-fields.json';
import tessData from '../../../tess-fields.json';
import sampleData from '../../../sample-data.json'; // Import file JSON chứa sample cho cả kepler và tess

interface InputData {
  [key: string]: number | '';
}

interface FieldsExplanation {
  vi: string;
  en: string;
  type: string;
}

type FieldsData = Record<string, FieldsExplanation>;

export default function TestPage() {
  const [dataset, setDataset] = useState<'kepler' | 'tess' | null>(null);
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [models, setModels] = useState<string[]>([]);
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

  const fieldsData: FieldsData = dataset === 'kepler' 
    ? (keplerData as FieldsData) 
    : dataset === 'tess' 
    ? (tessData as FieldsData) 
    : {};

  // Lấy sample data cho dataset hiện tại (cast to unknown first to avoid TS error)
  const currentSampleData = ((sampleData as unknown) as { [key: string]: Record<string, number | string> })[dataset || 'kepler'];

  // Lấy features từ keys của sample data (filter dựa trên fieldsData type và chỉ numeric values) - dùng làm fallback
  const getFeatureFields = (sample: Record<string, number | string>) => Object.keys(sample).filter(key => 
    ['numeric', 'important', 'mandatory'].includes(fieldsData[key]?.type || '') && typeof sample[key] === 'number'
  );

  const featureFields = getFeatureFields(currentSampleData);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = {
    title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
    description: language === 'vi' ? 'Chọn bộ dữ liệu và mô hình để dự đoán hành tinh ngoài.' : 'Select dataset and model to predict exoplanets.',
    testButton: language === 'vi' ? 'Bắt đầu Kiểm thử' : 'Start Testing',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    preprocess: language === 'vi' ? 'Quay lại: Tiền xử lý' : 'Back to Preprocess',
    prev: language === 'vi' ? 'Quay lại' : 'Back',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang dự đoán...' : 'Predicting...',
    selectDatasetTitle: language === 'vi' ? 'Chọn Bộ Dữ Liệu' : 'Select Dataset',
    step1Title: language === 'vi' ? 'Bước 1: Chọn mô hình' : 'Step 1: Select Model',
    step2Title: language === 'vi' ? 'Bước 2: Nhập dữ liệu' : 'Step 2: Input Data',
    step3Title: language === 'vi' ? 'Bước 3: Kết quả dự đoán' : 'Step 3: Prediction Results',
    modelLabel: language === 'vi' ? 'Mô hình:' : 'Model:',
    modelPlaceholder: language === 'vi' ? 'Chọn mô hình' : 'Select model',
    nextButtonStep1: language === 'vi' ? 'Tiếp theo' : 'Next',
    predictButtonStep2: language === 'vi' ? 'Dự đoán' : 'Predict',
    closeButton: language === 'vi' ? 'Đóng' : 'Close',
    prediction: language === 'vi' ? 'Dự đoán:' : 'Prediction:',
    confidence: language === 'vi' ? 'Độ tin cậy:' : 'Confidence:',
    probabilities: language === 'vi' ? 'Xác suất các lớp:' : 'Class Probabilities:',
    noModels: language === 'vi' ? 'Không tìm thấy mô hình.' : 'No models found.',
    inputLabel: language === 'vi' ? 'Dữ liệu đầu vào (raw - sẽ được xử lý tự động):' : 'Input Data (raw - auto-processed):',
    totalFields: language === 'vi' ? 'Tổng số trường:' : 'Total fields:',
    modelUsed: language === 'vi' ? 'Mô hình sử dụng:' : 'Model used:',
    errorSelect: language === 'vi' ? 'Vui lòng chọn mô hình.' : 'Please select a model.',
    loadingFeatures: language === 'vi' ? 'Đang tải đặc trưng mô hình...' : 'Loading model features...',
  };

  useEffect(() => {
    if (dataset) {
      const fetchModels = async () => {
        try {
          const response: ListModelsResponse = await exoplanetAPI.listModels(dataset);
          if (response.status === 'success' && response.models.length > 0) {
            setModels(response.models);
            setSelectedModel(response.models[0]);
          } else {
            // Fallback to demo
            setModels([`${dataset}_demo`]);
            setSelectedModel(`${dataset}_demo`);
            setError(response.message || t.noModels);
          }
        } catch (err) {
          // Fallback to demo nếu error
          setModels([`${dataset}_demo`]);
          setSelectedModel(`${dataset}_demo`);
          const errorMessage = err instanceof Error ? err.message : 'Không thể lấy danh sách mô hình.';
          setError(errorMessage);
        }
      };
      fetchModels();
    }
  }, [dataset, t.noModels]);

  const fetchModelFeatures = async (modelName: string): Promise<boolean> => {
    if (!dataset) {
      setError('Dataset not selected.');
      return false;
    }
    const isDemo = modelName === `${dataset}_demo`;

    setLoadingFeatures(true);
    setError(null);
    try {
      let features: string[] = [];
      if (!isDemo) {
        // Call API để lấy chính xác features của model
        const response: ModelFeaturesResponse = await exoplanetAPI.modelFeatures({ model_name: modelName, dataset });
        console.log('Model features API response:', response); // Debug
        if (response.status === 'success') {
          features = response.features || [];
        } else {
        }
      } else {
        // Demo: dùng featureFields từ sample
        features = featureFields;
      }

      // Set model features từ API (hoặc fallback)
      setModelFeatures(features);

      // Defaults từ sample (nếu có), else 0
      const defaults = features.reduce((acc: InputData, featKey: string) => {
        const sampleValue = currentSampleData[featKey];
        acc[featKey] = typeof sampleValue === 'number' ? sampleValue : 0;
        return acc;
      }, {});
      setInputData(defaults);
      console.log('Set model features:', features); // Debug
      console.log('Set input defaults:', defaults); // Debug
      return true;
    } catch (err) {
      console.error('Fetch model features error:', err); // Debug
      setError((err as Error).message || 'Không thể lấy thông tin mô hình.');
      // Fallback về featureFields nếu API fail
      setModelFeatures(featureFields);
      const defaults = featureFields.reduce((acc: InputData, featKey: string) => {
        const sampleValue = currentSampleData[featKey];
        acc[featKey] = typeof sampleValue === 'number' ? sampleValue : 0;
        return acc;
      }, {});
      setInputData(defaults);
      return false;
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    if (value === '') {
      setInputData(prev => ({ ...prev, [key]: '' }));
    } else {
      const num = Number(value);
      if (isNaN(num)) {
        setInputData(prev => ({ ...prev, [key]: '' }));
      } else {
        setInputData(prev => ({ ...prev, [key]: num }));
      }
    }
  };

  const handlePredict = async () => {
    if (!dataset) {
      setError('Dataset not selected.');
      return;
    }
    if (!selectedModel || modelFeatures.length === 0) {
      setError(t.errorSelect);
      return;
    }

    console.log('handlePredict triggered', { dataset, selectedModel, inputData }); // Debug log

    const isDemo = selectedModel === `${dataset}_demo`;
    if (isDemo) {
      // Mock prediction cho demo
      const mockResult: PredictResponse = {
        status: 'success',
        message: `Mock prediction for ${dataset.toUpperCase()} demo.`,
        model_name: `${dataset}_demo`,
        result: {
          prediction: 'CONFIRMED',
          confidence: 0.92,
          probabilities: { 'CONFIRMED': 0.92, 'CANDIDATE': 0.05, 'FALSE POSITIVE': 0.03 }
        }
      };
      setPredictResult(mockResult);
      setCurrentStep(2);
      return;
    }

    const validInput = modelFeatures.reduce((acc, featKey) => {
      const val = inputData[featKey];
      acc[featKey] = (val !== '' && typeof val === 'number' && !isNaN(val)) 
        ? val 
        : (typeof currentSampleData[featKey] === 'number' ? currentSampleData[featKey] : 0);
      return acc;
    }, {} as Record<string, number>);

    setLoading(true);
    setError(null);
    try {
      console.log('Sending predict request', { model_name: selectedModel, input_data: validInput, dataset }); // Debug log
      const result: PredictResponse = await exoplanetAPI.predictModel({
        model_name: selectedModel,
        input_data: validInput,
        dataset,
      });
      console.log('Predict response received', result); // Debug log
      if (result.status === 'success') {
        setPredictResult(result);
        setCurrentStep(2);
      } else {
        setError(result.message || 'Dự đoán thất bại.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể dự đoán.';
      console.error('Predict error', err); // Debug error
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
    const langKey = language as keyof FieldsExplanation;
    return fieldsData[key]?.[langKey] || key;
  };

  const getExplanation = (key: string): string => {
    // Explanation từ fieldsData, nhưng vì vi/en là label, dùng label vi/en làm explanation nếu không có riêng
    const langKey = language as keyof FieldsExplanation;
    return fieldsData[key]?.[langKey] || '';
  };

  const handleCloseModal = () => {
    setShowStepModal(false);
    setCurrentStep(0);
    setSelectedModel('');
    setModelFeatures([]);
    setInputData({});
    setPredictResult(null);
    setError(null);
  };

  const descriptionText = language === 'vi' 
    ? (dataset ? `Chọn mô hình và nhập dữ liệu để dự đoán hành tinh ngoài từ ${dataset.toUpperCase()}.` : 'Chọn bộ dữ liệu để kiểm thử mô hình.')
    : (dataset ? `Select model and input data for exoplanet prediction from ${dataset?.toUpperCase()}.` : 'Select dataset to test model.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100 flex flex-col font-sans relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <header className="relative flex justify-between items-center p-4 sm:p-6 bg-gray-800/80 backdrop-blur-md border-b border-gray-600 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">🪐</span>
          <h2 className="text-2xl font-bold text-indigo-300">{dataset ? `${dataset.toUpperCase()} Exoplanet Hunter` : 'Exoplanet Hunter'}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-indigo-400 hover:text-indigo-200 font-medium transition-colors">
            {t.back}
          </Link>
          <Link href={`/preprocess?dataset=${dataset || 'kepler'}`} className="text-indigo-400 hover:text-indigo-200 font-medium transition-colors">
            {t.preprocess}
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 text-sm font-medium shadow-md"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-8 max-w-2xl">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-lg text-gray-300">
            {descriptionText}
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <button
            onClick={() => setShowDatasetModal(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center"
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
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-center font-medium text-sm">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Modal chọn dataset (tess/kepler) - Horizontal Layout */}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl flex flex-col items-center shadow-2xl">
            <h2 className="text-3xl font-bold text-gray-100 mb-8">{t.selectDatasetTitle}</h2>
            <div className="grid grid-cols-2 gap-6 w-full">
              <button
                onClick={() => {
                  setDataset('kepler');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-12 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Kepler
              </button>
              <button
                onClick={() => {
                  setDataset('tess');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-purple-500 to-pink-600 text-white px-8 py-12 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                TESS
              </button>
            </div>
            <button
              onClick={() => setShowDatasetModal(false)}
              className="mt-8 px-6 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all text-sm font-semibold"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      )}

      {/* Modal từng bước - Wider, taller */}
      {showStepModal && dataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-7xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-600">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">
                  {currentStep === 0 ? t.step1Title : currentStep === 1 ? t.step2Title : t.step3Title}
                </h2>
                <p className="text-sm text-gray-400 mt-1">Bước {currentStep + 1}/3</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-300 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {currentStep === 0 && (
              <div className="w-full flex flex-col items-center py-8 bg-gray-700 rounded-xl">
                <div className="text-5xl mb-6">🔭</div>
                <div className="w-full max-w-2xl p-6 bg-gray-800 rounded-xl border border-gray-600 shadow-md">
                  <label className="block text-base font-semibold mb-4 text-gray-300">{t.modelLabel}</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-base"
                    disabled={models.length === 0}
                  >
                    <option value="">{t.modelPlaceholder}</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  {models.length === 0 && (
                    <div className="mt-4 text-sm text-red-400 text-center">{t.noModels}</div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="w-full flex flex-col items-center py-8 bg-gray-700 rounded-xl">
                <div className="text-5xl mb-6">📡</div>
                <div className="w-full max-w-6xl p-6 bg-gray-800 rounded-xl border border-gray-600 shadow-md space-y-6">
                  <label className="block text-base font-semibold mb-4 text-gray-300">{t.inputLabel}</label>
                  <div className="text-sm text-gray-400 text-center">
                    <strong>{t.totalFields}</strong> {modelFeatures.length}
                  </div>
                  {modelFeatures.length === 0 ? (
                    <div className="text-center text-red-400">{t.noModels}</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[70vh] overflow-y-auto pr-2">
                      {modelFeatures.map((featKey) => (
                        <div key={featKey} className="space-y-1">
                          <label 
                            className="block text-xs font-medium text-gray-300 truncate cursor-help" 
                            title={getExplanation(featKey)}
                          >
                            {getLabel(featKey)}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={inputData[featKey] === '' ? '' : String(inputData[featKey] || 0)}
                            onChange={(e) => handleInputChange(featKey, e.target.value)}
                            placeholder={String(currentSampleData[featKey] || 0)}
                            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && predictResult && (
              <div className="w-full flex flex-col items-center py-8 bg-gray-700 rounded-xl overflow-y-auto max-h-[70vh]">
                <div className="text-5xl mb-6">✅</div>
                <div className="w-full max-w-5xl p-6 bg-gray-800 rounded-xl border border-gray-600 shadow-md space-y-6">
                  <h3 className="text-2xl font-bold text-gray-100 mb-4 text-center">{t.step3Title}</h3>
                  
                  <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-6 rounded-xl text-center shadow-md">
                    <p className="text-sm opacity-90">{t.prediction}</p>
                    <p className="text-3xl font-bold mt-1">{predictResult.result.prediction}</p>
                    <p className="text-sm opacity-90 mt-1">{t.confidence} {(predictResult.result.confidence * 100).toFixed(2)}%</p>
                  </div>

                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <strong className="text-indigo-300 mb-2 block">{t.probabilities}</strong>
                    <ul className="space-y-2 text-sm text-gray-300">
                      {Object.entries(predictResult.result.probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cls, prob]) => (
                          <li key={cls} className="flex justify-between items-center p-3 bg-gray-600 rounded-lg">
                            <span className="font-medium">{cls}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-20 bg-gray-400/20 rounded-full h-3">
                                <div
                                  className="bg-green-400 rounded-full h-3"
                                  style={{ width: `${prob * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-green-400">{(prob * 100).toFixed(2)}%</span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="text-center mt-4 text-gray-300">
                    <strong className="text-indigo-300 text-lg">{t.modelUsed}</strong> {predictResult.model_name}
                  </div>

                  <div className="text-center">
                    <Link href={`/preprocess?dataset=${dataset}`}>
                      <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md">
                        {t.preprocess}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-600 mt-4">
              <button
                onClick={currentStep > 0 ? handlePrevStep : handleCloseModal}
                className="px-6 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all text-sm font-semibold shadow-md"
              >
                ← {t.prev}
              </button>

              {error && (
                <div className="px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm font-medium">
                  {error}
                </div>
              )}

              {currentStep === 0 ? (
                <button
                  onClick={handleNextStep0}
                  disabled={!selectedModel || loadingFeatures}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-md flex items-center"
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
              ) : currentStep === 1 ? (
                <button
                  onClick={handlePredict}
                  disabled={loading || modelFeatures.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-md flex items-center"
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
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md"
                >
                  {t.closeButton}
                </button>
              )}
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
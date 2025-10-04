'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { exoplanetAPI } from '../services/api';
import keplerData from '../../../kepler-fields.json';
import tessData from '../../../tess-fields.json';

interface TrainResponse {
  status: string;
  message: string;
  model_name: string;
  model_path: string;
  best_params?: Record<string, string | number | string[]>;
  stats: {
    train_accuracy: number;
    test_accuracy: number;
    train_precision: number;
    test_precision: number;
    train_recall: number;
    test_recall: number;
    train_f1: number;
    test_f1: number;
    feature_importance: Record<string, number>;
  };
}

interface ListDatasetsResponse {
  status: string;
  datasets: string[];
  message: string;
}

interface ParamGrid {
  n_estimators?: number[];
  max_depth?: number[];
  min_samples_split?: number[];
  max_features?: string[];
  [key: string]: string | number | string[] | number[] | undefined;
}

interface FieldsExplanation {
  vi: string;
  en: string;
  type: string;
}

type FieldsData = Record<string, FieldsExplanation>;

export default function TrainPage() {
  const [dataset, setDataset] = useState<'kepler' | 'tess' | null>(null);
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [trainResult, setTrainResult] = useState<TrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [paramGrid, setParamGrid] = useState<ParamGrid>({
    n_estimators: [100, 200],
    max_depth: [8, 10],
    min_samples_split: [5, 10],
    max_features: ['sqrt'],
  });
  const [useCustomParams, setUseCustomParams] = useState(false);

  const fieldsData: FieldsData = dataset === 'kepler' 
    ? (keplerData as FieldsData) 
    : dataset === 'tess' 
    ? (tessData as FieldsData) 
    : {};

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = {
    title: language === 'vi' ? 'Huấn luyện Mô hình' : 'Model Training',
    description: language === 'vi' ? 'Chọn bộ dữ liệu và cấu hình tham số để huấn luyện mô hình.' : 'Select dataset and configure parameters to train model.',
    trainButton: language === 'vi' ? 'Bắt đầu Huấn luyện' : 'Start Training',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    preprocess: language === 'vi' ? 'Quay lại: Tiền xử lý' : 'Back to Preprocess',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang huấn luyện...' : 'Training...',
    selectDatasetTitle: language === 'vi' ? 'Chọn Bộ Dữ Liệu' : 'Select Dataset',
    step1Title: language === 'vi' ? 'Bước 1: Chọn bộ dữ liệu' : 'Step 1: Select Dataset',
    step2Title: language === 'vi' ? 'Bước 2: Cấu hình Tham số' : 'Step 2: Configure Parameters',
    step3Title: language === 'vi' ? 'Bước 3: Kết quả huấn luyện' : 'Step 3: Training Results',
    datasetNameLabel: language === 'vi' ? 'Bộ dữ liệu:' : 'Dataset:',
    datasetNamePlaceholder: language === 'vi' ? 'Chọn bộ dữ liệu' : 'Select dataset',
    trainButtonStep1: language === 'vi' ? 'Tiếp theo' : 'Next',
    trainButtonStep2: language === 'vi' ? 'Huấn luyện' : 'Train',
    closeButton: language === 'vi' ? 'Đóng' : 'Close',
    trainStats: language === 'vi' ? 'Thống kê huấn luyện:' : 'Training Statistics:',
    trainAccuracy: language === 'vi' ? 'Độ chính xác (Train):' : 'Train Accuracy:',
    testAccuracy: language === 'vi' ? 'Độ chính xác (Test):' : 'Test Accuracy:',
    trainPrecision: language === 'vi' ? 'Precision (Train):' : 'Train Precision:',
    testPrecision: language === 'vi' ? 'Precision (Test):' : 'Test Precision:',
    trainRecall: language === 'vi' ? 'Recall (Train):' : 'Train Recall:',
    testRecall: language === 'vi' ? 'Recall (Test):' : 'Test Recall:',
    trainF1: language === 'vi' ? 'F1-Score (Train):' : 'Train F1-Score:',
    testF1: language === 'vi' ? 'F1-Score (Test):' : 'Test F1-Score:',
    featureImportance: language === 'vi' ? 'Tầm quan trọng đặc trưng:' : 'Feature Importance:',
    modelCreated: language === 'vi' ? 'Mô hình đã tạo:' : 'Model created:',
    bestParams: language === 'vi' ? 'Tham số tốt nhất:' : 'Best Parameters:',
    noDatasets: language === 'vi' ? 'Không tìm thấy bộ dữ liệu.' : 'No datasets found.',
    useDefault: language === 'vi' ? 'Sử dụng mặc định' : 'Use Default',
    useCustom: language === 'vi' ? 'Tùy chỉnh' : 'Custom',
    nEstimators: language === 'vi' ? 'Số cây (n_estimators):' : 'Number of Trees (n_estimators):',
    maxDepth: language === 'vi' ? 'Độ sâu tối đa (max_depth):' : 'Max Depth (max_depth):',
    minSamplesSplit: language === 'vi' ? 'Số mẫu tối thiểu chia (min_samples_split):' : 'Min Samples Split (min_samples_split):',
    maxFeatures: language === 'vi' ? 'Tính năng tối đa (max_features):' : 'Max Features (max_features):',
    errorSelect: language === 'vi' ? 'Vui lòng chọn bộ dữ liệu.' : 'Please select a dataset.',
  };

  useEffect(() => {
    if (dataset) {
      const fetchDatasets = async () => {
        try {
          const response: ListDatasetsResponse = await exoplanetAPI.listDatasets(dataset);
          if (response.status === 'success') {
            setDatasets(response.datasets);
            if (response.datasets.length > 0) {
              setDatasetName(response.datasets[0]);
            }
          } else {
            setError(response.message);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Không thể lấy danh sách bộ dữ liệu.';
          setError(errorMessage);
        }
      };
      fetchDatasets();
    }
  }, [dataset]);

  const handleTrain = async () => {
    if (!datasetName || !dataset) {
      setError(t.errorSelect);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const modelName = `${datasetName}_model`;
      const payload = {
        dataset_name: datasetName,
        model_name: modelName,
        param_grid: useCustomParams ? paramGrid : undefined,
        dataset: dataset,
      };
      const result: TrainResponse = await exoplanetAPI.trainModel(payload);
      if (result.status === 'success') {
        setTrainResult(result);
        setCurrentStep(2);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể huấn luyện mô hình.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0 && !datasetName) {
      setError(t.errorSelect);
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const updateParam = (key: keyof ParamGrid, value: number[] | string[]) => {
    setParamGrid(prev => ({ ...prev, [key]: value }));
  };

  const getLabel = (key: string): string => {
    const langKey = language as keyof FieldsExplanation;
    return fieldsData[key]?.[langKey] || key;
  };

  const handleCloseModal = () => {
    setShowStepModal(false);
    setCurrentStep(0);
    setUseCustomParams(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-gray-100 flex flex-col font-sans relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 md:p-6 bg-gray-800/80 backdrop-blur-md border-b border-gray-600 z-10 shadow-sm space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-2xl sm:text-3xl">🪐</span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-300 truncate">{dataset ? `${dataset.toUpperCase()} Exoplanet Hunter` : 'Exoplanet Hunter'}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
          <Link href="/" className="text-indigo-400 hover:text-indigo-200 font-medium transition-colors text-sm sm:text-base px-2 py-1">
            {t.back}
          </Link>
          <Link href={`/preprocess?dataset=${dataset || 'kepler'}`} className="text-indigo-400 hover:text-indigo-200 font-medium transition-colors text-sm sm:text-base px-2 py-1">
            {t.preprocess}
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 text-xs sm:text-sm font-medium shadow-md flex-shrink-0"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4 md:px-6 lg:px-8 z-10">
        <div className="text-center mb-6 sm:mb-8 max-w-2xl w-full px-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            {t.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 px-2">
            {t.description}
          </p>
        </div>

        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6 px-2">
          <button
            onClick={() => setShowDatasetModal(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-lg sm:text-xl font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <span className="mr-2 animate-spin">⏳</span>
                {t.loading}
              </>
            ) : (
              t.trainButton
            )}
          </button>

          {error && (
            <div className="p-3 sm:p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-center font-medium text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Modal chọn dataset (tess/kepler) - Horizontal Layout */}
      {showDatasetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-2xl flex flex-col items-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8 text-center">{t.selectDatasetTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full">
              <button
                onClick={() => {
                  setDataset('kepler');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 sm:px-8 py-8 sm:py-12 rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 text-xl sm:text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 w-full"
              >
                Kepler
              </button>
              <button
                onClick={() => {
                  setDataset('tess');
                  setShowDatasetModal(false);
                  setShowStepModal(true);
                }}
                className="bg-gradient-to-br from-purple-500 to-pink-600 text-white px-4 sm:px-8 py-8 sm:py-12 rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 text-xl sm:text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 w-full"
              >
                TESS
              </button>
            </div>
            <button
              onClick={() => setShowDatasetModal(false)}
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all text-sm font-semibold w-full sm:w-auto"
            >
              {t.closeButton}
            </button>
          </div>
        </div>
      )}

      {/* Modal từng bước - Wider */}
      {showStepModal && dataset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 w-full max-w-4xl sm:max-w-6xl max-h-[95vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 pb-4 border-b border-gray-600 space-y-2 sm:space-y-0">
              <div className="w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-100">
                  {currentStep === 0 ? t.step1Title : currentStep === 1 ? t.step2Title : t.step3Title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Bước {currentStep + 1}/3</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-300 text-2xl sm:text-3xl font-bold transition-colors self-start sm:self-auto"
              >
                ×
              </button>
            </div>

            {currentStep === 0 && (
              <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-700 rounded-lg sm:rounded-xl">
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">📊</div>
                <div className="w-full max-w-sm sm:max-w-2xl p-4 sm:p-6 bg-gray-800 rounded-lg sm:rounded-xl border border-gray-600 shadow-md">
                  <label className="block text-sm sm:text-base font-semibold mb-4 text-gray-300 text-center sm:text-left">{t.datasetNameLabel}</label>
                  <select
                    value={datasetName}
                    onChange={(e) => setDatasetName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-sm sm:text-base"
                    disabled={datasets.length === 0}
                  >
                    <option value="">{t.datasetNamePlaceholder}</option>
                    {datasets.map((ds) => (
                      <option key={ds} value={ds}>
                        {ds}
                      </option>
                    ))}
                  </select>
                  {datasets.length === 0 && (
                    <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-red-400 text-center">{t.noDatasets}</div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-700 rounded-lg sm:rounded-xl">
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">⚙️</div>
                <div className="w-full max-w-sm sm:max-w-4xl p-4 sm:p-6 bg-gray-800 rounded-lg sm:rounded-xl border border-gray-600 shadow-md space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h3 className="text-base sm:text-lg font-bold text-gray-300 mb-2">{t.useDefault} / {t.useCustom}</h3>
                    <label className="flex items-center justify-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomParams}
                        onChange={(e) => setUseCustomParams(e.target.checked)}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      <span className="text-xs sm:text-sm text-gray-400">{t.useCustom}</span>
                    </label>
                  </div>

                  {useCustomParams && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-300">{t.nEstimators}</label>
                        <input
                          type="text"
                          value={paramGrid.n_estimators?.join(',') || ''}
                          onChange={(e) => updateParam('n_estimators', e.target.value.split(',').map(Number).filter(n => !isNaN(n)))}
                          placeholder="100,200"
                          className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-300">{t.maxDepth}</label>
                        <input
                          type="text"
                          value={paramGrid.max_depth?.join(',') || ''}
                          onChange={(e) => updateParam('max_depth', e.target.value.split(',').map(Number).filter(n => !isNaN(n)))}
                          placeholder="8,10"
                          className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-300">{t.minSamplesSplit}</label>
                        <input
                          type="text"
                          value={paramGrid.min_samples_split?.join(',') || ''}
                          onChange={(e) => updateParam('min_samples_split', e.target.value.split(',').map(Number).filter(n => !isNaN(n)))}
                          placeholder="5,10"
                          className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-xs sm:text-sm"
                        />
                      </div>
                      <div className="w-full">
                        <label className="block text-xs sm:text-sm font-semibold mb-2 text-gray-300">{t.maxFeatures}</label>
                        <select
                          multiple
                          value={paramGrid.max_features || []}
                          onChange={(e) => updateParam('max_features', Array.from(e.target.selectedOptions, option => option.value))}
                          className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-100 text-xs sm:text-sm"
                        >
                          <option value="sqrt">sqrt</option>
                          <option value="log2">log2</option>
                          <option value="auto">auto</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && trainResult && (
              <div className="w-full flex flex-col items-center py-6 sm:py-8 bg-gray-700 rounded-lg sm:rounded-xl overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">✅</div>
                <div className="w-full max-w-sm sm:max-w-5xl p-4 sm:p-6 bg-gray-800 rounded-lg sm:rounded-xl border border-gray-600 shadow-md space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-4 text-center">{t.trainStats}</h3>
                  
                  {trainResult.best_params && (
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-indigo-300 mb-2 block text-sm sm:text-base">{t.bestParams}</strong>
                      <ul className="text-xs sm:text-sm space-y-1 text-gray-300">
                        {Object.entries(trainResult.best_params).map(([key, value]) => (
                          <li key={key} className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <span className="mb-1 sm:mb-0">{key}:</span>
                            <span className="font-mono">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
                    <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl text-center shadow-md">
                      <p className="text-xs sm:text-sm opacity-90">{t.trainAccuracy}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{(trainResult.stats.train_accuracy * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 sm:p-6 rounded-lg sm:rounded-xl text-center shadow-md">
                      <p className="text-xs sm:text-sm opacity-90">{t.testAccuracy}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-1">{(trainResult.stats.test_accuracy * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.trainPrecision}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.train_precision * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.testPrecision}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.test_precision * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.trainRecall}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.train_recall * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.testRecall}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.test_recall * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.trainF1}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.train_f1 * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600">
                      <strong className="text-gray-300 text-sm">{t.testF1}</strong>
                      <p className="text-base sm:text-lg mt-1 text-gray-100 font-semibold">{(trainResult.stats.test_f1 * 100).toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="bg-gray-700 p-3 sm:p-4 rounded-lg border border-gray-600 max-h-48 sm:max-h-60 overflow-y-auto">
                    <strong className="text-gray-300 mb-2 block text-sm">{t.featureImportance}</strong>
                    <ul className="space-y-1 text-xs sm:text-sm text-gray-300">
                      {Object.entries(trainResult.stats.feature_importance)
                        .sort(([, a], [, b]) => b - a)
                        .map(([feature, importance]) => (
                          <li key={feature} className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <span className="truncate mb-1 sm:mb-0">{getLabel(feature)}</span>
                            <span className="font-bold text-indigo-400">{(importance * 100).toFixed(2)}%</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="text-center mt-3 sm:mt-4 text-gray-300">
                    <strong className="text-indigo-300 text-base sm:text-lg">{t.modelCreated}</strong> {trainResult.model_name}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 border-t border-gray-600 mt-4 space-y-2 sm:space-y-0 gap-2 sm:gap-0">
              <button
                onClick={currentStep > 0 ? handlePrevStep : handleCloseModal}
                className="px-4 sm:px-6 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-all text-xs sm:text-sm font-semibold shadow-md w-full sm:w-auto order-3 sm:order-1"
              >
                ← {currentStep === 1 ? t.step1Title : currentStep === 2 ? t.step2Title : t.back}
              </button>

              {error && (
                <div className="px-3 sm:px-4 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-xs sm:text-sm font-medium w-full sm:w-auto order-2">
                  {error}
                </div>
              )}

              {currentStep < 2 ? (
                <button
                  onClick={currentStep < 1 ? handleNextStep : handleTrain}
                  disabled={loading || (currentStep === 0 && !datasetName)}
                  className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center w-full sm:w-auto order-1 sm:order-3"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      {t.loading}
                    </>
                  ) : (
                    currentStep === 0 ? `${t.trainButtonStep1} →` : `${t.trainButtonStep2} ✓`
                  )}
                </button>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs sm:text-sm font-semibold shadow-md w-full sm:w-auto order-1 sm:order-3"
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
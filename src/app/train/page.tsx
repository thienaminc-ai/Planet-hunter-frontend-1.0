'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { exoplanetAPI } from '../services/api';

interface TrainResponse {
  status: string;
  message: string;
  model_name: string;
  model_path: string;
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

export default function TrainPage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [datasets, setDatasets] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [trainResult, setTrainResult] = useState<TrainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = {
    title: language === 'vi' ? 'Huấn luyện Mô hình' : 'Model Training',
    description: language === 'vi' ? 'Chọn bộ dữ liệu để huấn luyện mô hình phát hiện hành tinh.' : 'Select dataset to train exoplanet detection model.',
    trainButton: language === 'vi' ? 'Bắt đầu Huấn luyện' : 'Start Training',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    preprocess: language === 'vi' ? 'Quay lại: Tiền xử lý' : 'Back to Preprocess',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang huấn luyện...' : 'Training...',
    error: (msg: string) => language === 'vi' ? `Lỗi: ${msg}` : `Error: ${msg}`,
    step1Title: language === 'vi' ? 'Bước 1: Chọn bộ dữ liệu' : 'Step 1: Select Dataset',
    step2Title: language === 'vi' ? 'Bước 2: Kết quả huấn luyện' : 'Step 2: Training Results',
    datasetNameLabel: language === 'vi' ? 'Chọn bộ dữ liệu:' : 'Select Dataset:',
    datasetNamePlaceholder: language === 'vi' ? 'Chọn bộ dữ liệu' : 'Select dataset',
    trainButtonStep1: language === 'vi' ? 'Huấn luyện' : 'Train',
    closeButton: language === 'vi' ? 'Đóng' : 'Close',
    testButton: language === 'vi' ? 'Tiếp theo: Kiểm thử Mô hình' : 'Next: Test Model',
    trainStats: language === 'vi' ? 'Thống kê huấn luyện' : 'Training Statistics',
    trainAccuracy: language === 'vi' ? 'Độ chính xác (Train)' : 'Train Accuracy',
    testAccuracy: language === 'vi' ? 'Độ chính xác (Test)' : 'Test Accuracy',
    trainPrecision: language === 'vi' ? 'Precision (Train)' : 'Train Precision',
    testPrecision: language === 'vi' ? 'Precision (Test)' : 'Test Precision',
    trainRecall: language === 'vi' ? 'Recall (Train)' : 'Train Recall',
    testRecall: language === 'vi' ? 'Recall (Test)' : 'Test Recall',
    trainF1: language === 'vi' ? 'F1-Score (Train)' : 'Train F1-Score',
    testF1: language === 'vi' ? 'F1-Score (Test)' : 'Test F1-Score',
    featureImportance: language === 'vi' ? 'Tầm quan trọng đặc trưng' : 'Feature Importance',
    modelCreated: language === 'vi' ? 'Mô hình đã tạo' : 'Model Created',
    noDatasets: language === 'vi' ? 'Không tìm thấy bộ dữ liệu.' : 'No datasets found.',
  };

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response: ListDatasetsResponse = await exoplanetAPI.listDatasets();
        if (response.status === 'success') {
          setDatasets(response.datasets);
          if (response.datasets.length > 0) {
            setDatasetName(response.datasets[0]);
          }
        } else {
          setError(t.error(response.message));
        }
      } catch (err: any) {
        setError(t.error(err.message || 'Không thể lấy danh sách bộ dữ liệu.'));
      }
    };
    fetchDatasets();
  }, []);

  const handleTrain = async () => {
    if (!datasetName) {
      setError(t.error('Vui lòng chọn bộ dữ liệu.'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const modelName = `${datasetName}_model`;
      const result: TrainResponse = await exoplanetAPI.trainModel({
        dataset_name: datasetName,
        model_name: modelName,
      });
      if (result.status === 'success') {
        setTrainResult(result);
        setCurrentStep(1);
      }
    } catch (err: any) {
      setError(t.error(err.message || 'Không thể huấn luyện mô hình.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-950 to-purple-950 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Star particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="stars">
          <style jsx>{`
            .stars {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: transparent;
            }
            .stars::before,
            .stars::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.3)"/></svg>') repeat;
              animation: twinkle 20s linear infinite;
              opacity: 0.5;
            }
            .stars::after {
              animation-delay: -10s;
              opacity: 0.3;
              background-size: 3px 3px;
            }
            @keyframes twinkle {
              0% { opacity: 0.3; }
              50% { opacity: 0.6; }
              100% { opacity: 0.3; }
            }
          `}</style>
        </div>
      </div>

      <header className="relative flex justify-between items-center p-6 bg-black/30 backdrop-blur-lg border-b border-blue-600/20 z-10">
        <div className="flex items-center space-x-3">
          <span className="text-3xl animate-pulse">🌟</span>
          <h2 className="text-2xl font-bold text-purple-300">Exoplanet Hunter</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-purple-200 hover:text-purple-400 font-medium transition-colors">
            {t.back}
          </Link>
          <Link href="/preprocess" className="text-purple-200 hover:text-purple-400 font-medium transition-colors">
            {t.preprocess}
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-md"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-10 max-w-3xl">
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            {t.title}
          </h1>
          <p className="text-xl text-purple-200">
            {t.description}
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <button
            onClick={() => setShowModal(true)}
            disabled={loading || datasets.length === 0}
            className="w-full bg-purple-500 text-white px-8 py-4 rounded-lg hover:bg-purple-600 hover:scale-105 transition-all duration-300 text-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="mr-2 animate-spin">🌟</span>
                {t.loading}
              </>
            ) : (
              t.trainButton
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-600/20 border border-red-500/50 rounded-lg text-red-300 text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          {trainResult && !showModal && (
            <div className="p-6 bg-black/30 rounded-lg shadow-lg border border-green-600/30 backdrop-blur-sm overflow-y-auto max-h-[70vh]">
              <h3 className="text-xl font-bold text-green-300 mb-4 text-center">{t.trainStats}</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center shadow-lg">
                    <p className="text-sm opacity-90">{t.trainAccuracy}</p>
                    <p className="text-2xl font-bold mt-1">{(trainResult.stats.train_accuracy * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center shadow-lg">
                    <p className="text-sm opacity-90">{t.testAccuracy}</p>
                    <p className="text-2xl font-bold mt-1">{(trainResult.stats.test_accuracy * 100).toFixed(2)}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.trainPrecision}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.train_precision * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.testPrecision}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.test_precision * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.trainRecall}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.train_recall * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.testRecall}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.test_recall * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.trainF1}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.train_f1 * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/40 p-3 rounded-lg border border-green-600/50">
                    <strong className="text-green-300">{t.testF1}</strong>
                    <p className="text-sm mt-1">{(trainResult.stats.test_f1 * 100).toFixed(2)}%</p>
                  </div>
                </div>
                <div className="bg-black/40 p-3 rounded-lg border border-green-600/50 max-h-48 overflow-y-auto">
                  <strong className="text-green-300">{t.featureImportance}</strong>
                  <ul className="mt-2 space-y-2 text-sm">
                    {Object.entries(trainResult.stats.feature_importance)
                      .sort(([, a], [, b]) => b - a)
                      .map(([feature, importance]) => (
                        <li key={feature} className="flex justify-between items-center">
                          <span className="truncate">{feature}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-green-200/30 rounded-full h-2">
                              <div
                                className="bg-green-500 rounded-full h-2"
                                style={{ width: `${importance * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-green-400">{(importance * 100).toFixed(2)}%</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="text-center">
                  <strong className="text-green-300">{t.modelCreated}</strong> {trainResult.model_name}
                </div>
                <div className="flex justify-between space-x-4">
                  <Link href="/preprocess">
                    <button className="mt-4 w-full bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300 text-base font-semibold shadow-lg">
                      {t.preprocess}
                    </button>
                  </Link>
                  <Link href="/test">
                    <button className="mt-4 w-full bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-300 text-base font-semibold shadow-lg">
                      {t.testButton}
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 w-full max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col shadow-2xl border border-purple-600/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-purple-300">
                {currentStep === 0 ? t.step1Title : t.step2Title}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(0);
                }}
                className="text-gray-400 hover:text-white text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {currentStep === 0 && (
              <div className="w-full flex flex-col md:flex-row gap-6 py-8 bg-black/30 rounded-lg border border-blue-600/20">
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-5xl mb-4 animate-pulse">📊</div>
                  <p className="text-purple-200 text-center">
                    {language === 'vi' ? 'Chọn bộ dữ liệu từ danh sách bên phải để huấn luyện.' : 'Select a dataset from the right list to train.'}
                  </p>
                </div>
                <div className="flex-1 max-h-[50vh] overflow-y-auto">
                  {datasets.length === 0 ? (
                    <div className="text-center text-red-300">{t.noDatasets}</div>
                  ) : (
                    <div className="space-y-3">
                      {datasets.map((dataset) => (
                        <div
                          key={dataset}
                          onClick={() => setDatasetName(dataset)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            datasetName === dataset
                              ? 'bg-blue-600/50 border-blue-400'
                              : 'bg-black/40 border-blue-600/50 hover:bg-blue-500/30 hover:scale-105'
                          }`}
                        >
                          <p className="font-semibold text-purple-200">{dataset}</p>
                          <p className="text-sm text-purple-300/70">
                            {language === 'vi' ? 'Bộ dữ liệu sẵn sàng' : 'Ready dataset'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && trainResult && (
              <div className="w-full flex flex-col items-center py-8 bg-black/30 rounded-lg border border-green-600/20 overflow-y-auto max-h-[70vh]">
                <div className="text-5xl mb-6 text-green-300 animate-pulse">✅</div>
                <div className="w-full max-w-2xl p-6 bg-black/40 rounded-lg border border-green-600/50 shadow-xl space-y-6">
                  <h3 className="text-lg font-bold text-green-300 mb-4 text-center">{t.trainStats}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center shadow-lg">
                      <p className="text-sm opacity-90">{t.trainAccuracy}</p>
                      <p className="text-2xl font-bold mt-1">{(trainResult.stats.train_accuracy * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center shadow-lg">
                      <p className="text-sm opacity-90">{t.testAccuracy}</p>
                      <p className="text-2xl font-bold mt-1">{(trainResult.stats.test_accuracy * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.trainPrecision}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.train_precision * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.testPrecision}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.test_precision * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.trainRecall}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.train_recall * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.testRecall}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.test_recall * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.trainF1}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.train_f1 * 100).toFixed(2)}%</p>
                    </div>
                    <div className="bg-black/50 p-3 rounded-lg border border-green-600/50">
                      <strong className="text-green-300">{t.testF1}</strong>
                      <p className="text-sm mt-1">{(trainResult.stats.test_f1 * 100).toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="bg-black/50 p-3 rounded-lg border border-green-600/50 max-h-48 overflow-y-auto">
                    <strong className="text-green-300">{t.featureImportance}</strong>
                    <ul className="mt-2 space-y-2 text-sm">
                      {Object.entries(trainResult.stats.feature_importance)
                        .sort(([, a], [, b]) => b - a)
                        .map(([feature, importance]) => (
                          <li key={feature} className="flex justify-between items-center">
                            <span className="truncate">{feature}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-green-200/30 rounded-full h-2">
                                <div
                                  className="bg-green-500 rounded-full h-2"
                                  style={{ width: `${importance * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-green-400">{(importance * 100).toFixed(2)}%</span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="text-center">
                    <strong className="text-green-300">{t.modelCreated}</strong> {trainResult.model_name}
                  </div>
                  <div className="flex justify-between space-x-4">
                    <Link href="/preprocess">
                      <button className="mt-4 w-full bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300 text-base font-semibold shadow-lg">
                        {t.preprocess}
                      </button>
                    </Link>
                    <Link href="/test">
                      <button className="mt-4 w-full bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 hover:scale-105 transition-all duration-300 text-base font-semibold shadow-lg">
                        {t.testButton}
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-purple-600/20 mt-6">
              <button
                onClick={() => {
                  if (currentStep === 1) {
                    setCurrentStep(0);
                  } else {
                    setShowModal(false);
                    setCurrentStep(0);
                  }
                }}
                className="px-6 py-2 bg-gray-500/50 text-white rounded-lg hover:bg-gray-600/50 hover:scale-105 transition-all text-base font-semibold shadow-md"
              >
                ← {currentStep === 1 ? 'Quay lại' : t.back}
              </button>

              {error && (
                <div className="px-4 py-2 bg-red-600/20 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium animate-pulse">
                  {error}
                </div>
              )}

              {currentStep === 0 ? (
                <button
                  onClick={handleTrain}
                  disabled={loading || !datasetName}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base font-semibold shadow-md flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 animate-spin">🌟</span>
                      {t.loading}
                    </>
                  ) : (
                    `${t.trainButtonStep1} ✓`
                  )}
                </button>
              ) : (
                <Link href="/test">
                  <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all text-base font-semibold shadow-md">
                    {t.testButton}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
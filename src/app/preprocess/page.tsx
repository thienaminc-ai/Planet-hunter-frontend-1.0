'use client';
import { useState, useEffect, useMemo } from 'react';

interface Shape {
  rows: number;
  cols: number;
}
interface AnalyzeResponse {
  status: string;
  columns: string[];
  shape: Shape;
  dataset?: string;
}
interface CreateVariantStats {
  original_rows: number;
  final_rows: number;
  final_cols: number;
  flag_noise_dropped: number;
  outliers_dropped: number;
  total_noise_removed_pct: number;
  label_dist: Record<string, number>;
}
interface CreateVariantResponse {
  status: string;
  name: string;
  stats?: CreateVariantStats;
  dataset?: string;
}
interface FieldsExplanation {
  vi: string;
  en: string;
  type: string;
}
interface FieldsData {
  [key: string]: FieldsExplanation;
}

type TessLabel = 'FP' | 'PC' | 'KP' | 'APC' | 'FA' | 'CP' | 'UNKNOWN';

export default function PreprocessPage() {
  const [dataset, setDataset] = useState<'kepler' | 'tess' | null>(null);
  const [showDatasetModal, setShowDatasetModal] = useState(false);

  // Mock fields data
  const fieldsData = useMemo<FieldsData>(() => {
    if (dataset === 'kepler') {
      return {
        'pl_name': { vi: 'Tên hành tinh', en: 'Planet name', type: 'mandatory' },
        'hostname': { vi: 'Tên ngôi sao', en: 'Host star', type: 'mandatory' },
        'pl_masse': { vi: 'Khối lượng', en: 'Mass', type: 'important' },
        'pl_rade': { vi: 'Bán kính', en: 'Radius', type: 'important' },
        'pl_orbper': { vi: 'Chu kỳ quỹ đạo', en: 'Orbital period', type: 'important' },
        'st_teff': { vi: 'Nhiệt độ sao', en: 'Star temperature', type: 'normal' },
        'ra': { vi: 'Xích kinh', en: 'Right ascension', type: 'must_remove' },
        'dec': { vi: 'Xích vĩ', en: 'Declination', type: 'must_remove' },
      } as FieldsData;
    } else if (dataset === 'tess') {
      return {
        'tic_id': { vi: 'Mã TIC', en: 'TIC ID', type: 'mandatory' },
        'toi_id': { vi: 'Mã TOI', en: 'TOI ID', type: 'mandatory' },
        'pl_rade': { vi: 'Bán kính', en: 'Radius', type: 'important' },
        'pl_orbper': { vi: 'Chu kỳ', en: 'Period', type: 'important' },
        'st_tmag': { vi: 'Độ sáng TESS', en: 'TESS magnitude', type: 'normal' },
        'ra': { vi: 'Xích kinh', en: 'RA', type: 'must_remove' },
      } as FieldsData;
    }
    return {};
  }, [dataset]);

  const mandatoryColumns = useMemo(
    () => (dataset ? Object.keys(fieldsData).filter((key: string) => fieldsData[key].type === 'mandatory') : []),
    [dataset, fieldsData]
  );
  const mustRemoveColumns = useMemo(
    () => (dataset ? Object.keys(fieldsData).filter((key: string) => fieldsData[key].type === 'must_remove') : []),
    [dataset, fieldsData]
  );
  const importantColumns = useMemo(
    () => (dataset ? Object.keys(fieldsData).filter((key: string) => fieldsData[key].type === 'important') : []),
    [dataset, fieldsData]
  );

  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [removedColumns, setRemovedColumns] = useState<string[]>([]);
  const [datasetName, setDatasetName] = useState('');
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [stats, setStats] = useState<CreateVariantStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [removeOutliers, setRemoveOutliers] = useState(false);
  const [showOutlierConfirm, setShowOutlierConfirm] = useState(false);

  const [stars, setStars] = useState<{ top: number; left: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const generatedStars = [...Array(50)].map(() => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 3,
    }));
    setStars(generatedStars);
  }, []);

  useEffect(() => {
    if (analyzeData && dataset && analyzeData.columns && mustRemoveColumns.length > 0) {
      const initialRemoved = mustRemoveColumns.filter(col => analyzeData.columns.includes(col));
      setRemovedColumns(initialRemoved);
    }
  }, [analyzeData, mustRemoveColumns, dataset]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const baseT = {
    title: language === 'vi' ? 'Tiền Xử Lý Dữ Liệu' : 'Data Preprocessing',
    subtitle: language === 'vi' ? 'Khám phá và xử lý dữ liệu ngoại hành tinh từ vũ trụ sâu thẳm' : 'Explore and process exoplanet data from deep space',
    startButton: language === 'vi' ? 'Bắt Đầu Phân Tích' : 'Start Analysis',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang phân tích...' : 'Analyzing...',
    step1: language === 'vi' ? 'Chọn Trường Dữ Liệu' : 'Select Data Fields',
    step2: language === 'vi' ? 'Cấu Hình Dataset' : 'Configure Dataset',
    step3: language === 'vi' ? 'Hoàn Thành' : 'Complete',
    allFields: language === 'vi' ? 'Tất Cả Trường' : 'All Fields',
    selectedFields: language === 'vi' ? 'Trường còn lại' : 'Remaining Fields',
    importantLabel: language === 'vi' ? 'Quan trọng' : 'Important',
    mustRemove: language === 'vi' ? 'Bắt buộc bỏ' : 'Must Remove',
    datasetName: language === 'vi' ? 'Tên Dataset' : 'Dataset Name',
    namePlaceholder: language === 'vi' ? 'VD: dataset_clean_v1' : 'e.g., dataset_clean_v1',
    removeOutliers: language === 'vi' ? 'Loại bỏ Outliers (IQR)' : 'Remove Outliers (IQR)',
    nextStep: language === 'vi' ? 'Tiếp Theo' : 'Next',
    create: language === 'vi' ? 'Tạo Dataset' : 'Create Dataset',
    processing: language === 'vi' ? 'Đang xử lý...' : 'Processing...',
    success: language === 'vi' ? 'Thành Công!' : 'Success!',
    originalRows: language === 'vi' ? 'Số hàng gốc' : 'Original Rows',
    finalRows: language === 'vi' ? 'Số hàng cuối' : 'Final Rows',
    columns: language === 'vi' ? 'Số cột' : 'Columns',
    noiseRemoved: language === 'vi' ? 'Nhiễu loại bỏ' : 'Noise Removed',
    flagNoise: language === 'vi' ? 'Nhiễu cờ' : 'Flag Noise',
    outliers: language === 'vi' ? 'Outliers' : 'Outliers',
    labelDist: language === 'vi' ? 'Phân Bố Nhãn' : 'Label Distribution',
    trainModel: language === 'vi' ? 'Huấn Luyện Mô Hình' : 'Train Model',
    autoRemoved: language === 'vi' ? 'tự động bỏ' : 'auto-removed',
    fields: language === 'vi' ? 'trường' : 'fields',
    noSelection: language === 'vi' ? 'Chưa chọn trường nào' : 'No fields selected',
    selectAtLeast: language === 'vi' ? 'Vui lòng chọn ít nhất 1 trường' : 'Please select at least 1 field',
    enterName: language === 'vi' ? 'Vui lòng nhập tên dataset' : 'Please enter dataset name',
    outlierWarning: language === 'vi'
      ? 'Việc bỏ outlier sẽ khiến data sạch hơn nhưng bị giảm đi số lượng khác nhiều. ⚠️ Không khuyến cáo.'
      : 'Removing outliers will clean data but reduce samples significantly. ⚠️ Not recommended.',
    confirm: language === 'vi' ? 'Xác Nhận' : 'Confirm',
    cancel: language === 'vi' ? 'Hủy' : 'Cancel',
    selectDataset: language === 'vi' ? 'Chọn Bộ Dữ Liệu' : 'Select Dataset',
    selectDatasetPrompt: language === 'vi' ? 'Vui lòng chọn bộ dữ liệu:' : 'Please select a dataset:',
    keplerOption: language === 'vi' ? 'Kepler - Dữ liệu Kepler' : 'Kepler - Kepler Data',
    tessOption: language === 'vi' ? 'TESS - Dữ liệu TESS' : 'TESS - TESS Data',
  };

  const t = baseT;

  const getExplanation = (col: string): string => {
    return fieldsData[col]?.[language] || (language === 'vi' ? 'Thông tin bổ sung' : 'Additional info');
  };

  const handleCreateVariant = () => {
    setShowDatasetModal(true);
    setError(null);
  };

  const handleDatasetSelection = async (selectedDataset: 'kepler' | 'tess') => {
    setDataset(selectedDataset);
    setLoading(true);
    setError(null);
    
    // Mock API call
    setTimeout(() => {
      const mockData: AnalyzeResponse = {
        status: 'success',
        columns: Object.keys(fieldsData),
        shape: { rows: 5000, cols: Object.keys(fieldsData).length },
        dataset: selectedDataset
      };
      setAnalyzeData(mockData);
      setDatasetName('');
      setCurrentStep(0);
      setShowDatasetModal(false);
      setShowModal(true);
      setLoading(false);
    }, 1000);
  };

  const toggleRemoveColumn = (col: string): void => {
    if (mandatoryColumns.includes(col) || mustRemoveColumns.includes(col)) return;
    setRemovedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const displayColumns: string[] = analyzeData ? analyzeData.columns.filter((col: string) => !mandatoryColumns.includes(col) && !mustRemoveColumns.includes(col)) : [];
  const remainingColumns: string[] = analyzeData ? analyzeData.columns.filter((col: string) => !removedColumns.includes(col) && !mustRemoveColumns.includes(col)) : [];

  const handleNextStep = (): void => {
    if (remainingColumns.length === 0) {
      setError(t.selectAtLeast);
      return;
    }
    setSelectedColumns(remainingColumns);
    setCurrentStep(1);
    setError(null);
  };

  const handleProcess = async (): Promise<void> => {
    if (!datasetName.trim()) {
      setError(t.enterName);
      return;
    }
    setLoading(true);
    setError(null);
    
    // Mock API call
    setTimeout(() => {
      const mockStats: CreateVariantStats = {
        original_rows: 5000,
        final_rows: 4500,
        final_cols: selectedColumns.length,
        flag_noise_dropped: 300,
        outliers_dropped: removeOutliers ? 200 : 0,
        total_noise_removed_pct: 10,
        label_dist: dataset === 'tess' 
          ? { '0': 40, '1': 30, '2': 20, '3': 10 }
          : { '0': 50, '1': 50 }
      };
      setCreatedName(datasetName);
      setStats(mockStats);
      setCurrentStep(2);
      setLoading(false);
    }, 1500);
  };

  const handleOutlierToggle = () => {
    setShowOutlierConfirm(true);
  };

  const confirmOutlier = () => {
    setRemoveOutliers(true);
    setShowOutlierConfirm(false);
  };

  const cancelOutlier = () => {
    setRemoveOutliers(false);
    setShowOutlierConfirm(false);
  };

  const getLabelDisplay = (label: string | number) => {
    if (dataset === 'tess') {
      const labelMap: Record<TessLabel, string> = {
        'FP': language === 'vi' ? 'Nhầm Lẫn Sai' : 'False Positive',
        'PC': language === 'vi' ? 'Ứng Viên Hành Tinh' : 'Planet Candidate',
        'KP': language === 'vi' ? 'Hành Tinh Đã Biết' : 'Known Planet',
        'APC': language === 'vi' ? 'Ứng Viên Xác Nhận' : 'Affirmed Candidate',
        'FA': language === 'vi' ? 'Cảnh Báo Sai' : 'False Alarm',
        'CP': language === 'vi' ? 'Hành Tinh Xác Nhận' : 'Confirmed Planet',
        'UNKNOWN': language === 'vi' ? 'Không Xác Định' : 'Unknown',
      };
      const labelMapping: Record<number, TessLabel> = {
        0: 'FP', 1: 'PC', 2: 'KP', 3: 'APC', 4: 'FA', 5: 'CP',
      };
      const mappedLabel = typeof label === 'number' ? labelMapping[label as number] : label;
      return labelMap[mappedLabel as TessLabel] || label.toString();
    }
    return label.toString();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated cosmic background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/20 to-purple-950/30"></div>
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-70"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              animation: `twinkle ${star.duration}s infinite`,
              animationDelay: `${star.delay}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-xl bg-black/40 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-lg sm:text-2xl">
              🪐
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {dataset === 'tess' ? 'TESS Hunter' : dataset === 'kepler' ? 'Kepler Hunter' : 'Exoplanet Hunter'}
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400">Data Processing</p>
            </div>
          </div>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600/20 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-all text-xs sm:text-sm font-medium"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {!showModal && !showDatasetModal && (
          <div className="text-center mb-8 sm:mb-16">
            <div className="inline-block mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shadow-purple-500/30 animate-pulse">
                🌌
              </div>
            </div>
            <h1 className="text-3xl sm:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent px-4">
              {t.title}
            </h1>
            <p className="text-base sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              {t.subtitle}
            </p>

            <button
              onClick={handleCreateVariant}
              disabled={loading}
              className="px-8 sm:px-12 py-3 sm:py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all duration-300 text-base sm:text-lg font-semibold shadow-2xl shadow-purple-500/30 disabled:opacity-50"
            >
              <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                <span>{loading ? t.loading : t.startButton}</span>
                {!loading && <span className="text-xl sm:text-2xl">→</span>}
              </span>
            </button>

            {error && (
              <div className="mt-6 sm:mt-8 max-w-md mx-auto p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dataset Selection Modal */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-2xl shadow-2xl border border-purple-500/20 p-6 sm:p-12 flex flex-col items-center">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 text-purple-400 animate-pulse">🪐</div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3 sm:mb-4 text-center">
              {t.selectDataset}
            </h2>
            <p className="text-gray-400 mb-6 sm:mb-8 text-center max-w-xl text-sm sm:text-base px-4">{t.selectDatasetPrompt}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl">
              <button
                onClick={() => handleDatasetSelection('kepler')}
                className="p-4 sm:p-6 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-800/40 hover:to-blue-800/40 transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🔭</div>
                <h3 className="text-lg sm:text-xl font-bold text-purple-300 mb-2">{t.keplerOption}</h3>
                <p className="text-xs sm:text-sm text-gray-400">High-precision photometry</p>
              </button>
              <button
                onClick={() => handleDatasetSelection('tess')}
                className="p-4 sm:p-6 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl border border-blue-500/30 hover:bg-gradient-to-br hover:from-blue-800/40 hover:to-indigo-800/40 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
              >
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🛰️</div>
                <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-2">{t.tessOption}</h3>
                <p className="text-xs sm:text-sm text-gray-400">All-sky survey</p>
              </button>
            </div>
            <button
              onClick={() => setShowDatasetModal(false)}
              className="mt-6 sm:mt-8 px-4 sm:px-6 py-2 sm:py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all font-medium border border-gray-700 text-sm sm:text-base"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Step Modal */}
      {showModal && analyzeData && dataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-7xl my-4 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-xl sm:rounded-2xl shadow-2xl border border-purple-500/20 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            {/* Header */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-purple-500/20 bg-black/40 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {currentStep === 0 ? t.step1 : currentStep === 1 ? t.step2 : t.step3}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setCurrentStep(0);
                  }}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-800/50 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-xl sm:text-2xl text-gray-400 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Progress Steps - Responsive */}
              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                {[0, 1, 2].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all text-xs sm:text-base ${
                      currentStep === step 
                        ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50 scale-110' 
                        : currentStep > step 
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50' 
                        : 'bg-gray-800/50 text-gray-500 border-2 border-gray-700'
                    }`}>
                      {currentStep > step ? '✓' : step + 1}
                    </div>
                    {step < 2 && (
                      <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded ${
                        currentStep > step ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gray-700'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              {currentStep === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* All Fields */}
                  <div className="lg:col-span-2 bg-black/20 rounded-xl border border-purple-500/20 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-purple-300">
                        <span className="mr-2">📋</span> {t.allFields}
                      </h3>
                      <span className="text-xs sm:text-sm text-gray-400">
                        {displayColumns.length} {t.fields}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] sm:max-h-[500px] overflow-y-auto pr-2">
                      {displayColumns.map((col: string) => (
                        <button
                          key={col}
                          onClick={() => toggleRemoveColumn(col)}
                          className={`group relative p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs font-medium transition-all border h-14 sm:h-16 flex items-center justify-center ${
                            removedColumns.includes(col)
                              ? 'bg-red-600/20 border-red-500'
                              : 'bg-green-600/10 border-green-500/30 hover:bg-white hover:border-white'
                          }`}
                        >
                          <span className={`truncate flex-1 group-hover:hidden ${
                            removedColumns.includes(col) ? 'text-red-500 line-through' : 'text-white'
                          }`}>
                            {col}
                          </span>
                          {importantColumns.includes(col) && !removedColumns.includes(col) && (
                            <span className="absolute top-1 right-1 text-yellow-400 text-xs group-hover:hidden">⭐</span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center text-black text-[8px] sm:text-[10px] font-normal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity p-1 sm:p-2 text-center overflow-hidden">
                            {getExplanation(col)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remaining Fields */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-4 sm:p-6 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-purple-300">
                        <span className="mr-2">✓</span> {t.selectedFields}
                      </h3>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-400 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold shadow-lg shadow-green-500/30">
                        {remainingColumns.length}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[300px] sm:max-h-[500px] overflow-y-auto pr-2">
                      {remainingColumns.length === 0 ? (
                        <div className="col-span-full text-center py-8 sm:py-12 text-gray-500">
                          <div className="text-3xl sm:text-4xl mb-2">🌑</div>
                          <p className="text-xs sm:text-sm">{t.noSelection}</p>
                        </div>
                      ) : (
                        remainingColumns.map((col: string) => (
                          <div
                            key={col}
                            className="relative p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs font-medium border backdrop-blur-sm h-14 sm:h-16 flex items-center justify-center bg-green-600/20 border-green-500/40"
                          >
                            <span className="truncate">{col}</span>
                            {importantColumns.includes(col) && (
                              <span className="absolute top-1 right-1 text-yellow-400 text-xs">⭐</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl sm:rounded-2xl border border-purple-500/30 p-6 sm:p-12 backdrop-blur-sm">
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">⚙️</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-purple-300 mb-2">{t.datasetName}</h3>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <input
                          type="text"
                          value={datasetName}
                          onChange={(e) => setDatasetName(e.target.value)}
                          placeholder={t.namePlaceholder}
                          className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-black/40 border border-purple-500/30 rounded-xl focus:outline-none focus:border-purple-500 text-white text-base sm:text-lg placeholder-gray-500 backdrop-blur-sm"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center space-x-3 p-3 sm:p-4 bg-black/20 rounded-lg border border-purple-500/20">
                        <input
                          type="checkbox"
                          checked={removeOutliers}
                          onChange={handleOutlierToggle}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 border-purple-500/50 rounded focus:ring-purple-400"
                        />
                        <label className="text-xs sm:text-sm text-gray-300">{t.removeOutliers}</label>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-purple-500/20">
                        <div className="text-center p-3 sm:p-4 bg-black/20 rounded-lg">
                          <div className="text-2xl sm:text-3xl font-bold text-purple-400">{selectedColumns.length}</div>
                          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{t.selectedFields}</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-black/20 rounded-lg">
                          <div className="text-2xl sm:text-3xl font-bold text-blue-400">{analyzeData.shape.rows.toLocaleString()}</div>
                          <div className="text-[10px] sm:text-xs text-gray-400 mt-1">{t.originalRows}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && stats && (
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-4xl sm:text-5xl mx-auto mb-3 sm:mb-4 shadow-2xl shadow-green-500/30 animate-pulse">
                      ✓
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">{t.success}</h3>
                    <p className="text-sm sm:text-base text-gray-400">Dataset: <span className="text-purple-400 font-semibold break-all">{createdName}</span></p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 sm:p-6 border border-purple-500/30">
                      <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-1">{stats.final_rows.toLocaleString()}</div>
                      <div className="text-xs sm:text-sm text-gray-400">{t.finalRows}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 sm:p-6 border border-blue-500/30">
                      <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-1">{stats.final_cols}</div>
                      <div className="text-xs sm:text-sm text-gray-400">{t.columns}</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 sm:p-6 border border-green-500/30">
                      <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-1">{stats.total_noise_removed_pct}%</div>
                      <div className="text-xs sm:text-sm text-gray-400">{t.noiseRemoved}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4 border border-purple-500/20">
                      <div className="text-xl sm:text-2xl font-bold text-orange-400 mb-1">{stats.flag_noise_dropped}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400">{t.flagNoise}</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 sm:p-4 border border-purple-500/20">
                      <div className="text-xl sm:text-2xl font-bold text-red-400 mb-1">{stats.outliers_dropped}</div>
                      <div className="text-[10px] sm:text-xs text-gray-400">{t.outliers}</div>
                    </div>
                  </div>

                  {Object.keys(stats.label_dist).length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 rounded-xl p-4 sm:p-6 border border-purple-500/30">
                      <h4 className="text-base sm:text-lg font-bold text-purple-300 mb-3 sm:mb-4">{t.labelDist}</h4>
                      <div className="space-y-2 sm:space-y-3">
                        {Object.entries(stats.label_dist).map(([label, pct]) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm text-gray-300 flex-shrink-0">{getLabelDisplay(label)}</span>
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
                              <div className="flex-1 bg-black/40 rounded-full h-2 sm:h-3 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="text-sm sm:text-lg font-bold text-purple-400 w-12 sm:w-16 text-right">{pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button className="mt-6 sm:mt-8 w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all text-base sm:text-lg font-semibold shadow-2xl shadow-green-500/30 flex items-center justify-center space-x-2">
                    <span>{t.trainModel}</span>
                    <span className="text-xl sm:text-2xl">🚀</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-purple-500/20 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
              <button
                onClick={() => {
                  if (currentStep > 0) {
                    setCurrentStep(currentStep - 1);
                  } else {
                    setShowModal(false);
                    setCurrentStep(0);
                  }
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg transition-all font-medium border border-gray-700 text-sm sm:text-base"
              >
                ← {t.back}
              </button>

              {error && (
                <div className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs sm:text-sm text-center">
                  ⚠️ {error}
                </div>
              )}

              <div className="w-full sm:w-auto">
                {currentStep === 0 && (
                  <button
                    onClick={handleNextStep}
                    disabled={remainingColumns.length === 0}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg transition-all font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <span>{t.nextStep}</span>
                    <span>→</span>
                  </button>
                )}
                {currentStep === 1 && (
                  <button
                    onClick={handleProcess}
                    disabled={loading || !datasetName.trim()}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg transition-all font-semibold shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <span>{loading ? t.processing : t.create}</span>
                    {!loading && <span>✓</span>}
                  </button>
                )}
                {currentStep === 2 && (
                  <button className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg transition-all font-semibold shadow-lg shadow-green-500/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <span>{t.trainModel}</span>
                    <span>🚀</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outlier Confirmation Modal */}
      {showOutlierConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-purple-500/20 p-6 text-center">
            <div className="text-4xl sm:text-5xl mb-4 text-yellow-500">⚠️</div>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">{t.outlierWarning}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <button
                onClick={confirmOutlier}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg transition-all font-medium text-sm sm:text-base"
              >
                {t.confirm}
              </button>
              <button
                onClick={cancelOutlier}
                className="w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg transition-all font-medium text-sm sm:text-base"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { exoplanetAPI, PredictResponse, ListModelsResponse } from '../services/api';

interface InputData {
  [key: string]: number | '';
}

interface ModelFeaturesResponse {
  status: string;
  model_name?: string;
  num_features?: number;
  features?: string[];
  importance?: Record<string, number>;
  message?: string;
}

export default function TestPage() {
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [modelFeatures, setModelFeatures] = useState<string[]>([]);
  const [inputData, setInputData] = useState<InputData>({});
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingFeatures, setLoadingFeatures] = useState(false);
  const router = useRouter();

  const keyFeatures = [
    { key: 'koi_score', label: language === 'vi' ? 'Điểm tin cậy (0-1)' : 'Disposition Score (0-1)', default: 1.0 },
    { key: 'koi_fpflag_nt', label: language === 'vi' ? 'Cờ NT (0/1)' : 'NT Flag (0/1)', default: 0 },
    { key: 'koi_fpflag_ss', label: language === 'vi' ? 'Cờ SS (0/1)' : 'SS Flag (0/1)', default: 0 },
    { key: 'koi_fpflag_co', label: language === 'vi' ? 'Cờ CO (0/1)' : 'CO Flag (0/1)', default: 0 },
    { key: 'koi_fpflag_ec', label: language === 'vi' ? 'Cờ EC (0/1)' : 'EC Flag (0/1)', default: 0 },
    { key: 'koi_period', label: language === 'vi' ? 'Chu kỳ quỹ đạo (ngày)' : 'Orbital Period (days)', default: 9.488 },
    { key: 'koi_period_err1', label: language === 'vi' ? 'Sai số trên chu kỳ' : 'Period Upper Err', default: 0.000028 },
    { key: 'koi_period_err2', label: language === 'vi' ? 'Sai số dưới chu kỳ' : 'Period Lower Err', default: -0.000028 },
    { key: 'koi_time0bk', label: language === 'vi' ? 'Thời điểm transit (BKJD)' : 'Transit Epoch (BKJD)', default: 170.539 },
    { key: 'koi_time0bk_err1', label: language === 'vi' ? 'Sai số trên thời điểm' : 'Epoch Upper Err', default: 0.002 },
    { key: 'koi_time0bk_err2', label: language === 'vi' ? 'Sai số dưới thời điểm' : 'Epoch Lower Err', default: -0.002 },
    { key: 'koi_impact', label: language === 'vi' ? 'Thông số va chạm' : 'Impact Parameter', default: 0.146 },
    { key: 'koi_impact_err1', label: language === 'vi' ? 'Sai số trên va chạm' : 'Impact Upper Err', default: 0.318 },
    { key: 'koi_impact_err2', label: language === 'vi' ? 'Sai số dưới va chạm' : 'Impact Lower Err', default: -0.146 },
    { key: 'koi_duration', label: language === 'vi' ? 'Thời lượng transit (giờ)' : 'Transit Duration (hrs)', default: 2.958 },
    { key: 'koi_duration_err1', label: language === 'vi' ? 'Sai số trên thời lượng' : 'Duration Upper Err', default: 0.082 },
    { key: 'koi_duration_err2', label: language === 'vi' ? 'Sai số dưới thời lượng' : 'Duration Lower Err', default: -0.082 },
    { key: 'koi_depth', label: language === 'vi' ? 'Độ sâu transit (ppm)' : 'Transit Depth (ppm)', default: 615.8 },
    { key: 'koi_depth_err1', label: language === 'vi' ? 'Sai số trên độ sâu' : 'Depth Upper Err', default: 195 },
    { key: 'koi_depth_err2', label: language === 'vi' ? 'Sai số dưới độ sâu' : 'Depth Lower Err', default: -195 },
    { key: 'koi_prad', label: language === 'vi' ? 'Bán kính hành tinh (R⊕)' : 'Planetary Radius (R⊕)', default: 2.26 },
    { key: 'koi_prad_err1', label: language === 'vi' ? 'Sai số trên bán kính' : 'Radius Upper Err', default: 0.26 },
    { key: 'koi_prad_err2', label: language === 'vi' ? 'Sai số dưới bán kính' : 'Radius Lower Err', default: -0.15 },
    { key: 'koi_teq', label: language === 'vi' ? 'Nhiệt độ cân bằng (K)' : 'Equilibrium Temp (K)', default: 793 },
    { key: 'koi_teq_err1', label: language === 'vi' ? 'Sai số trên Teq' : 'Teq Upper Err', default: 0 },
    { key: 'koi_teq_err2', label: language === 'vi' ? 'Sai số dưới Teq' : 'Teq Lower Err', default: 0 },
    { key: 'koi_insol', label: language === 'vi' ? 'Thông lượng bức xạ' : 'Insolation Flux', default: 93.59 },
    { key: 'koi_insol_err1', label: language === 'vi' ? 'Sai số trên Insol' : 'Insol Upper Err', default: 29.45 },
    { key: 'koi_insol_err2', label: language === 'vi' ? 'Sai số dưới Insol' : 'Insol Lower Err', default: -16.65 },
    { key: 'koi_model_snr', label: language === 'vi' ? 'Tỷ số SNR' : 'Model SNR', default: 35.8 },
    { key: 'koi_tce_plnt_num', label: language === 'vi' ? 'Số thứ tự hành tinh' : 'TCE Planet Num', default: 1 },
    { key: 'koi_steff', label: language === 'vi' ? 'Nhiệt độ sao (K)' : 'Stellar Temp (K)', default: 5455 },
    { key: 'koi_steff_err1', label: language === 'vi' ? 'Sai số trên Steff' : 'Steff Upper Err', default: 81 },
    { key: 'koi_steff_err2', label: language === 'vi' ? 'Sai số dưới Steff' : 'Steff Lower Err', default: -81 },
    { key: 'koi_slogg', label: language === 'vi' ? 'Log gravity sao' : 'Stellar Logg', default: 4.467 },
    { key: 'koi_slogg_err1', label: language === 'vi' ? 'Sai số trên Slogg' : 'Logg Upper Err', default: 0.64 },
    { key: 'koi_slogg_err2', label: language === 'vi' ? 'Sai số dưới Slogg' : 'Logg Lower Err', default: -0.96 },
    { key: 'koi_srad', label: language === 'vi' ? 'Bán kính sao (R☉)' : 'Stellar Radius (R☉)', default: 0.927 },
    { key: 'koi_srad_err1', label: language === 'vi' ? 'Sai số trên Srad' : 'Srad Upper Err', default: 0.105 },
    { key: 'koi_srad_err2', label: language === 'vi' ? 'Sai số dưới Srad' : 'Srad Lower Err', default: -0.061 },
    { key: 'ra', label: language === 'vi' ? 'Xích kinh (độ)' : 'Right Ascension (deg)', default: 291.934 },
    { key: 'dec', label: language === 'vi' ? 'Xích vĩ (độ)' : 'Declination (deg)', default: 48.142 },
    { key: 'koi_kepmag', label: language === 'vi' ? 'Độ sáng Kepler (mag)' : 'Kepler Mag (mag)', default: 15.347 },
  ];

  const columnExplanations: { [key: string]: string } = {
    koi_score: language === 'vi' ? 'Điểm tin cậy phân loại (0-1)' : 'Disposition Score (0-1)',
    koi_fpflag_nt: language === 'vi' ? 'Cờ cảnh báo: Không giống transit - Giúp loại bỏ tín hiệu giả' : 'Not Transit-Like False Positive Flag - Helps filter false signals',
    koi_fpflag_ss: language === 'vi' ? 'Cờ cảnh báo: Nguyệt thực sao - Giúp loại bỏ tín hiệu giả' : 'Stellar Eclipse False Positive Flag - Helps filter false signals',
    koi_fpflag_co: language === 'vi' ? 'Cờ cảnh báo: Độ lệch trọng tâm - Giúp loại bỏ tín hiệu giả' : 'Centroid Offset False Positive Flag - Helps filter false signals',
    koi_fpflag_ec: language === 'vi' ? 'Cờ cảnh báo: Nhiễm từ thiên thể khác - Giúp loại bỏ tín hiệu giả' : 'Ephemeris Match Contamination Flag - Helps filter false signals',
    koi_period: language === 'vi' ? 'Chu kỳ quỹ đạo (ngày) - Đặc trưng chính của transit' : 'Orbital Period (days) - Key transit feature',
    koi_period_err1: language === 'vi' ? 'Sai số trên chu kỳ quỹ đạo (ngày)' : 'Orbital Period Upper Uncertainty (days)',
    koi_period_err2: language === 'vi' ? 'Sai số dưới chu kỳ quỹ đạo (ngày)' : 'Orbital Period Lower Uncertainty (days)',
    koi_time0bk: language === 'vi' ? 'Thời điểm transit đầu tiên (BKJD) - Định vị sự kiện transit' : 'Transit Epoch (BKJD) - Locates transit event',
    koi_time0bk_err1: language === 'vi' ? 'Sai số trên thời điểm transit (BKJD)' : 'Transit Epoch Upper Unc. (BKJD)',
    koi_time0bk_err2: language === 'vi' ? 'Sai số dưới thời điểm transit (BKJD)' : 'Transit Epoch Lower Unc. (BKJD)',
    koi_impact: language === 'vi' ? 'Thông số va chạm (impact parameter) - Ảnh hưởng hình dạng transit' : 'Impact Parameter - Affects transit shape',
    koi_impact_err1: language === 'vi' ? 'Sai số trên thông số va chạm' : 'Impact Parameter Upper Unc.',
    koi_impact_err2: language === 'vi' ? 'Sai số dưới thông số va chạm' : 'Impact Parameter Lower Unc.',
    koi_duration: language === 'vi' ? 'Thời lượng transit (giờ) - Đo thời gian hành tinh che khuất sao' : 'Transit Duration (hrs) - Measures planet occlusion time',
    koi_duration_err1: language === 'vi' ? 'Sai số trên thời lượng transit (giờ)' : 'Transit Duration Upper Unc. (hrs)',
    koi_duration_err2: language === 'vi' ? 'Sai số dưới thời lượng transit (giờ)' : 'Transit Duration Lower Unc. (hrs)',
    koi_depth: language === 'vi' ? 'Độ sâu transit (ppm) - Đo mức độ giảm sáng của sao' : 'Transit Depth (ppm) - Measures star dimming',
    koi_depth_err1: language === 'vi' ? 'Sai số trên độ sâu transit (ppm)' : 'Transit Depth Upper Unc. (ppm)',
    koi_depth_err2: language === 'vi' ? 'Sai số dưới độ sâu transit (ppm)' : 'Transit Depth Lower Unc. (ppm)',
    koi_prad: language === 'vi' ? 'Bán kính hành tinh (bán kính Trái Đất)' : 'Planetary Radius (Earth radii)',
    koi_prad_err1: language === 'vi' ? 'Sai số trên bán kính hành tinh (R⊕)' : 'Planetary Radius Upper Unc. (R⊕)',
    koi_prad_err2: language === 'vi' ? 'Sai số dưới bán kính hành tinh (R⊕)' : 'Planetary Radius Lower Unc. (R⊕)',
    koi_teq: language === 'vi' ? 'Nhiệt độ cân bằng hành tinh (Kelvin)' : 'Equilibrium Temperature (K)',
    koi_teq_err1: language === 'vi' ? 'Sai số trên nhiệt độ cân bằng (K)' : 'Equilibrium Temp Upper Unc. (K)',
    koi_teq_err2: language === 'vi' ? 'Sai số dưới nhiệt độ cân bằng (K)' : 'Equilibrium Temp Lower Unc. (K)',
    koi_insol: language === 'vi' ? 'Thông lượng bức xạ (so với Trái Đất)' : 'Insolation Flux (Earth flux)',
    koi_insol_err1: language === 'vi' ? 'Sai số trên thông lượng bức xạ' : 'Insolation Flux Upper Unc.',
    koi_insol_err2: language === 'vi' ? 'Sai số dưới thông lượng bức xạ' : 'Insolation Flux Lower Unc.',
    koi_model_snr: language === 'vi' ? 'Tỷ số tín hiệu/nhiễu của transit' : 'Transit Signal-to-Noise Ratio',
    koi_tce_plnt_num: language === 'vi' ? 'Số thứ tự hành tinh trong hệ TCE' : 'TCE Planet Number',
    koi_steff: language === 'vi' ? 'Nhiệt độ bề mặt sao (Kelvin)' : 'Stellar Effective Temperature (K)',
    koi_steff_err1: language === 'vi' ? 'Sai số trên nhiệt độ sao (K)' : 'Stellar Temp Upper Unc. (K)',
    koi_steff_err2: language === 'vi' ? 'Sai số dưới nhiệt độ sao (K)' : 'Stellar Temp Lower Unc. (K)',
    koi_slogg: language === 'vi' ? 'Gia tốc trọng trường bề mặt sao (log10(cm/s²))' : 'Stellar Surface Gravity (log10(cm/s²))',
    koi_slogg_err1: language === 'vi' ? 'Sai số trên gia tốc trọng trường sao' : 'Stellar Gravity Upper Unc.',
    koi_slogg_err2: language === 'vi' ? 'Sai số dưới gia tốc trọng trường sao' : 'Stellar Gravity Lower Unc.',
    koi_srad: language === 'vi' ? 'Bán kính sao (bán kính Mặt Trời - R☉)' : 'Stellar Radius (Solar radii - R☉)',
    koi_srad_err1: language === 'vi' ? 'Sai số trên bán kính sao (R☉)' : 'Stellar Radius Upper Unc. (R☉)',
    koi_srad_err2: language === 'vi' ? 'Sai số dưới bán kính sao (R☉)' : 'Stellar Radius Lower Unc. (R☉)',
    ra: language === 'vi' ? 'Tọa độ xích kinh (độ thập phân)' : 'Right Ascension (decimal degrees)',
    dec: language === 'vi' ? 'Tọa độ xích vĩ (độ thập phân)' : 'Declination (decimal degrees)',
    koi_kepmag: language === 'vi' ? 'Độ sáng biểu kiến Kepler (mag)' : 'Kepler-band Magnitude (mag)',
    default: language === 'vi' ? 'Thông tin bổ sung' : 'Additional information',
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = {
    title: language === 'vi' ? 'Kiểm thử Mô hình' : 'Model Testing',
    description: language === 'vi' ? 'Chọn mô hình và nhập dữ liệu để dự đoán hành tinh ngoài.' : 'Select model and input data for exoplanet prediction.',
    testButton: language === 'vi' ? 'Bắt đầu Kiểm thử' : 'Start Testing',
    back: language === 'vi' ? 'Quay lại' : 'Back',
    preprocess: language === 'vi' ? 'Quay lại: Tiền xử lý' : 'Back to Preprocess',
    toggle: language === 'vi' ? 'EN' : 'VI',
    loading: language === 'vi' ? 'Đang dự đoán...' : 'Predicting...',
    error: (msg: string) => language === 'vi' ? `Lỗi: ${msg}` : `Error: ${msg}`,
    step0Title: language === 'vi' ? 'Bước 1: Chọn mô hình' : 'Step 1: Select Model',
    step1Title: language === 'vi' ? 'Bước 2: Nhập dữ liệu' : 'Step 2: Input Data',
    step2Title: language === 'vi' ? 'Bước 3: Kết quả dự đoán' : 'Step 3: Prediction Results',
    modelLabel: language === 'vi' ? 'Chọn mô hình:' : 'Select Model:',
    modelPlaceholder: language === 'vi' ? 'Chọn mô hình' : 'Select model',
    inputLabel: language === 'vi' ? 'Dữ liệu đầu vào (raw - sẽ được xử lý tự động):' : 'Input Data (raw - auto-processed):',
    totalFields: language === 'vi' ? 'Tổng số trường:' : 'Total fields:',
    nextButton: language === 'vi' ? 'Tiếp theo' : 'Next',
    predictButton: language === 'vi' ? 'Dự đoán' : 'Predict',
    closeButton: language === 'vi' ? 'Đóng' : 'Close',
    prediction: language === 'vi' ? 'Dự đoán:' : 'Prediction:',
    confidence: language === 'vi' ? 'Độ tin cậy:' : 'Confidence:',
    probabilities: language === 'vi' ? 'Xác suất các lớp:' : 'Class Probabilities:',
    noModels: language === 'vi' ? 'Không tìm thấy mô hình.' : 'No models found.',
    selectModelFirst: language === 'vi' ? 'Vui lòng chọn mô hình.' : 'Please select a model.',
    loadingFeatures: language === 'vi' ? 'Đang tải đặc trưng mô hình...' : 'Loading model features...',
  };

  const fetchModelFeatures = async (modelName: string): Promise<boolean> => {
    setLoadingFeatures(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/model_features?model_name=${modelName}`);
      const data: ModelFeaturesResponse = await response.json();
      if (data.status === 'success') {
        setModelFeatures(data.features || []);
        const defaults = (data.features || []).reduce((acc: InputData, featKey: string) => {
          const feat = keyFeatures.find(f => f.key === featKey);
          acc[featKey] = feat ? feat.default : 0;
          return acc;
        }, {});
        setInputData(defaults);
        return true;
      } else {
        setError(t.error(data.message || 'Không thể lấy danh sách đặc trưng mô hình.'));
        setModelFeatures(keyFeatures.map(f => f.key));
        return false;
      }
    } catch (err: any) {
      setError(t.error(err.message || 'Không thể lấy danh sách đặc trưng mô hình.'));
      setModelFeatures(keyFeatures.map(f => f.key));
      return false;
    } finally {
      setLoadingFeatures(false);
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response: ListModelsResponse = await exoplanetAPI.listModels();
        if (response.status === 'success') {
          setModels(response.models);
        } else {
          setError(t.error(response.message));
        }
      } catch (err: any) {
        setError(t.error(err.message || 'Không thể lấy danh sách mô hình.'));
      }
    };
    fetchModels();
  }, []);

  const handleInputChange = (key: string, value: string) => {
    setInputData(prev => ({
      ...prev,
      [key]: value === '' ? '' : Number(value)
    }));
  };

  const handlePredict = async () => {
    if (!selectedModel || modelFeatures.length === 0) {
      setError(t.error(t.selectModelFirst));
      return;
    }
    const validInput = modelFeatures.reduce((acc, featKey) => {
      const val = inputData[featKey];
      const feat = keyFeatures.find(f => f.key === featKey);
      acc[featKey] = (val !== '' && typeof val === 'number' && !isNaN(val)) ? val : (feat ? feat.default : 0);
      return acc;
    }, {} as Record<string, number>);
    setLoading(true);
    setError(null);
    try {
      const result: PredictResponse = await exoplanetAPI.predictModel({
        model_name: selectedModel,
        input_data: validInput,
      });
      if (result.status === 'success') {
        setPredictResult(result);
        setCurrentStep(2);
      }
    } catch (err: any) {
      setError(t.error(err.message || 'Không thể dự đoán.'));
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep0 = async () => {
    if (!selectedModel) {
      setError(t.error(t.selectModelFirst));
      return;
    }
    const success = await fetchModelFeatures(selectedModel);
    if (success) {
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[url('/stars-bg.jpg')] bg-cover bg-fixed text-white flex flex-col font-sans relative overflow-hidden">
      {/* Nebula Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-black/50 pointer-events-none"></div>
      
      <header className="relative flex justify-between items-center p-6 bg-black/40 backdrop-blur-xl border-b border-blue-400/40 z-10">
        <div className="flex items-center space-x-3">
          <span className="text-4xl animate-pulse">🌌</span>
          <h2 className="text-2xl font-bold text-blue-200 tracking-wider">Exoplanet Hunter</h2>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-blue-300 hover:text-blue-100 font-medium transition-colors duration-300">
            {t.back}
          </Link>
          <Link href="/preprocess" className="text-blue-300 hover:text-blue-100 font-medium transition-colors duration-300">
            {t.preprocess}
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 bg-blue-700/80 text-white rounded-full hover:bg-blue-600/80 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-blue-500/50"
          >
            {t.toggle}
          </button>
        </div>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center mb-12 max-w-4xl">
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient">
            {t.title}
          </h1>
          <p className="text-xl text-blue-100/80 tracking-wide">
            {t.description}
          </p>
        </div>

        <div className="w-full max-w-lg space-y-8">
          <button
            onClick={() => setShowModal(true)}
            disabled={loading || models.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full hover:from-blue-500 hover:to-purple-500 transition-all duration-500 text-xl font-semibold shadow-xl hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {loading ? t.loading : t.testButton}
          </button>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/40 rounded-lg text-red-200 text-center font-medium shadow-md">
              {error}
            </div>
          )}

          {predictResult && !showModal && (
            <div className="p-8 bg-black/50 rounded-2xl shadow-2xl border border-green-400/40 backdrop-blur-lg">
              <h3 className="text-2xl font-bold text-green-300 mb-6 text-center">{t.step2Title}</h3>
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 rounded-xl text-center shadow-lg">
                  <p className="text-lg opacity-90 mb-3">{t.prediction}</p>
                  <p className="text-4xl font-bold">{predictResult.result.prediction}</p>
                  <p className="text-sm opacity-90 mt-3">{t.confidence} {(predictResult.result.confidence * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-black/60 p-6 rounded-xl border border-green-400/40">
                  <strong className="text-green-300 mb-3 block text-lg">{t.probabilities}</strong>
                  <ul className="space-y-3">
                    {Object.entries(predictResult.result.probabilities)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cls, prob]) => (
                        <li key={cls} className="flex justify-between items-center p-3 bg-black/70 rounded-lg">
                          <span className="font-medium text-blue-100">{cls}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-green-200/20 rounded-full h-3">
                              <div
                                className="bg-green-400 rounded-full h-3"
                                style={{ width: `${prob * 100}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-green-300">{(prob * 100).toFixed(2)}%</span>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="text-center">
                  <strong className="text-green-300">Mô hình:</strong> {predictResult.model_name}
                </div>
                <Link href="/preprocess">
                  <button className="mt-6 w-full bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-500 transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-blue-500/50">
                    {t.preprocess}
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-black/50 backdrop-blur-xl rounded-3xl p-10 w-full max-w-5xl max-h-[85vh] overflow-y-auto flex flex-col shadow-2xl border border-blue-400/40">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-blue-200">
                {currentStep === 0 ? t.step0Title : currentStep === 1 ? t.step1Title : t.step2Title}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setCurrentStep(0);
                  setModelFeatures([]);
                  setInputData({});
                  setSelectedModel('');
                  setError(null);
                }}
                className="text-blue-300 hover:text-blue-100 text-4xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {currentStep === 0 && (
              <div className="w-full flex flex-col md:flex-row gap-8 py-10 bg-black/60 rounded-2xl border border-blue-400/40">
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-6xl mb-6 animate-spin-slow">🪐</div>
                  <p className="text-blue-100 text-center text-lg">
                    {language === 'vi' ? 'Chọn mô hình từ danh sách bên phải để khám phá vũ trụ.' : 'Select a model from the right to explore the cosmos.'}
                  </p>
                </div>
                <div className="flex-1 max-h-[50vh] overflow-y-auto pr-2">
                  {models.length === 0 ? (
                    <div className="text-center text-red-200">{t.noModels}</div>
                  ) : (
                    <div className="space-y-4">
                      {models.map((model) => (
                        <div
                          key={model}
                          onClick={() => setSelectedModel(model)}
                          className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                            selectedModel === model
                              ? 'bg-blue-700/50 border-blue-300 shadow-lg'
                              : 'bg-black/50 border-blue-400/40 hover:bg-blue-600/30 hover:shadow-blue-500/50'
                          }`}
                        >
                          <p className="font-semibold text-blue-100">{model}</p>
                          <p className="text-sm text-blue-200/70">
                            {language === 'vi' ? 'Mô hình được huấn luyện sẵn' : 'Pre-trained model'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="w-full flex flex-col items-center py-10 bg-black/60 rounded-2xl border border-blue-400/40 overflow-y-auto max-h-[60vh]">
                <div className="text-6xl mb-8 text-blue-300 animate-pulse">📡</div>
                <div className="w-full p-8 bg-black/70 rounded-xl border border-blue-400/40 shadow-2xl space-y-8">
                  <label className="block text-xl font-semibold text-blue-100">{t.inputLabel}</label>
                  <div className="text-sm text-blue-200/70 text-center">
                    <strong>{t.totalFields}</strong> {modelFeatures.length}
                  </div>
                  {modelFeatures.length === 0 ? (
                    <div className="text-center text-red-200">
                      {language === 'vi' ? 'Không có đặc trưng nào được tải. Vui lòng chọn lại mô hình.' : 'No features loaded. Please select a model again.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto pr-4">
                      {keyFeatures
                        .filter(feat => modelFeatures.includes(feat.key))
                        .map((feat) => (
                          <div key={feat.key} className="space-y-2 bg-black/80 p-4 rounded-lg border border-blue-500/30">
                            <label className="text-sm font-medium text-blue-100 block truncate">{feat.label}</label>
                            <input
                              type="number"
                              step="any"
                              value={inputData[feat.key] === 0 ? '0' : inputData[feat.key] || ''}
                              onChange={(e) => handleInputChange(feat.key, e.target.value)}
                              placeholder={feat.default.toString()}
                              title={columnExplanations[feat.key] || columnExplanations.default}
                              className="w-full px-3 py-2 bg-black/90 border border-blue-400/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-white text-sm placeholder-blue-200/50"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && predictResult && (
              <div className="w-full flex flex-col items-center py-10 bg-black/60 rounded-2xl border border-green-400/40 overflow-y-auto max-h-[60vh]">
                <div className="text-6xl mb-8 text-green-300 animate-pulse">🌠</div>
                <div className="w-full max-w-3xl p-8 bg-black/70 rounded-xl border border-green-400/40 shadow-2xl space-y-8">
                  <h3 className="text-xl font-bold text-green-300 mb-6 text-center">{t.step2Title}</h3>
                  <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-8 rounded-xl text-center shadow-lg">
                    <p className="text-lg opacity-90 mb-3">{t.prediction}</p>
                    <p className="text-4xl font-bold">{predictResult.result.prediction}</p>
                    <p className="text-sm opacity-90 mt-3">{t.confidence} {(predictResult.result.confidence * 100).toFixed(2)}%</p>
                  </div>
                  <div className="bg-black/70 p-6 rounded-xl border border-green-400/40">
                    <strong className="text-green-300 mb-3 block text-lg">{t.probabilities}</strong>
                    <ul className="space-y-3">
                      {Object.entries(predictResult.result.probabilities)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cls, prob]) => (
                          <li key={cls} className="flex justify-between items-center p-3 bg-black/80 rounded-lg">
                            <span className="font-medium text-blue-100">{cls}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-20 bg-green-200/20 rounded-full h-3">
                                <div
                                  className="bg-green-400 rounded-full h-3"
                                  style={{ width: `${prob * 100}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-green-300">{(prob * 100).toFixed(2)}%</span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                  <div className="text-center">
                    <strong className="text-green-300">Mô hình:</strong> {predictResult.model_name}
                  </div>
                  <Link href="/preprocess">
                    <button className="mt-6 w-full bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-500 transition-all duration-300 text-base font-semibold shadow-lg hover:shadow-blue-500/50">
                      {t.preprocess}
                    </button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-8 border-t border-blue-400/40 mt-8">
              <button
                onClick={() => {
                  if (currentStep === 2) {
                    setCurrentStep(1);
                  } else if (currentStep === 1) {
                    setCurrentStep(0);
                    setModelFeatures([]);
                    setInputData({});
                  } else {
                    setShowModal(false);
                    setCurrentStep(0);
                    setModelFeatures([]);
                    setInputData({});
                    setSelectedModel('');
                    setError(null);
                  }
                }}
                className="px-6 py-3 bg-gray-600/50 text-white rounded-full hover:bg-gray-500/50 transition-all duration-300 text-base font-semibold shadow-md"
              >
                ← {currentStep > 0 ? 'Quay lại' : t.back}
              </button>

              {error && (
                <div className="px-4 py-2 bg-red-900/30 border border-red-500/40 rounded-lg text-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              {currentStep === 0 ? (
                <button
                  onClick={handleNextStep0}
                  disabled={!selectedModel || loadingFeatures}
                  className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base font-semibold shadow-md flex items-center"
                >
                  {loadingFeatures ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      {t.loadingFeatures}
                    </>
                  ) : (
                    `${t.nextButton} →`
                  )}
                </button>
              ) : currentStep === 1 ? (
                <button
                  onClick={handlePredict}
                  disabled={loading || modelFeatures.length === 0}
                  className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-base font-semibold shadow-md flex items-center"
                >
                  {loading ? (
                    <>
                      <span className="mr-2 animate-spin">⏳</span>
                      {t.loading}
                    </>
                  ) : (
                    `${t.predictButton} 🔮`
                  )}
                </button>
              ) : (
                <Link href="/preprocess">
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all duration-300 text-base font-semibold shadow-md">
                    {t.preprocess}
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
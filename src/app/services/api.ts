// Updated src/app/services/api.ts (add dataset param to all methods, support tess)
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface CreateVariantResponse {
  status: string;
  name: string;
  files: { 
    csv: string; 
    scaler: string;
    imputer?: string;
  };
  stats?: {
    original_rows: number;
    final_rows: number;
    final_cols: number;
    flag_noise_dropped: number;
    outliers_dropped: number;
    total_noise_removed_pct: number;
    label_dist: Record<string, number>;
  };
  dataset?: string;
}

export interface ModelFeaturesResponse {
  status: string;
  model_name: string;
  num_features: number;
  features: string[];
  importance: Record<string, number>;
  dataset?: string;
}

export interface TrainResponse {
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
  dataset?: string;
}

export interface PredictResponse {
  status: string;
  message: string;
  model_name: string;
  result: {
    prediction: string;
    probabilities: Record<string, number>;
    confidence: number;
  };
  dataset?: string;
}

export interface ListModelsResponse {
  status: string;
  models: string[];
  message: string;
  dataset?: string;
}

export interface ListDatasetsResponse {
  status: string;
  datasets: string[];
  message: string;
  dataset?: string;
}

export interface AnalyzeResponse {
  status: string;
  columns: string[];
  shape: {
    rows: number;
    cols: number;
  };
  dataset?: string;
}

// Tạo Axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Định nghĩa endpoints (add dataset param to all)
export const exoplanetAPI = {
  preprocessData: async (payload: { action: string; columns?: string[]; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    const response = await api.post('/preprocess', payload);
    return response.data;
  },

  createVariant: async (payload: { columns: string[]; name: string; remove_outliers?: boolean; dataset: 'kepler' | 'tess' }): Promise<CreateVariantResponse> => {
    const response = await api.post('/create_variant', payload);
    return response.data;
  },

  trainModel: async (payload: { dataset_name: string; model_name: string; param_grid?: Record<string, string | number | string[] | number[] | undefined>; dataset: 'kepler' | 'tess' }): Promise<TrainResponse> => {
    const response = await api.post('/train', payload);
    return response.data;
  },

  listDatasets: async (dataset: 'kepler' | 'tess' = 'kepler'): Promise<ListDatasetsResponse> => {
    const response = await api.get('/list_datasets', { params: { dataset } });
    return response.data;
  },

  listModels: async (dataset: 'kepler' | 'tess' = 'kepler'): Promise<ListModelsResponse> => {
    const response = await api.get('/list_models', { params: { dataset } });
    return response.data;
  },

  predictModel: async (payload: { model_name: string; input_data: Record<string, number>; dataset: 'kepler' | 'tess' }): Promise<PredictResponse> => {
    const response = await api.post('/predict', payload);
    return response.data;
  },

  testModel: async (payload: { action: string; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    const response = await api.post('/test', payload);
    return response.data;
  },
  
  modelFeatures: async (payload: { model_name: string; dataset: 'kepler' | 'tess' }): Promise<ModelFeaturesResponse> => {
    const response = await api.get('/model_features', { params: payload });
    return response.data;
  },
  
  analyzeColumns: async (payload?: { action: string; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    const response = await api.post('/analyze', payload || {});
    return response.data;
  },

  getData: async (): Promise<Record<string, unknown>[]> => {
    const response = await api.get('/data');
    return response.data;
  },
};

export default api;
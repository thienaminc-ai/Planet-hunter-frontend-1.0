// Updated src/app/services/api.ts (add new interfaces and functions)
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface CreateVariantResponse {
  status: string;
  name: string;
  files: { 
    csv: string; 
    scaler: string;
    imputer?: string;  // Thêm optional này
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
}

export interface ModelFeaturesResponse {
  status: string;
  model_name: string;
  num_features: number;
  features: string[];
  importance: Record<string, number>;
}

export interface TrainResponse {
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

export interface PredictResponse {
  status: string;
  message: string;
  model_name: string;
  result: {
    prediction: string;
    probabilities: Record<string, number>;
    confidence: number;
  };
}

export interface ListModelsResponse {
  status: string;
  models: string[];
  message: string;
}

export interface ListDatasetsResponse {
  status: string;
  datasets: string[];
  message: string;
}

export interface AnalyzeResponse {
  status: string;
  columns: string[];
  shape: {
    rows: number;
    cols: number;
  };
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

// Định nghĩa endpoints
export const exoplanetAPI = {
  preprocessData: async (payload: { action: string; columns?: string[] }): Promise<AnalyzeResponse> => {
    const response = await api.post('/preprocess', payload);
    return response.data;
  },

  createVariant: async (payload: { columns: string[]; name: string; remove_outliers?: boolean }): Promise<CreateVariantResponse> => {
    const response = await api.post('/create_variant', payload);
    return response.data;
  },

  trainModel: async (payload: { dataset_name: string; model_name: string }): Promise<TrainResponse> => {
    const response = await api.post('/train', payload);
    return response.data;
  },

  listDatasets: async (): Promise<ListDatasetsResponse> => {
    const response = await api.get('/list_datasets');
    return response.data;
  },

  listModels: async (): Promise<ListModelsResponse> => {  // New
    const response = await api.get('/list_models');
    return response.data;
  },

  predictModel: async (payload: { model_name: string; input_data: Record<string, number> }): Promise<PredictResponse> => {  // New
    const response = await api.post('/predict', payload);
    return response.data;
  },

  testModel: async (payload: { action: string }): Promise<AnalyzeResponse> => {
    const response = await api.post('/test', payload);
    return response.data;
  },
  // Thêm method
  modelFeatures: async (payload: { model_name: string }): Promise<ModelFeaturesResponse> => {
    const response = await api.get('/model_features', { params: payload });
    return response.data;
  },
  analyzeColumns: async (payload?: { action: string }): Promise<AnalyzeResponse> => {
    const response = await api.post('/analyze', payload || {});
    return response.data;
  },

  getData: async (): Promise<Record<string, unknown>[]> => {
    const response = await api.get('/data');
    return response.data;
  },
};

export default api;
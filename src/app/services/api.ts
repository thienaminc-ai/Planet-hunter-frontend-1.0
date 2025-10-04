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

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase() || 'UNKNOWN'} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase() || 'UNKNOWN'} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(`[API Response Error] ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`, {
      message: error.message,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const exoplanetAPI = {
  preprocessData: async (payload: { action: string; columns?: string[]; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    console.log('[exoplanetAPI.preprocessData] Sending request', payload);
    try {
      const response = await api.post('/preprocess', payload);
      console.log('[exoplanetAPI.preprocessData] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.preprocessData] Error', error);
      throw error;
    }
  },

  createVariant: async (payload: { columns: string[]; name: string; remove_outliers?: boolean; dataset: 'kepler' | 'tess' }): Promise<CreateVariantResponse> => {
    console.log('[exoplanetAPI.createVariant] Sending request', payload);
    try {
      const response = await api.post('/create_variant', payload);
      console.log('[exoplanetAPI.createVariant] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.createVariant] Error', error);
      throw error;
    }
  },

  trainModel: async (payload: { dataset_name: string; model_name: string; param_grid?: Record<string, string | number | string[] | number[] | undefined>; dataset: 'kepler' | 'tess' }): Promise<TrainResponse> => {
    console.log('[exoplanetAPI.trainModel] Sending request', payload);
    try {
      const response = await api.post('/train', payload);
      console.log('[exoplanetAPI.trainModel] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.trainModel] Error', error);
      throw error;
    }
  },

  listDatasets: async (dataset: 'kepler' | 'tess' = 'kepler'): Promise<ListDatasetsResponse> => {
    console.log('[exoplanetAPI.listDatasets] Sending request', { dataset });
    try {
      const response = await api.get('/list_datasets', { params: { dataset } });
      console.log('[exoplanetAPI.listDatasets] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.listDatasets] Error', error);
      throw error;
    }
  },

  listModels: async (dataset: 'kepler' | 'tess' = 'kepler'): Promise<ListModelsResponse> => {
    console.log('[exoplanetAPI.listModels] Sending request', { dataset });
    try {
      const response = await api.get('/list_models', { params: { dataset } });
      console.log('[exoplanetAPI.listModels] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.listModels] Error', error);
      throw error;
    }
  },

  predictModel: async (payload: { model_name: string; input_data: Record<string, number>; dataset: 'kepler' | 'tess' }): Promise<PredictResponse> => {
    console.log('[exoplanetAPI.predictModel] Sending request', payload);
    try {
      const response = await api.post('/predict', payload);
      console.log('[exoplanetAPI.predictModel] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.predictModel] Error', error);
      throw error;
    }
  },

  testModel: async (payload: { action: string; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    console.log('[exoplanetAPI.testModel] Sending request', payload);
    try {
      const response = await api.post('/test', payload);
      console.log('[exoplanetAPI.testModel] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.testModel] Error', error);
      throw error;
    }
  },

  modelFeatures: async (payload: { model_name: string; dataset: 'kepler' | 'tess' }): Promise<ModelFeaturesResponse> => {
    console.log('[exoplanetAPI.modelFeatures] Sending request', payload);
    try {
      const response = await api.get('/model_features', { params: payload });
      console.log('[exoplanetAPI.modelFeatures] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.modelFeatures] Error', error);
      throw error;
    }
  },

  analyzeColumns: async (payload?: { action: string; dataset?: 'kepler' | 'tess' }): Promise<AnalyzeResponse> => {
    console.log('[exoplanetAPI.analyzeColumns] Sending request', payload);
    try {
      const response = await api.post('/analyze', payload || {});
      console.log('[exoplanetAPI.analyzeColumns] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.analyzeColumns] Error', error);
      throw error;
    }
  },

  getData: async (): Promise<Record<string, unknown>[]> => {
    console.log('[exoplanetAPI.getData] Sending request');
    try {
      const response = await api.get('/data');
      console.log('[exoplanetAPI.getData] Response received', response.data);
      return response.data;
    } catch (error) {
      console.error('[exoplanetAPI.getData] Error', error);
      throw error;
    }
  },
};

export default api;
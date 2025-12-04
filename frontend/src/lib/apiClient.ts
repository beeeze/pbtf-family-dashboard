// API client for backend communication
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

interface APIResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const queryString = params 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Virtuous API proxy
  async callVirtuousAPI(
    endpoint: string,
    method: string = 'GET',
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>
  ) {
    return this.post('/api/virtuous-api', {
      endpoint,
      method,
      body,
      queryParams,
    });
  }

  // Sync patient families
  async syncPatientFamilies(action: string, params?: Record<string, any>) {
    return this.post('/api/sync-patient-families', {
      action,
      ...params,
    });
  }

  // Query contact notes
  async queryContactNotes(action: string, params?: Record<string, any>) {
    return this.post('/api/query-contact-notes', {
      action,
      ...params,
    });
  }

  // Get patient families from cache
  async getPatientFamilies(skip: number = 0, limit: number = 100, search?: string) {
    const params: Record<string, string> = {
      skip: String(skip),
      limit: String(limit),
    };
    if (search) params.search = search;
    
    return this.get<{ families: any[]; total: number }>('/api/patient-families', params);
  }
}

export const apiClient = new APIClient(API_BASE_URL);

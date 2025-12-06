interface ApiClientOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: any) => void;
  onRetry?: (attempt: number) => void;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    status?: number;
    code?: string;
  };
  success: boolean;
}

class ApiClient {
  private baseURL: string;
  private defaultOptions: ApiClientOptions;

  constructor(baseURL: string = '', options: ApiClientOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      retries: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...options
    };
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    apiOptions: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const finalOptions = { ...this.defaultOptions, ...apiOptions };
    const url = `${this.baseURL}${endpoint}`;
    
    let lastError: any;
    let attempt = 0;

    while (attempt <= finalOptions.retries!) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { data, success: true };

      } catch (error) {
        lastError = error;
        attempt++;

        // Don't retry on certain types of errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        if (attempt <= finalOptions.retries!) {
          finalOptions.onRetry?.(attempt);
          await new Promise(resolve => setTimeout(resolve, finalOptions.retryDelay! * attempt));
        }
      }
    }

    const errorMessage = lastError instanceof Error
      ? lastError.message
      : 'Unknown error occurred';
    
    finalOptions.onError?.(errorMessage);
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: lastError?.code
      }
    };
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, options);
  }

  async post<T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }, options);
  }

  async put<T = any>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }, options);
  }

  async delete<T = any>(endpoint: string, options?: ApiClientOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, options);
  }
}

// Specific API endpoints
const client = new ApiClient('/api');

export const dashboardApi = {
  getSummary: () => client.get('/dashboard/summary'),
  getTodayDsa: () => client.get('/dsa/today'),
  getHealthDaily: () => client.get('/health/daily'),
  getHealthWeekly: () => client.get('/health/weekly'),
  getExpenses: () => client.get('/wallet/expenses'),
  getCollegeSubjects: () => client.get('/college/subjects'),
  getAnalytics: () => client.get('/analytics'),
};

// Global client instance
export { client, ApiClient };
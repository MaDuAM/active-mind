// frontend/src/lib/apiClient.ts

/// <reference types="vite/client" />

import { ApiError } from '../types';

interface ApiClientOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  params?: Record<string, any>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

// ============================================
// API CLIENT
// 
// HTTP client with built-in retry logic, timeout handling,
// and automatic error transformation.
// 
// Features:
// - Automatic retries with exponential backoff
// - Request timeout with abort controller
// - Query parameter serialization
// - Credentials: include (sends cookies)
// - Error normalization (ApiError)
// ============================================
class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(
    baseUrl?: string,
    defaultTimeout: number = 30000,
    defaultRetries: number = 2
  ) {
    // Use environment variable or fallback to relative path
    this.baseUrl = baseUrl || 
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 
      '/api/v1';
    this.defaultTimeout = defaultTimeout;
    this.defaultRetries = defaultRetries;
  }

  // ============================================
  // buildUrl: Builds URL with query parameters
  // Handles both absolute and relative URLs
  // ============================================
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Absolute URL: use URL constructor
    if (this.baseUrl.startsWith('http://') || this.baseUrl.startsWith('https://')) {
      const url = new URL(endpoint, this.baseUrl);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
          }
        });
      }
      return url.toString();
    }

    // Relative URL: manual concatenation
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return url;
  }

  // ============================================
  // fetchWithTimeout: Wraps fetch with abort controller
  // 
  // Why: Browser fetch has no built-in timeout.
  // This creates an AbortController that aborts after `timeout` ms.
  // ============================================
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include', // Required for session cookies
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string>),
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }

  // ============================================
  // request: Core request method with retry logic
  // 
  // Retry strategy:
  // - Only retries on network errors or 5xx responses
  // - Does NOT retry on 4xx (client errors)
  // - Exponential backoff: 1s, 2s, 4s, ...
  // ============================================
  private async request<T>(
    endpoint: string,
    options: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      params,
      ...fetchOptions
    } = options;

    const url = this.buildUrl(endpoint, params);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout);

        let data: unknown;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // ============================================
        // Error handling: Normalize API errors
        // - 401: Unauthorized (AuthContext handles this)
        // - 4xx/5xx: Transform to ApiError with message
        // ============================================
        if (!response.ok) {
          // 401: Let AuthContext handle it
          if (response.status === 401) {
            throw new Error('Unauthorized');
          }
          
          let errorMessage: string;
          try {
            const data = await response.json();
            errorMessage =
              typeof data === 'object' && data !== null && 'error' in data
                ? String(data.error)
                : typeof data === 'object' && data !== null && 'message' in data
                ? String(data.message)
                : `Request failed with status ${response.status}`;
          } catch {
            errorMessage = `Request failed with status ${response.status}`;
          }
          
          const error = new ApiError(errorMessage, response.status, data);
          throw error;
        }

        return {
          data: data as T,
          status: response.status,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Client errors (4xx): Don't retry
        if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Last attempt: throw the error
        if (attempt === retries) {
          throw lastError;
        }

        // Exponential backoff: wait 1s, 2s, 4s, ...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed');
  }

  // ============================================
  // PUBLIC HTTP METHODS
  // Type-safe wrappers around request()
  // ============================================

  async get<T>(endpoint: string, params?: Record<string, any>, options?: ApiClientOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      params,
    });
    return response.data;
  }

  async post<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async put<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }

  async delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    const response = await this.request<T>(endpoint, { ...options, method: 'DELETE' });
    return response.data;
  }

  async patch<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.data;
  }
}

// ============================================
// SINGLETON EXPORT
// Re-export a single instance for the entire app
// ============================================
export const apiClient = new ApiClient();
import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7c025e45`;

interface ApiError {
  error: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private onAuthError: (() => void) | null = null;

  setAccessToken(token: string | null) {
    if (token) {
      // Basic token validation - check if it looks like a JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('⚠️ Invalid JWT format detected, clearing token');
        token = null;
      }
    }
    this.accessToken = token;
  }

  setAuthErrorHandler(handler: () => void) {
    this.onAuthError = handler;
  }

  private handleAuthError() {
    if (this.onAuthError) {
      this.onAuthError();
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Handle authorization header
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else if (endpoint.startsWith('/auth/')) {
      // For auth endpoints, use public anon key as fallback
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    } else {
      console.warn('No access token available for API request to:', endpoint);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If we can't parse JSON, create a generic error object
        data = { error: `Failed to parse response: ${response.statusText}` };
      }

      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        
        // Handle specific JWT/auth errors
        if (response.status === 401) {
          if (data.message?.includes('Invalid JWT') || 
              data.error?.includes('Invalid JWT') ||
              data.message?.includes('JWT')) {
            this.handleAuthError();
            throw new Error('Invalid JWT');
          }
          this.handleAuthError();
          throw new Error(data.error || data.message || 'Unauthorized');
        }
        
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      
      // Re-throw with more specific error handling
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Network error: ${error}`);
      }
    }
  }

  // Authentication
  async signup(userData: {
    email: string;
    password: string;
    name: string;
    address?: string;
    role: string;
  }) {
    return this.makeRequest<{ user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async signin(credentials: { email: string; password: string }) {
    return this.makeRequest<{ user: any; accessToken: string }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signout() {
    return this.makeRequest<{ success: boolean }>('/auth/signout', {
      method: 'POST',
    });
  }

  // Users
  async getUsers() {
    return this.makeRequest<{ users: any[] }>('/users');
  }

  async getUser(id: string) {
    return this.makeRequest<{ user: any }>(`/users/${id}`);
  }

  async updateUser(id: string, updates: any) {
    return this.makeRequest<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string) {
    return this.makeRequest<{ success: boolean }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Properties
  async getProperties() {
    return this.makeRequest<{ properties: any[] }>('/properties');
  }

  async createProperty(propertyData: any) {
    return this.makeRequest<{ property: any }>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  // Inspections
  async getInspections() {
    return this.makeRequest<{ inspections: any[] }>('/inspections');
  }

  async createInspection(inspectionData: any) {
    return this.makeRequest<{ inspection: any }>('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    });
  }

  async updateInspection(id: string, updates: any) {
    return this.makeRequest<{ inspection: any }>(`/inspections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Financial Records
  async getFinancialRecords() {
    return this.makeRequest<{ records: any[] }>('/financial-records');
  }

  // Pricing
  async getPricingSettings() {
    return this.makeRequest<{ pricingSettings: any[] }>('/pricing');
  }

  async updatePricing(inspectionType: string, pricingData: any) {
    return this.makeRequest<{ pricing: any }>(`/pricing/${inspectionType}`, {
      method: 'PUT',
      body: JSON.stringify(pricingData),
    });
  }

  // Invoices
  async getInvoices() {
    return this.makeRequest<{ invoices: any[] }>('/invoices');
  }

  async createInvoice(invoiceData: any) {
    return this.makeRequest<{ invoice: any }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  // Admin operations
  async clearAllProperties() {
    return this.makeRequest<{ 
      success: boolean; 
      message: string; 
      deletedCounts: {
        properties: number;
        inspections: number;
        financialRecords: number;
        invoices: number;
      }
    }>('/admin/clear-properties', {
      method: 'DELETE',
    });
  }

  async removeUnauthorizedAdmin() {
    return this.makeRequest<{ 
      success: boolean; 
      message: string; 
    }>('/admin/remove-unauthorized', {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Validate session
  async validateSession() {
    try {
      console.log('🔍 Validating session with token:', this.accessToken ? 'present' : 'missing');
      const result = await this.makeRequest<{ valid: boolean; user?: any; timestamp: string }>('/auth/validate');
      console.log('✅ Session validation result:', result.valid ? 'valid' : 'invalid');
      return result;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
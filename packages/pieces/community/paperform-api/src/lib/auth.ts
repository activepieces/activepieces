import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export interface PaperformAuth {
  auth: string;
}

export const paperformCommon = {
  baseUrl: 'https://api.paperform.co/v1',
  
  // Helper function to create authenticated headers
  getAuthHeaders: (auth: PaperformAuth) => {
    return {
      'Authorization': `Bearer ${auth.auth}`,
      'Content-Type': 'application/json',
    };
  },

  // Helper function to make authenticated requests
  makeRequest: async (auth: PaperformAuth, endpoint: string, method: HttpMethod = HttpMethod.GET, body?: any) => {
    const headers = paperformCommon.getAuthHeaders(auth);
    
    return await httpClient.sendRequest({
      method,
      url: `${paperformCommon.baseUrl}${endpoint}`,
      headers,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.auth,
      },
    });
  },

  // Validate API key by making a test request
  validateApiKey: async (auth: PaperformAuth): Promise<{ valid: true } | { valid: false; error: string }> => {
    try {
      await paperformCommon.makeRequest(auth, '/forms');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Paperform API key.',
      };
    }
  },
}; 
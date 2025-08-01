import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const authGuide = `
To obtain your Aircall API credentials, follow these steps:

1. Log in to your Aircall account.
2. Navigate to **Settings->Developer** section.
3. Generate your API credentials.
4. The credentials will be in the format: username:password
5. Enter the username and password separately below.

Note: Aircall uses Basic Authentication, so your credentials will be automatically encoded.
`;

export const aircallAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    username: Property.ShortText({
      displayName: 'API Username',
      description: 'Your Aircall API username (first part of your API key)',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'API Password',
      description: 'Your Aircall API password (second part of your API key)',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Aircall API base URL (default: https://api.aircall.io/v1)',
      required: false,
      defaultValue: 'https://api.aircall.io/v1',
    }),
  },
  validate: async ({ auth }) => {
    // Basic format validation
    if (!auth.username || auth.username.trim().length === 0) {
      return {
        valid: false,
        error: 'API Username is required',
      };
    }
    
    if (!auth.password || auth.password.trim().length === 0) {
      return {
        valid: false,
        error: 'API Password is required',
      };
    }
    
    // Validate base URL format
    const baseUrl = auth.baseUrl || 'https://api.aircall.io/v1';
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      return {
        valid: false,
        error: 'Base URL must be a valid URL starting with http:// or https://',
      };
    }

    // Test API connection with faster timeout and correct endpoint
    try {
      const credentials = Buffer.from(`${auth.username.trim()}:${auth.password.trim()}`).toString('base64');
      
      // Use /users endpoint which is more reliable for authentication testing
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/users`,
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Activepieces-Aircall/1.0',
          'Accept': 'application/json',
        },
        timeout: 5000, // Reduced to 5 seconds for faster feedback
      });

      if (response.status >= 200 && response.status < 300) {
        return { valid: true };
      } else {
        return {
          valid: false,
          error: `Authentication failed with status ${response.status}. Please verify your credentials.`,
        };
      }
      
    } catch (error) {
      console.error('Aircall authentication error:', error);
      
      if (error && typeof error === 'object') {
        const errorObj = error as any;
        
        // Handle HTTP status errors with specific messages
        if (errorObj.response?.status) {
          const status = errorObj.response.status;
          switch (status) {
            case 401:
              return {
                valid: false,
                error: 'Invalid API credentials. Please check your username and password.',
              };
            case 403:
              return {
                valid: false,
                error: 'Access denied. Your API credentials may not have sufficient permissions.',
              };
            case 404:
              return {
                valid: false,
                error: 'API endpoint not found. Please verify your base URL.',
              };
            case 429:
              return {
                valid: false,
                error: 'Too many requests. Please wait a moment and try again.',
              };
            case 500:
            case 502:
            case 503:
              return {
                valid: false,
                error: 'Aircall API is temporarily unavailable. Please try again in a few minutes.',
              };
            default:
              return {
                valid: false,
                error: `Connection failed (${status}). Please check your credentials and try again.`,
              };
          }
        }
        
        // Handle network and timeout errors
        if (errorObj.code === 'ENOTFOUND') {
          return {
            valid: false,
            error: 'Cannot reach Aircall API. Please check your internet connection and base URL.',
          };
        }
        
        if (errorObj.code === 'ECONNREFUSED') {
          return {
            valid: false,
            error: 'Connection refused. Please verify the API base URL.',
          };
        }
        
        if (errorObj.code === 'ETIMEDOUT' || errorObj.message?.includes('timeout')) {
          return {
            valid: false,
            error: 'Connection timeout. Please check your network connection or try again.',
          };
        }
      }
      
      // Generic error fallback
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      return {
        valid: false,
        error: `Unable to connect: ${errorMessage}. Please verify your credentials and network connection.`,
      };
    }
  },
});
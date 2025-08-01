import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HttpError } from './types';

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
    const baseUrl = (auth.baseUrl || 'https://api.aircall.io/v1').replace(/\/$/, '');
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      return {
        valid: false,
        error: 'Base URL must be a valid URL starting with http:// or https://',
      };
    }

    const trimmedUsername = auth.username.trim();
    const trimmedPassword = auth.password.trim();
    
    // Basic format validation
    if (trimmedUsername.includes(':') || trimmedPassword.includes(':')) {
      return {
        valid: false,
        error: 'Username and password should not contain colons. Please enter them separately.',
      };
    }
    
    if (trimmedUsername.length < 2 || trimmedPassword.length < 2) {
      return {
        valid: false,
        error: 'Username and password must be at least 2 characters long.',
      };
    }

    // Test authentication with the API
    try {
      const credentials = Buffer.from(`${trimmedUsername}:${trimmedPassword}`).toString('base64');
      
      console.log('Testing Aircall authentication with base URL:', baseUrl);
      
      // Try the ping endpoint first, fallback to users endpoint
      let response;
      try {
        response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/ping`,
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Activepieces-Aircall/1.0',
            'Accept': 'application/json',
          },
          timeout: 10000, // Increased timeout to 10 seconds
        });
        console.log('Ping endpoint successful, status:', response.status);
      } catch (pingError) {
        // If ping fails, try the users endpoint as fallback
        console.warn('Ping endpoint failed, trying users endpoint:', pingError);
        response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${baseUrl}/users`,
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Activepieces-Aircall/1.0',
            'Accept': 'application/json',
          },
          timeout: 10000,
        });
        console.log('Users endpoint successful, status:', response.status);
      }

      if (response.status >= 200 && response.status < 300) {
        return { 
          valid: true,
          message: 'Authentication successful. Connected to Aircall API.'
        };
      } else if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid API credentials. Please check your username and password.',
        };
      } else if (response.status === 403) {
        return {
          valid: false,
          error: 'Access denied. Your API credentials may not have sufficient permissions.',
        };
      } else {
        return {
          valid: false,
          error: `Authentication failed (${response.status}). Please verify your credentials.`,
        };
      }
      
    } catch (error) {
      console.warn('Aircall validation error:', error);
      
      if (error && typeof error === 'object') {
        const errorObj = error as HttpError;
        
        // Handle specific HTTP errors
        if (errorObj.response?.status === 401) {
          return {
            valid: false,
            error: 'Invalid API credentials. Please check your username and password.',
          };
        }
        
        if (errorObj.response?.status === 403) {
          return {
            valid: false,
            error: 'Access denied. Your API credentials may not have sufficient permissions.',
          };
        }
        
        if (errorObj.response?.status === 404) {
          return {
            valid: false,
            error: 'API endpoint not found. Please check your base URL.',
          };
        }
        
        if (errorObj.response?.status === 429) {
          return {
            valid: false,
            error: 'Rate limit exceeded. Please wait a moment and try again.',
          };
        }
        
        if (errorObj.response?.status && errorObj.response.status >= 500) {
          return {
            valid: false,
            error: 'Aircall API is temporarily unavailable. Please try again later.',
          };
        }
        
        // Network errors
        if (errorObj.code === 'ENOTFOUND' || errorObj.code === 'ECONNREFUSED') {
          return {
            valid: false,
            error: 'Cannot connect to Aircall API. Check your network connection and base URL.',
          };
        }
        
        if (errorObj.code === 'ETIMEDOUT' || errorObj.message?.includes('timeout')) {
          return {
            valid: false,
            error: 'Request timeout. Please check your network connection and try again.',
          };
        }

        // SSL/TLS errors
        if (errorObj.code?.includes('CERT') || errorObj.message?.includes('certificate')) {
          return {
            valid: false,
            error: 'SSL certificate error. Please contact support.',
          };
        }
      }
      
      // Generic error fallback
      return {
        valid: false,
        error: `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please verify your credentials and try again.`,
      };
    }
  },
});
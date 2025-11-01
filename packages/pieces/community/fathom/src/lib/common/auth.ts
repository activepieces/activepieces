import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const fathomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
    Enter your Fathom API key. You can generate one from your Fathom account settings.
    
    **How to get your API key:**
    1. Log in to your Fathom account
    2. Go to Settings
    3. Navigate to API Keys section
    4. Create a new API key or copy an existing one
    5. Paste the key here
  `,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API Key is required.',
      };
    }

    // Sanitize the API key by trimming whitespace and removing any newlines
    const sanitizedAuth = (auth as string).trim().replace(/[\r\n]/g, '');

    if (!sanitizedAuth) {
      return {
        valid: false,
        error: 'API Key cannot be empty after removing whitespace.',
      };
    }

    try {
      // Validate the API key by making a test request
      // Using /meetings endpoint for validation as it's available to all API users
      await makeRequest(sanitizedAuth, HttpMethod.GET, '/meetings');

      return {
        valid: true,
        message: 'API key validated successfully. Connected to Fathom.',
      };
    } catch (error: any) {
      // Handle authentication errors
      if (error.message.includes('Not Found') || error.message.includes('404')) {
        return {
          valid: false,
          error: 'API endpoint not found. Please ensure you are using a valid Fathom API key.',
        };
      }

      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your API key and try again.',
        };
      }

      if (error.message.includes('Forbidden') || error.message.includes('403')) {
        return {
          valid: false,
          error: 'The API key does not have permission to access this resource. Please check your API key permissions.',
        };
      }

      if (error.message.includes('Rate Limit') || error.message.includes('429')) {
        return {
          valid: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        };
      }

      if (error.message.includes('Network')) {
        return {
          valid: false,
          error: 'Network error. Please check your internet connection and try again.',
        };
      }

      return {
        valid: false,
        error: `Authentication failed: ${error.message}. Please verify your API key is correct and has the necessary permissions.`,
      };
    }
  },
});


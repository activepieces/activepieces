import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest, ApitemplateAuthConfig } from './client';
import { regionDropdown } from './props';
import { HttpMethod } from '@activepieces/pieces-common';

export const ApitemplateAuth = PieceAuth.CustomAuth({
  description: `
To obtain your API key:
1. Go to https://app.apitemplate.io/.
2. Navigate to API Integration section.
3. Copy your API key.

Select the region closest to your location for better performance.
`,
  props: {
    region: regionDropdown,
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your APITemplate.io API key',
      required: true,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    if (!auth?.apiKey) {
      return {
        valid: false,
        error: 'API Key is required',
      };
    }

    if (!auth?.region) {
      return {
        valid: false,
        error: 'Region selection is required',
      };
    }

    // Type-safe auth casting
    const authConfig = auth as ApitemplateAuthConfig;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/account-information',
        undefined,
        undefined,
        authConfig.region
      );

      // Check if we got a valid response
      if (response && response.status === 'success') {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: 'Invalid API response. Please check your credentials.',
      };
    } catch (error: any) {
      return {
        valid: false,
        error: `Authentication failed: ${
          error.message || 'Invalid API Key or region configuration'
        }`,
      };
    }
  },
});

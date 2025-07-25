import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest, APITEMPLATE_REGIONS, ApitemplateRegion } from './client';
import { regionDropdown } from './props';
import { HttpMethod } from '@activepieces/pieces-common';

interface ApitemplateAuth {
  apiKey: string;
  region: ApitemplateRegion;
}

export const ApitemplateAuth = PieceAuth.CustomAuth({
  description: `
To obtain your API key:
1. Go to https://app.apitemplate.io/
2. Navigate to API Integration section
3. Copy your API key
`,
  props: {
    region: regionDropdown,
    apiKey: Property.SecretText({
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

    try {
      await makeRequest(
        auth.apiKey as string,
        HttpMethod.GET,
        '/list-templates',
        undefined,
        undefined,
        auth.region as ApitemplateRegion
      );
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          'Invalid API Key or region configuration. Please check your credentials.',
      };
    }
  },
});

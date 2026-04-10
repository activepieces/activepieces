import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HedyApiClient } from '../common/client';

export interface HedyAuthValue {
  apiKey: string;
  region: string;
}

export const hedyAuth = PieceAuth.CustomAuth({
  description:
    'Connect your Hedy account using an API key from Settings → API.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Generate an API key from your Hedy dashboard under Settings → API, then paste the key here (it begins with `hedy_live_`).',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'Select EU if your Hedy account uses EU data residency.',
      required: false,
      defaultValue: 'us',
      options: {
        options: [
          { label: 'US (Default)', value: 'us' },
          { label: 'EU', value: 'eu' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    const { apiKey, region } = auth as HedyAuthValue;

    if (!apiKey || typeof apiKey !== 'string') {
      return {
        valid: false,
        error: 'Please provide a valid API key.',
      };
    }

    const client = new HedyApiClient(apiKey, region ?? 'us');
    try {
      await client.request({
        method: HttpMethod.GET,
        path: '/sessions',
        queryParams: {
          limit: 1,
        },
      });

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid API key. Please verify the key in your Hedy dashboard and try again.',
      };
    }
  },
});

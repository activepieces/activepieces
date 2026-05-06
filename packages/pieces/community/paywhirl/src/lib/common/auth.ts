import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { tr } from 'zod/v4/locales';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const paywhirlAuth = PieceAuth.CustomAuth({
  displayName: 'API Key',
  description: 'Authenticate with your Paywhirl API Key',
  required: true,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Paywhirl API Key',
      required: true,
    }),
    api_secret: Property.ShortText({
      displayName: 'API Secret',
      description: 'Your Paywhirl API Secret',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(
          auth.api_key,
          auth.api_secret,
          HttpMethod.GET,
          '/test'
        );
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});

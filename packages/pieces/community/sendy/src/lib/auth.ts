import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { getLists } from './api';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export type SendyAuthType = { apiKey: string; domain: string; brandId: string };

const markdownDescription = `
Your sendy domain should be the base URL of your Sendy installation. Example: https://sendy.example.com

Follow these instructions to get your Sendy API Key:

1. Visit the Settings page of your Sendy domain: _https://sendy-domain.com_/settings
2. Once on the website, locate and click on the API Key and copy it.

Get your Brand ID from the main Brands page. The ID is the first column in the table.
`;

export const sendyAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    domain: Property.ShortText({
      displayName: 'Sendy Domain',
      description: 'The domain of your Sendy account',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key for your Sendy account',
      required: true,
    }),
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description:
        'The brand ID that will be associated to this connection. Brand IDs can be found on the main Brands page.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await propsValidation.validateZod(auth, {
        domain: z.string().url(),
        apiKey: z.string().min(1).regex(/^\S+$/),
        brandId: z.string().regex(/^[0-9]+$/),
      });
      await validateAuth(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});

const validateAuth = async (auth: SendyAuthType) => {
  const response = await getLists(auth);
  if (response.success !== true) {
    throw new Error(
      `Authentication failed. Please check your domain and API key and try again. ${response.text}`
    );
  }
};

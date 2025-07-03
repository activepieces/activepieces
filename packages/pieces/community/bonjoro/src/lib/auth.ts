import { PieceAuth } from '@activepieces/pieces-framework';
import { getCampaigns } from './api';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export type BonjoroAuthType = { apiKey: string };

export const bonjoroAuth = PieceAuth.CustomAuth({
  description: 'Authenticate with your Bonjoro account',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key for your Bonjoro account',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await propsValidation.validateZod(auth, {
        apiKey: z.string().min(1),
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

const validateAuth = async (auth: BonjoroAuthType) => {
  const response = await getCampaigns(auth);
  if (response.success !== true) {
    throw new Error(
      'Authentication failed. Please check your domain and API key and try again.'
    );
  }
};

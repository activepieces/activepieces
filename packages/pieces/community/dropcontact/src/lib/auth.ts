import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export type DropcontactAuthType = { apiKey: string };

export const dropcontactAuth = PieceAuth.CustomAuth({
  description:
    'Authenticate with your Dropcontact account. Get your API key from your Dropcontact account settings.',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API key for your Dropcontact account',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
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

const validateAuth = async (auth: DropcontactAuthType) => {
  await propsValidation.validateZod(auth, {
    apiKey: z.string().min(1),
  });

  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: 'https://api.dropcontact.io/batch',
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': auth.apiKey,
    },
    body: {
      data: [{ email: 'test@test.com' }],
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'Authentication failed. Please check your API key and try again.'
    );
  }
};

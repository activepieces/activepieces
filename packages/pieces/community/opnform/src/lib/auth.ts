import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { API_URL_DEFAULT, opnformCommon } from './common';

export const opnformAuth = PieceAuth.CustomAuth({
  description:
    'Please use your Opnform API Key. [Click here for create API Key](https://opnform.com/home?user-settings=access-tokens)',
  required: true,
  props: {
    baseApiUrl: Property.ShortText({
      displayName: `Base URL (Default: ${API_URL_DEFAULT})`,
      required: false,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async (
    auth
  ): Promise<{ valid: true } | { valid: false; error: string }> => {
    try {
      const isValid = await opnformCommon.validateAuth(auth.auth);
      if (isValid) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API Key' };
    } catch (e) {
      return { valid: false, error: 'Invalid API Key' };
    }
  },
});

import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  captainDataClient,
  CaptainDataError,
  VALIDATE_TIMEOUT_MS,
} from './common';

const captainDataAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description:
    'Copy your personal API key from Captain Data Developer Settings (https://app.captaindata.com/developers).',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API key',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Legacy v3 field, no longer used. Leave empty.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await captainDataClient.request({
        apiKey: auth.apiKey,
        timeoutMs: VALIDATE_TIMEOUT_MS,
        path: '/quotas',
        operation: 'validate API key',
      });
      return { valid: true };
    } catch (error) {
      if (
        error instanceof CaptainDataError &&
        (error.status === 401 || error.status === 403)
      ) {
        return { valid: false, error: 'Invalid Captain Data API key.' };
      }
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not reach Captain Data to validate the API key.',
      };
    }
  },
});

type CaptainDataAuthType = {
  apiKey: string;
  projectId?: string;
};

export { captainDataAuth };
export type { CaptainDataAuthType };

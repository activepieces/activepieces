import { PieceAuth } from '@activepieces/pieces-framework';
import { enrichlayerApiCall } from './common/client';
import { ENDPOINTS } from './common/constants';

export const enrichlayerAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    `You can obtain your API key from [Dashboard Settings](https://enrichlayer.com/dashboard/api-key/).`,
  required: true,
  validate: async ({ auth }) => {
    try {
       await enrichlayerApiCall(
            auth as string,
            ENDPOINTS.CREDIT_BALANCE,
            {},
          );
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Could not validate API key' };
    }
  },
});
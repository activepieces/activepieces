import { PieceAuth } from '@activepieces/pieces-framework';
import { FireberryClient, fireberryUtils } from './common/client';

export const fireberryAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Fireberry API token. In Fireberry open Settings (gear icon) > Integration > API Forms (API token) and copy the token. The token acts with the permissions of the user it belongs to.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await new FireberryClient(auth).getObjectsMetadata();
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: fireberryUtils.errorMessage(error),
      };
    }
  },
});

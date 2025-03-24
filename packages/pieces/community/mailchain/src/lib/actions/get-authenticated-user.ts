import { createAction } from '@activepieces/pieces-framework';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Mailchain } from '@mailchain/sdk';
import { mailchainCommon } from '../common/common';

export const getAuthenticatedUser = createAction({
  name: 'getAuthenticatedUser',
  displayName: 'Get Authenticated User',
  description: 'Get the authenticated user to the Mailchain Protocol',
  auth: mailchainCommon.auth,
  requireAuth: true,
  props: {},
  async run({ auth }) {
    try {
      const secretRecoveryPhrase = auth;

      const mailchain =
        Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase);

      const user = await mailchain.user();
      return user;
    } catch (error) {
      console.error('Error getting authenticated user (mailchain)', error);
      throw error;
    }
  },
});

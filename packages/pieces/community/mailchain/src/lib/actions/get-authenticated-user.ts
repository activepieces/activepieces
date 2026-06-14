import { createAction } from '@activepieces/pieces-framework';
import { Mailchain } from '@mailchain/sdk';
import { mailchainCommon } from '../common/common';

export const getAuthenticatedUser = createAction({
  name: 'getAuthenticatedUser',
  displayName: 'Get Authenticated User',
  description: 'Get the authenticated user to the Mailchain Protocol',
  audience: 'both',
  aiMetadata: { description: 'Resolves the Mailchain identity for the connected secret recovery phrase, returning the account username and Mailchain address. Use to discover the sender identity or verify credentials before sending mail. Read-only and safe to repeat.', idempotent: true },
  auth: mailchainCommon.auth,
  requireAuth: true,
  props: {},
  async run({ auth }) {
    try {
      const secretRecoveryPhrase = auth;

      const mailchain =
        Mailchain.fromSecretRecoveryPhrase(secretRecoveryPhrase.secret_text);

      const user = await mailchain.user();
      return user;
    } catch (error) {
      console.error('Error getting authenticated user (mailchain)', error);
      throw error;
    }
  },
});

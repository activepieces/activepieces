import { PieceAuth } from '@activepieces/pieces-framework';
import { sentApi, SentApiError } from './common/api';
import { Account } from './common/types';

export const sentAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'In the [Sent Dashboard](https://app.sent.dm), open Settings → API Keys, create or copy an API key, and paste it here. Organization keys can select a Sender Profile in each step.',
  required: true,
  validate: async ({ auth }) => {
    try {
      sentApi.data(
        await sentApi.request<Account>({ apiKey: auth, path: '/me' })
      );
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof SentApiError
            ? error.message
            : 'Could not validate this Sent connection.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const account = sentApi.data(
        await sentApi.request<Account>({ apiKey: auth, path: '/me' })
      );
      const label = account.email || account.name;
      return label && !label.includes(auth) ? label : undefined;
    } catch {
      return undefined;
    }
  },
});

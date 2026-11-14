import { createAction } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentApi } from '../common/api';

export const getAccount = createAction({
  auth: sentAuth,
  name: 'get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description:
    'Get the connected account and its messaging channel configuration.',
  audience: 'both',
  aiMetadata: {
    description:
      'Inspect the connected Sent account and configured channels. Safe to retry; takes no profile override.',
    idempotent: true,
  },
  props: {},
  run: async ({ auth }) =>
    sentApi.request({ apiKey: auth.secret_text, path: '/me' }),
});

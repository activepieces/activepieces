import { createAction } from '@activepieces/pieces-framework';
import { removeAcAuth } from '../common/auth';
import { removeAcApi } from '../common/client';

export const getAccountCredits = createAction({
  auth: removeAcAuth,
  name: 'get_account_credits',
  displayName: 'Get Account Credits',
  description: 'Get the remaining remove.ac credit balance and its breakdown.',
  audience: 'both',
  aiMetadata: {
    description: 'Check the remaining remove.ac API credits before processing images. This call is free.',
    idempotent: true,
  },
  classification: 'READ',
  props: {},
  async run({ auth }) {
    return removeAcApi.getAccountCredits(auth.secret_text);
  },
});

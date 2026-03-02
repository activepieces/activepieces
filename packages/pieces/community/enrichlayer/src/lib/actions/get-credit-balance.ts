import { createAction } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getCreditBalance = createAction({
  name: 'get_credit_balance',
  auth: enrichlayerAuth,
  displayName: 'Get Credit Balance',
  description:
    'View your Enrich Layer API credit balance (0 credits)',
  props: {},
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.CREDIT_BALANCE,
      {},
    );
  },
});

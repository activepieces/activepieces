import { createAction } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getCreditBalance = createAction({
  name: 'get_credit_balance',
  auth: enrichlayerAuth,
  displayName: 'Get Credit Balance',
  description:
    'View your Enrich Layer API credit balance (0 credits)',
  props: {},
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.CREDIT_BALANCE,
      {},
    );
  },
});

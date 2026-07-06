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
  audience: 'both',
  aiMetadata: {
    description:
      'Read the remaining credit balance on the connected Enrich Layer API account. Pick this to check available quota before running billed enrichment or search actions; takes no input, costs no credits, and is read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.CREDIT_BALANCE,
      {},
    );
  },
});

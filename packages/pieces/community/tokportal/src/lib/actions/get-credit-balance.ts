import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';

export const getCreditBalance = createAction({
  auth: tokportalAuth,
  name: 'get_credit_balance',
  displayName: 'Get Credit Balance',
  description: 'Retrieves the current credit balance of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the TokPortal credit balance (total_credits and upcoming expirations). Check it before Create Bundle, which debits credits immediately. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/credits/balance',
    });
    return response.data ?? response;
  },
});

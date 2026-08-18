import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';

export const getCreditCosts = createAction({
  auth: tokportalAuth,
  name: 'get_credit_costs',
  displayName: 'Get Credit Costs',
  description: 'Retrieves the effective credit price of every action for this workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the TokPortal credit price list (account creation per platform and country, videos, warming terms, edits) to estimate the cost of Create Bundle. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/credit-costs',
    });
    return response.data ?? response;
  },
});

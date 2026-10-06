import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleAdsAuth } from '../auth';
import { API_VERSION, GOOGLE_ADS_API_ROOT, normalizeCustomerId } from '../common/client';

export const customApiCall = createCustomApiCallAction({
  auth: googleAdsAuth,
  baseUrl: () => GOOGLE_ADS_API_ROOT,
  description: `Call any Google Ads API endpoint. The path must start with the API version: /${API_VERSION}/customers/{customerId}/... (e.g. /${API_VERSION}/customers/1234567890/campaignBudgets:mutate). Base URL: ${GOOGLE_ADS_API_ROOT}.`,
  authMapping: async (auth) => {
    const rawLoginCustomerId: unknown = auth.props?.['loginCustomerId'];
    const loginCustomerId = typeof rawLoginCustomerId === 'string' ? rawLoginCustomerId.trim() : undefined;
    return {
      Authorization: `Bearer ${auth.access_token}`,
      ...(loginCustomerId ? { 'login-customer-id': normalizeCustomerId(loginCustomerId) } : {}),
    };
  },
});

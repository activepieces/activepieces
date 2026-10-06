import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleAdsAuth } from '../auth';
import { API_VERSION, GOOGLE_ADS_API_ROOT, isRecord, normalizeCustomerId } from '../common/client';
import { DATA_MANAGER_API_ROOT, REQUEST_STATUS_URL } from '../common/data-manager';

function assertAllowedUrl(propsValue: Record<string, unknown>): void {
  const urlProp = propsValue['url'];
  const url = isRecord(urlProp) ? urlProp['url'] : undefined;
  if (typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))) {
    return;
  }
  const origin = originOf(url);
  if (origin === null || !ALLOWED_ORIGINS.includes(origin)) {
    throw new Error(
      `Custom API Call only sends your Google Ads credentials to ${ALLOWED_ORIGINS.join(' or ')}; got "${url}". Use a path relative to ${GOOGLE_ADS_API_ROOT} (e.g. /${API_VERSION}/customers/1234567890/googleAds:search) or a full URL on one of those hosts.`
    );
  }
}

function originOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.username || parsed.password ? null : parsed.origin;
  } catch {
    return null;
  }
}

export const customApiCall = createCustomApiCallAction({
  auth: googleAdsAuth,
  baseUrl: () => GOOGLE_ADS_API_ROOT,
  description: `Call any Google Ads API endpoint. The path must start with the API version: /${API_VERSION}/customers/{customerId}/... (e.g. /${API_VERSION}/customers/1234567890/campaignBudgets:mutate). Base URL: ${GOOGLE_ADS_API_ROOT}. Data Manager API endpoints take a full URL on ${DATA_MANAGER_API_ROOT} (e.g. GET ${REQUEST_STATUS_URL}?requestId=... to check a Customer Match upload).`,
  authMapping: async (auth, propsValue) => {
    assertAllowedUrl(propsValue);
    const rawLoginCustomerId: unknown = auth.props?.['loginCustomerId'];
    const loginCustomerId = typeof rawLoginCustomerId === 'string' ? rawLoginCustomerId.trim() : undefined;
    return {
      Authorization: `Bearer ${auth.access_token}`,
      ...(loginCustomerId ? { 'login-customer-id': normalizeCustomerId(loginCustomerId) } : {}),
    };
  },
});

const ALLOWED_ORIGINS = [GOOGLE_ADS_API_ROOT, DATA_MANAGER_API_ROOT];

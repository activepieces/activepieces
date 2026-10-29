import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { addCustomerMatchData } from './lib/actions/add-customer-match-data';
import { createRecord } from './lib/actions/create-record';
import { deleteRecord } from './lib/actions/delete-record';
import { removeCustomerMatchData } from './lib/actions/remove-customer-match-data';
import { retrieveReport } from './lib/actions/retrieve-report';
import { searchRecords } from './lib/actions/search-records';
import { updateRecord } from './lib/actions/update-record';
import { googleAdsAuth } from './lib/auth';
import { googleAdsClient } from './lib/common/client';
import { googleAdsUtils } from './lib/common/utils';
import { newRecord } from './lib/triggers/new-record';

export const googleAds = createPiece({
  displayName: 'Google Ads',
  description: 'Manage campaigns, ad groups, ads, keywords, audiences and performance reports in Google Ads.',
  auth: googleAdsAuth,
  minimumSupportedRelease: '0.88.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-ads.png',
  categories: [PieceCategory.MARKETING],
  authors: ['fabio-kozlowski'],
  actions: [
    createRecord,
    updateRecord,
    deleteRecord,
    searchRecords,
    retrieveReport,
    addCustomerMatchData,
    removeCustomerMatchData,
    createCustomApiCallAction({
      auth: googleAdsAuth,
      baseUrl: () => googleAdsClient.baseUrl(),
      description:
        'Call any Google Ads API endpoint. The path must start with the API version: /v25/customers/{customerId}/... (e.g. /v25/customers/1234567890/campaignBudgets:mutate). Data Manager API endpoints take a full URL on https://datamanager.googleapis.com (e.g. GET https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=... to check a Customer Match upload).',
      authMapping: async (auth, propsValue) => {
        const urlProp: unknown = propsValue['url'];
        googleAdsUtils.assertAllowedUrl(typeof urlProp === 'object' && urlProp !== null ? Object.fromEntries(Object.entries(urlProp))['url'] : undefined);
        const raw: unknown = auth.props?.['loginCustomerId'];
        const loginCustomerId = typeof raw === 'string' ? raw.trim() : undefined;
        return {
          Authorization: `Bearer ${auth.access_token}`,
          ...(loginCustomerId ? { 'login-customer-id': googleAdsUtils.normalizeCustomerId(loginCustomerId) } : {}),
        };
      },
    }),
  ],
  triggers: [newRecord],
});

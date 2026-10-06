import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { addCustomerMatchData } from './lib/actions/add-customer-match-data';
import { createRecord } from './lib/actions/create-record';
import { customApiCall } from './lib/actions/custom-api-call';
import { deleteRecord } from './lib/actions/delete-record';
import { removeCustomerMatchData } from './lib/actions/remove-customer-match-data';
import { retrieveReport } from './lib/actions/retrieve-report';
import { searchRecords } from './lib/actions/search-records';
import { updateRecord } from './lib/actions/update-record';
import { googleAdsAuth } from './lib/auth';
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
    customApiCall,
  ],
  triggers: [newRecord],
});

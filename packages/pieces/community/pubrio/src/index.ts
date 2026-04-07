import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { searchCompanies } from './lib/actions/search-companies';
import { lookupCompany } from './lib/actions/lookup-company';
import { enrichCompany } from './lib/actions/enrich-company';
import { searchPeople } from './lib/actions/search-people';
import { lookupPerson } from './lib/actions/lookup-person';
import { enrichPerson } from './lib/actions/enrich-person';
import { revealContact } from './lib/actions/reveal-contact';
import { searchJobs } from './lib/actions/search-jobs';
import { searchNews } from './lib/actions/search-news';
import { findSimilarCompanies } from './lib/actions/find-similar-companies';
import { lookupTechnology } from './lib/actions/lookup-technology';
import { linkedinPersonLookup } from './lib/actions/linkedin-person-lookup';
import { searchAds } from './lib/actions/search-ads';
import { linkedinCompanyLookup } from './lib/actions/linkedin-company-lookup';
import { lookupJob } from './lib/actions/lookup-job';
import { lookupNews } from './lib/actions/lookup-news';
import { lookupAdvertisement } from './lib/actions/lookup-advertisement';
import { lookupLookalike } from './lib/actions/lookup-lookalike';
import { batchRedeemContacts } from './lib/actions/batch-redeem-contacts';
import { queryBatchRedeem } from './lib/actions/query-batch-redeem';
import { createMonitor } from './lib/actions/create-monitor';
import { updateMonitor } from './lib/actions/update-monitor';
import { getMonitor } from './lib/actions/get-monitor';
import { listMonitors } from './lib/actions/list-monitors';
import { deleteMonitor } from './lib/actions/delete-monitor';
import { duplicateMonitor } from './lib/actions/duplicate-monitor';
import { testRunMonitor } from './lib/actions/test-run-monitor';
import { revealMonitorSignature } from './lib/actions/reveal-monitor-signature';
import { pubrioWebhookTrigger } from './lib/triggers/webhook';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const pubrioAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Go to dashboard.pubrio.com → Settings → API Keys → Create New Key → copy the key here.',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.pubrio.com/timezones',
        headers: {
          'pubrio-api-key': `${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (error) {
      return { valid: false, error: 'Error validating API key' };
    }
  },
});

export const pubrio = createPiece({
  displayName: 'Pubrio',
  auth: pubrioAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://pubrio.com/favicon.ico',
  authors: ['pubrio'],
  actions: [
    searchCompanies,
    lookupCompany,
    enrichCompany,
    searchPeople,
    lookupPerson,
    enrichPerson,
    revealContact,
    searchJobs,
    searchNews,
    findSimilarCompanies,
    lookupTechnology,
    linkedinPersonLookup,
    searchAds,
    linkedinCompanyLookup,
    lookupJob,
    lookupNews,
    lookupAdvertisement,
    lookupLookalike,
    batchRedeemContacts,
    queryBatchRedeem,
    createMonitor,
    updateMonitor,
    getMonitor,
    listMonitors,
    deleteMonitor,
    duplicateMonitor,
    testRunMonitor,
    revealMonitorSignature,
  ],
  triggers: [pubrioWebhookTrigger],
});

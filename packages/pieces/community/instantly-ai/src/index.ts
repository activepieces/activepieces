import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { instantlyAuth } from './lib/auth';
import { instantlyClient } from './lib/common/client';

import { createCampaignAction } from './lib/actions/create-campaign';
import { createLeadListAction } from './lib/actions/create-lead-list';
import { addLeadToCampaignAction } from './lib/actions/add-lead-to-campaign';
import { searchCampaignsAction } from './lib/actions/search-campaigns';
import { searchLeadsAction } from './lib/actions/search-leads';
import { createLeadAction } from './lib/actions/create-lead';
import { getLeadAction } from './lib/actions/get-lead';
import { updateLeadAction } from './lib/actions/update-lead';
import { deleteLeadAction } from './lib/actions/delete-lead';
import { getCampaignAction } from './lib/actions/get-campaign';
import { updateCampaignAction } from './lib/actions/update-campaign';
import { activateCampaignAction } from './lib/actions/activate-campaign';
import { pauseCampaignAction } from './lib/actions/pause-campaign';
import { getCampaignAnalyticsAction } from './lib/actions/get-campaign-analytics';

import { emailActivityTrigger } from './lib/triggers/email-activity';
import { leadStatusChangedTrigger } from './lib/triggers/lead-status-changed';
import { meetingTrigger } from './lib/triggers/meeting';
import { campaignAccountTrigger } from './lib/triggers/campaign-account';

export const instantlyAi = createPiece({
  displayName: 'Instantly',
  description:
    'Powerful cold email outreach and lead engagement platform.',
  auth: instantlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/instantly-ai.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: [],
  actions: [
    createCampaignAction,
    getCampaignAction,
    updateCampaignAction,
    activateCampaignAction,
    pauseCampaignAction,
    searchCampaignsAction,
    getCampaignAnalyticsAction,
    createLeadAction,
    getLeadAction,
    updateLeadAction,
    deleteLeadAction,
    searchLeadsAction,
    addLeadToCampaignAction,
    createLeadListAction,
    createCustomApiCallAction({
      auth: instantlyAuth,
      baseUrl: () => instantlyClient.BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${extractAuthToken(auth)}`,
      }),
    }),
  ],
  triggers: [
    emailActivityTrigger,
    leadStatusChangedTrigger,
    meetingTrigger,
    campaignAccountTrigger,
  ],
});

function hasProperty<K extends PropertyKey>(
  obj: object,
  key: K,
): obj is Record<K, unknown> {
  return key in obj;
}

function extractAuthToken(auth: unknown): string {
  if (typeof auth === 'object' && auth !== null && hasProperty(auth, 'secret_text')) {
    const { secret_text } = auth;
    if (typeof secret_text === 'string') {
      return secret_text;
    }
  }
  return String(auth);
}

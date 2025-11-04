import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createCampaignAction } from './lib/actions/create-campaign';
import { createLeadListAction } from './lib/actions/create-lead-list';
import { addLeadToCampaignAction } from './lib/actions/add-lead-to-campaign';
import { searchCampaignsAction } from './lib/actions/search-campaigns';
import { searchLeadsAction } from './lib/actions/search-leads';
import { campaignStatusChangedTrigger } from './lib/triggers/campaign-status-changed';
import { newLeadAddedTrigger } from './lib/triggers/new-lead-added';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';

const markdownDescription = `
You can obtain an API key from **Settings->Integrations->API Keys**.
`;

export const instantlyAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
})

export const instantlyAi = createPiece({
  displayName: 'Instantly.ai',
  description: 'Powerful cold email outreach and lead engagement platform.',
  auth: instantlyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/instantly-ai.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: [],
  actions: [
    createCampaignAction,
    createLeadListAction,
    addLeadToCampaignAction,
    searchCampaignsAction,
    searchLeadsAction,
    createCustomApiCallAction({
      auth:instantlyAiAuth,
      baseUrl:()=>BASE_URL,
      authMapping: async (auth) => ({
				Authorization: `Bearer ${auth}`,
			}),
    })
  ],
  triggers: [
    campaignStatusChangedTrigger,
    newLeadAddedTrigger,
  ],
});

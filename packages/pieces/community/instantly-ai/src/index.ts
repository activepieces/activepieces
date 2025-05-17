import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createCampaignAction } from './lib/actions/create-campaign';
import { replyToEmailAction } from './lib/actions/reply-to-email';
import { createLeadListAction } from './lib/actions/create-lead-list';
import { addLeadToCampaignAction } from './lib/actions/add-lead-to-campaign';
import { searchCampaignsAction } from './lib/actions/search-campaigns';
import { searchLeadsAction } from './lib/actions/search-leads';
import { campaignStatusChangedTrigger } from './lib/triggers/campaign-status-changed';
import { newLeadAddedTrigger } from './lib/triggers/new-lead-added';

const markdownDescription = `
To use this piece, you need to obtain an API key from [Instantly](https://developer.instantly.ai/api/v2).
`;

export const instantlyAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
})

export const instantlyAi = createPiece({
  displayName: 'Instantly.ai',
  description: 'Powerful cold email outreach and lead engagement platform',
  auth: instantlyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.prod.website-files.com/63860c8c65e7bef4a1eeebeb/67ab2655638fdc00dc35c630_Group%201%20(2).svg', // TO BE UPDATED
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: [],
  actions: [
    createCampaignAction,
    replyToEmailAction,
    createLeadListAction,
    addLeadToCampaignAction,
    searchCampaignsAction,
    searchLeadsAction,
  ],
  triggers: [
    campaignStatusChangedTrigger,
    newLeadAddedTrigger,
  ],
});

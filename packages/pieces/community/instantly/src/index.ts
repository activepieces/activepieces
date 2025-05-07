import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  createCampaignAction,
  replyToEmailAction,
  createLeadListAction,
  addLeadToCampaignAction,
  searchCampaignsAction,
  searchLeadsAction
} from './lib/actions';
import {
  campaignStatusChangedTrigger,
  newLeadAddedTrigger
} from './lib/triggers';

const markdownDescription = `
To use this piece, you need to obtain an API key from [Instantly](https://developer.instantly.ai/api/v2).
`;

export const instantlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
})

export const instantly = createPiece({
  displayName: 'Instantly',
  description: 'Powerful cold email outreach and lead engagement platform',
  auth: instantlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/instantly.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES],
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

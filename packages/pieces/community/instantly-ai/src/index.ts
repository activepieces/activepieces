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

import { newLeadAddedTrigger } from './lib/triggers/new-lead-added';
import { replyReceivedTrigger } from './lib/triggers/reply-received';
import { emailSentTrigger } from './lib/triggers/email-sent';
import { emailOpenedTrigger } from './lib/triggers/email-opened';
import { linkClickedTrigger } from './lib/triggers/link-clicked';
import { emailBouncedTrigger } from './lib/triggers/email-bounced';
import { leadUnsubscribedTrigger } from './lib/triggers/lead-unsubscribed';
import { campaignCompletedTrigger } from './lib/triggers/campaign-completed';
import { leadInterestChangedTrigger } from './lib/triggers/lead-interest-changed';
import { meetingBookedTrigger } from './lib/triggers/meeting-booked';

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
      authMapping: async (auth) => {
        const token = typeof auth === 'object' && auth !== null && 'secret_text' in auth
          ? String((auth as Record<string, unknown>)['secret_text'])
          : String(auth);
        return { Authorization: `Bearer ${token}` };
      },
    }),
  ],
  triggers: [
    replyReceivedTrigger,
    emailSentTrigger,
    emailOpenedTrigger,
    linkClickedTrigger,
    emailBouncedTrigger,
    leadUnsubscribedTrigger,
    campaignCompletedTrigger,
    leadInterestChangedTrigger,
    meetingBookedTrigger,
    newLeadAddedTrigger,
  ],
});

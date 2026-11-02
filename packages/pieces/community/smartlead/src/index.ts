import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { smartleadAuth } from './lib/auth';
import { BASE_URL } from './lib/common/client';
import { createCampaignAction } from './lib/actions/create-campaign';
import { addLeadsToCampaignAction } from './lib/actions/add-leads-to-campaign';
import { getCampaignStatisticsAction } from './lib/actions/get-campaign-statistics';
import { updateCampaignSettingsAction } from './lib/actions/update-campaign-settings';
import { updateCampaignStatusAction } from './lib/actions/update-campaign-status';
import { updateLeadStatusInCampaignAction } from './lib/actions/update-lead-status-in-campaign';
import { aiCreateCampaignAction } from './lib/actions/ai/ai-create-campaign';
import { aiAddLeadsToCampaignAction } from './lib/actions/ai/ai-add-leads-to-campaign';
import { aiGetCampaignStatisticsAction } from './lib/actions/ai/ai-get-campaign-statistics';
import { aiUpdateCampaignSettingsAction } from './lib/actions/ai/ai-update-campaign-settings';
import { aiListCampaignsAction } from './lib/actions/ai/ai-list-campaigns';
import { aiGetCampaignAction } from './lib/actions/ai/ai-get-campaign';
import { aiUpdateCampaignStatusAction } from './lib/actions/ai/ai-update-campaign-status';
import { aiDeleteCampaignAction } from './lib/actions/ai/ai-delete-campaign';
import { aiListCampaignLeadsAction } from './lib/actions/ai/ai-list-campaign-leads';
import { aiFindLeadByEmailAction } from './lib/actions/ai/ai-find-lead-by-email';
import { aiUpdateLeadStatusInCampaignAction } from './lib/actions/ai/ai-update-lead-status-in-campaign';
import { aiDeleteLeadFromCampaignAction } from './lib/actions/ai/ai-delete-lead-from-campaign';
import { aiListEmailAccountsAction } from './lib/actions/ai/ai-list-email-accounts';
import { aiGetLeadMessageHistoryAction } from './lib/actions/ai/ai-get-lead-message-history';
import { newCampaignEventTrigger } from './lib/triggers/new-campaign-event';

export const smartlead = createPiece({
  displayName: 'SmartLead',
  description:
    'Powerful cold email outreach platform with multi-account rotation, email warmup, unified inbox, and advanced analytics.',
  auth: smartleadAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/smartlead.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['Harmatta', 'OdaiAhmed99'],
  actions: [
    createCampaignAction,
    addLeadsToCampaignAction,
    getCampaignStatisticsAction,
    updateCampaignSettingsAction,
    updateCampaignStatusAction,
    updateLeadStatusInCampaignAction,
    aiCreateCampaignAction,
    aiAddLeadsToCampaignAction,
    aiGetCampaignStatisticsAction,
    aiUpdateCampaignSettingsAction,
    aiListCampaignsAction,
    aiGetCampaignAction,
    aiUpdateCampaignStatusAction,
    aiDeleteCampaignAction,
    aiListCampaignLeadsAction,
    aiFindLeadByEmailAction,
    aiUpdateLeadStatusInCampaignAction,
    aiDeleteLeadFromCampaignAction,
    aiListEmailAccountsAction,
    aiGetLeadMessageHistoryAction,
    createCustomApiCallAction({
      auth: smartleadAuth,
      baseUrl: () => BASE_URL,
      authLocation: 'queryParams',
      authMapping: async (auth) => ({
        api_key: auth.secret_text,
      }),
    }),
  ],
  triggers: [newCampaignEventTrigger],
});

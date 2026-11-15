import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { zohoCampaignsAiActions } from './lib/actions/ai';
import { addContactToMailingListAction } from './lib/actions/add-contact-to-mailing-list';
import { addTagToContactAction } from './lib/actions/add-tag-to-contact';
import { addUpdateContactAction } from './lib/actions/add-update-contact';
import { cloneCampaignAction } from './lib/actions/clone-campaign';
import { createCampaignAction } from './lib/actions/create-campaign';
import { findCampaignAction } from './lib/actions/find-campaign';
import { findContactAction } from './lib/actions/find-contact';
import { removeTagAction } from './lib/actions/remove-tag';
import { sendCampaignAction } from './lib/actions/send-campaign';
import { unsubscribeContactAction } from './lib/actions/unsubscribe-contact';
import { zohoCampaignsAuth } from './lib/auth';
import { zohoCampaignsClient } from './lib/common/client';
import { newCampaignTrigger } from './lib/triggers/new-campaign';
import { newContactTrigger } from './lib/triggers/new-contact';
import { unsubscribeTrigger } from './lib/triggers/unsubscribe';

export const zohoCampaigns = createPiece({
  displayName: 'Zoho Campaigns',
  description:
    'Zoho Campaigns is an email marketing platform for managing mailing lists, sending campaigns, tracking engagement, and automating subscriber workflows.',
  auth: zohoCampaignsAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-campaigns.png',
  authors: ['LuizDMM', 'onyedikachi-david'],
  actions: [
    createCampaignAction,
    cloneCampaignAction,
    sendCampaignAction,
    addUpdateContactAction,
    addTagToContactAction,
    removeTagAction,
    unsubscribeContactAction,
    addContactToMailingListAction,
    findContactAction,
    findCampaignAction,
    ...zohoCampaignsAiActions,
    createCustomApiCallAction({
      auth: zohoCampaignsAuth,
      baseUrl: (auth) =>
        auth ? `${zohoCampaignsClient.baseUrl({ auth })}?resfmt=JSON` : '',
      authMapping: async (auth) => ({
        Authorization: `Zoho-oauthtoken ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [newContactTrigger, unsubscribeTrigger, newCampaignTrigger],
});

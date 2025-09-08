import { createPiece } from '@activepieces/pieces-framework';
import { addContactToMailingList } from './lib/actions/add-contact-to-mailing-list';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { addUpdateContact } from './lib/actions/add-update-contact';
import { cloneCampaign } from './lib/actions/clone-campaign';
import { createCampaign } from './lib/actions/create-campaign';
import { findCampaign } from './lib/actions/find-campaign';
import { findContact } from './lib/actions/find-contact';
import { removeTag } from './lib/actions/remove-tag';
import { sendCampaign } from './lib/actions/send-campaign';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { zohoCampaignsAuth } from './lib/common';
import { newCampaign } from './lib/triggers/new-campaign';
import { newContact } from './lib/triggers/new-contact';
import { unsubscribe } from './lib/triggers/unsubscribe';

export const zohoCampaigns = createPiece({
  displayName: 'Zoho Campaigns',
  description:
    'Zoho Campaigns is an email marketing platform for managing mailing lists, sending campaigns, tracking engagement, and automating subscriber workflows.',
  auth: zohoCampaignsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-campaigns.png',
  authors: ['LuizDMM', 'onyedikachi-david'],
  actions: [
    // Write Actions
    createCampaign,
    cloneCampaign,
    sendCampaign,
    addUpdateContact,
    addTagToContact,
    removeTag,
    unsubscribeContact,
    addContactToMailingList,
    // Search Actions
    findContact,
    findCampaign,
  ],
  triggers: [
    newContact,
    unsubscribe,
    newCampaign,
  ],
});

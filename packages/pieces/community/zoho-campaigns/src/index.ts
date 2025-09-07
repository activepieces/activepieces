import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createContact } from './lib/actions/create-contact';
import { createCampaign } from './lib/actions/create-campaign';
import { cloneCampaign } from './lib/actions/clone-campaign';
import { sendCampaign } from './lib/actions/send-campaign';
import { addTagToContact } from './lib/actions/add-tag-to-contact';
import { removeTag } from './lib/actions/remove-tag';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { addContactToMailingList } from './lib/actions/add-contact-to-mailing-list';
import { findContact } from './lib/actions/find-contact';
import { findCampaign } from './lib/actions/find-campaign';
import { newContact } from './lib/triggers/new-contact';
import { unsubscribe } from './lib/triggers/unsubscribe';
import { newCampaign } from './lib/triggers/new-campaign';

export const zohoCampaignsAuth = PieceAuth.OAuth2({
    description: 'OAuth2 Authentication for Zoho Campaigns',
    authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
    tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
    required: true,
    scope: ['ZohoCampaigns.campaign.ALL', 'ZohoCampaigns.contact.ALL'],
});

export const zohoCampaigns = createPiece({
    displayName: 'Zoho Campaigns',
    minimumSupportedRelease: '0.5.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/zoho-campaigns.png',
    categories: [PieceCategory.MARKETING],
    authors: ['abuaboud'],
    auth: zohoCampaignsAuth,
    actions: [
        createContact,
        createCampaign,
        cloneCampaign,
        sendCampaign,
        addTagToContact,
        removeTag,
        unsubscribeContact,
        addContactToMailingList,
        findContact,
        findCampaign,
    ],
    triggers: [
        newContact,
        unsubscribe,
        newCampaign,
    ],
});

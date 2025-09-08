
    import { OAuth2PropertyValue, PiecePropValueSchema, createPiece } from "@activepieces/pieces-framework";
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    import { zohoCampaignsAuth } from './lib/common/auth';
    import { createCampaign } from './lib/actions/create-campaign';
    import { cloneCampaign } from './lib/actions/clone-campaign';
    import { sendCampaign } from './lib/actions/send-campaign';
    import { addOrUpdateContacts } from './lib/actions/add-or-update-contacts';
    import { addTagToContact } from './lib/actions/add-tag-to-contact';
    import { removeTagFromContact } from './lib/actions/remove-tag-from-contact';
    import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
    import { subscribeContact } from './lib/actions/subscribe-contact';
    import { findCampaign } from './lib/actions/find-campaign';
    import { findContact } from './lib/actions/get-contact-fields';
    import { newCampaign } from './lib/triggers/new-campaign';
    import { unsubscribedContact } from './lib/triggers/unsubscribed-contact';
    import { newContact } from './lib/triggers/new-contact';
    import { PieceCategory } from '@activepieces/shared';

    export const zohoCampaigns = createPiece({
      displayName: "Zoho Campaigns",
      description: 'Email marketing and campaign management',
      logoUrl: "https://cdn.activepieces.com/pieces/zoho-campaigns.png",
      minimumSupportedRelease: '0.36.1',
      categories: [PieceCategory.MARKETING],
      authors: [],
      auth: zohoCampaignsAuth,
      actions: [
        createCampaign,
        cloneCampaign,
        sendCampaign,
        addOrUpdateContacts,
        addTagToContact,
        removeTagFromContact,
        unsubscribeContact,
        subscribeContact,
        findCampaign,
        findContact,
        createCustomApiCallAction({
          baseUrl: (auth) => {
            const authValue = auth as PiecePropValueSchema<typeof zohoCampaignsAuth>;
            const location = authValue.props?.['location'] ?? 'zoho.com';
            return `https://campaigns.${location}/api/v1.1`;
          },
          auth: zohoCampaignsAuth,
          authMapping: async (auth) => ({
            Authorization: `Zoho-oauthtoken ${(auth as OAuth2PropertyValue).access_token}`,
          }),
        }),
      ],
      triggers: [
        newCampaign,
        unsubscribedContact,
        newContact,
      ],
    });
    
    export { zohoCampaignsAuth } from './lib/common/auth';
    
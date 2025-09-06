import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createCampaignAction } from "./lib/actions/create-campaign";
import { cloneCampaignAction } from "./lib/actions/clone-campaign";
import { sendCampaignAction } from "./lib/actions/send-campaign";
import { addTagToContactAction } from "./lib/actions/add-tag-to-contact";
import { addUpdateContactAction } from "./lib/actions/add-update-contact";
import { removeTagFromContactAction } from "./lib/actions/remove-tag-from-contact";
import { unsubscribeContactAction } from "./lib/actions/unsubscribe-contact";
import { addContactToListAction } from "./lib/actions/add-contact-to-list";
import { findContactAction } from "./lib/actions/find-contact";
import { findCampaignAction } from "./lib/actions/find-campaign";

import { newContact } from "./lib/triggers/new-contact";
import { newUnsubscribe } from "./lib/triggers/new-unsubscribe";
import { newCampaign } from "./lib/triggers/new-campaign";

export const zohoCampaignsAuth = PieceAuth.OAuth2({
    description: `
    **Instructions to get your Client ID and Client Secret:**
    1. Go to the [Zoho API Console](https://api-console.zoho.com/).
    2. Click on **Add Client** and choose **Server-based Applications**.
    3. Give your client a name (e.g., "Activepieces Integration").
    4. Enter a Homepage URL (e.g., \`https://www.activepieces.com/\`).
    5. For **Authorized Redirect URIs**, paste this value: \`{{redirectUrl}}\`
    6. Click **Create**.
    7. Your **Client ID** and **Client Secret** will be displayed. Copy and paste them into the fields on the connection dialog.
    `,
    authUrl: "https://accounts.zoho.com/oauth/v2/auth",
    tokenUrl: "https://accounts.zoho.com/oauth/v2/token",
    required: true,
    scope: [
        'ZohoCampaigns.campaign.ALL',
        'ZohoCampaigns.contact.ALL',
    ],
});

export const zohoCampaigns = createPiece({
  displayName: "Zoho Campaigns", 
  auth: zohoCampaignsAuth, 
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-campaigns.png",
  authors: [
      
    ],
  actions: [
    createCampaignAction,
    cloneCampaignAction,
    sendCampaignAction,
    addTagToContactAction,
    addUpdateContactAction,
    removeTagFromContactAction,
    unsubscribeContactAction,
    addContactToListAction,
    findContactAction,
    findCampaignAction,
  ],
  triggers: [
    newContact,
    newUnsubscribe,

  ],
});

import { createPiece, OAuth2PropertyValue, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { sendEmail } from "./lib/actions/send-email";
import { getEmailDetails } from "./lib/actions/get-email-details";
import { moveEmailToFolder } from "./lib/actions/move-email-to-folder";
import { markEmailAsRead } from "./lib/actions/mark-email-as-read";
import { markEmailAsUnread } from "./lib/actions/mark-email-as-unread";
import { newEmailReceived } from "./lib/triggers/new-email-received";
import { newEmailMatchingSearch } from "./lib/triggers/new-email-matching-search";
import { newEmailInFolder } from "./lib/triggers/new-email-in-folder";
import { ZOHO_MAIL_API_URL } from "./lib/common";

export const zohoMailAuth = PieceAuth.OAuth2({
  description: "Authentication for Zoho Mail",
  authUrl: "https://accounts.zoho.com/oauth/v2/auth",
  tokenUrl: "https://accounts.zoho.com/oauth/v2/token",
  required: true,
  scope: [
    "ZohoMail.accounts.READ",
    "ZohoMail.messages.ALL",
    "ZohoMail.folders.ALL",
    "ZohoMail.organization.accounts.READ" // Added for fetching organization accounts if needed
  ],
  extra: {
    access_type: 'offline', // To get refresh token
  },
});

export const zohoMail = createPiece({
  displayName: "Zoho Mail",
  description: "Secure and ad-free email hosting service for businesses",
  auth: zohoMailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-mail.png",
  categories: [PieceCategory.COMMUNICATION],
  authors: ["abuaboud"],
  actions: [
    sendEmail,
    getEmailDetails,
    moveEmailToFolder,
    markEmailAsRead,
    markEmailAsUnread,
    createCustomApiCallAction({
      auth: zohoMailAuth,
      baseUrl: () => ZOHO_MAIL_API_URL,
      authMapping: async (auth) => {
        return {
          'Authorization': `Zoho-oauthtoken ${(auth as { access_token: string }).access_token}`,
        };
      },
    })
  ],
  triggers: [
    newEmailReceived,
    newEmailMatchingSearch,
    newEmailInFolder,
  ],
});
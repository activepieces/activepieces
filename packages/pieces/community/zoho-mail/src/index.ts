
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import {sendEmail,
  moveEmailToFolder,
  markEmailAsRead,
  markEmailAsUnread,
  getEmailDetails} from "./lib/actions"
import { newEmailInFolder, newEmailReceived, newEmailMatchingSearch } from "./lib/triggers";

export const zohoMailAuth = PieceAuth.OAuth2({
  description: 'Authentication for Zoho Mail',
  authUrl: 'https://accounts.zoho.{region}/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.{region}/oauth/v2/token',
  required: true,
  scope: ['ZohoMail.messages.ALL'],
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'Select your account region',
      required: true,
      options: {
        options: [
          {
            label: 'US (.com)',
            value: 'com',
          },
          {
            label: 'Europe (.eu)',
            value: 'eu',
          },
          {
            label: 'India (.in)',
            value: 'in',
          },
          {
            label: 'Australia (.com.au)',
            value: 'com.au',
          },
          {
            label: 'Japan (.jp)',
            value: 'jp',
          },
        ],
      },
    }),
  },
});

export const zohoMail = createPiece({
  displayName: "Zoho Mail",
  auth: zohoMailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/zoho-mail.png",
  categories: [PieceCategory.COMMUNICATION],
  authors: ["krushnakantarout"],
  actions: [sendEmail, moveEmailToFolder, markEmailAsRead, markEmailAsUnread, getEmailDetails],
  triggers: [newEmailInFolder, newEmailReceived, newEmailMatchingSearch],
});
    
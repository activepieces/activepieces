import { PieceAuth } from "@activepieces/pieces-framework";

export const microsoft365PeopleAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft 365 People',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Contacts.ReadWrite', "offline_access"],
  prompt: 'omit',
});

import { PieceAuth } from '@activepieces/pieces-framework';

export const BASE_URL = 'https://graph.microsoft.com/v1.0';

export const outlookAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Outlook',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: ['Mail.Read', 'Mail.Send', 'Calendars.Read', 'offline_access'],
});

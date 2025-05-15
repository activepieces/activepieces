import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newEmailTrigger } from './lib/triggers/new-email';
import { sendEmail } from './lib/actions/send-email';

export const outlookEmailAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Outlook Email',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.Send',
    'offline_access',
  ],
});
export const microsoftOutlookEmail = createPiece({
  displayName: 'Microsoft Outlook Email',
  description: 'Email service by Microsoft Outlook',
  auth: outlookEmailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-outlook.png',
  authors: [],
  actions: [sendEmail],
  triggers: [newEmailTrigger],
});

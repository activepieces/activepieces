import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newEmailTrigger } from './lib/triggers/new-email';
import { sendEmail } from './lib/actions/send-email';
import { replyEmail } from './lib/actions/reply-email';
import { downloadAttachment } from './lib/actions/download-attachment';

export const outlookEmailAuth = PieceAuth.OAuth2({
  description: 'Authentication for Microsoft Outlook Email',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  required: true,
  scope: [
    'https://graph.microsoft.com/Mail.ReadWrite', // Needed for modifying emails (createReply)
    'https://graph.microsoft.com/Mail.Send', // Needed for sending emails
    'offline_access', // Needed for refresh tokens
  ],
});
export const microsoftOutlookEmail = createPiece({
  displayName: 'Microsoft Outlook Email',
  description: 'Email service by Microsoft Outlook',
  auth: outlookEmailAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-outlook.png',
  authors: [],
  actions: [sendEmail, replyEmail, downloadAttachment],
  triggers: [newEmailTrigger],
});

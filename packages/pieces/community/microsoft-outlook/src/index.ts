import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { outlookAuth } from './lib/common/common';
import { sendEmail } from './lib/actions/send-email';
import { downloadEmailAttachment } from './lib/actions/download-email-attachment';
import { newEmail } from './lib/triggers/new-email';



export const microsoftOutlook = createPiece({
  displayName: 'Microsoft Outlook',
  auth: outlookAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-outlook.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["lucaslimasouza"],
  actions: [sendEmail, downloadEmailAttachment],
  triggers: [newEmail],
});


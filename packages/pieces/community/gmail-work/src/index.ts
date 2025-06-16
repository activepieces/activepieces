import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import actions
import { replyToEmail } from './lib/actions/reply-to-email';
import { createDraftReply } from './lib/actions/create-draft-reply';
import { addLabelToEmail } from './lib/actions/add-label-to-email';
import { removeLabelFromEmail } from './lib/actions/remove-label-from-email';
import { createLabel } from './lib/actions/create-label';
import { archiveEmail } from './lib/actions/archive-email';
import { deleteEmail } from './lib/actions/delete-email';
import { removeLabelFromThread } from './lib/actions/remove-label-from-thread';
import { findEmail } from './lib/actions/find-email';

// Import triggers
import { newStarredEmail } from './lib/triggers/new-starred-email';
import { newConversation } from './lib/triggers/new-conversation';
import { newAttachment } from './lib/triggers/new-attachment';
import { newLabel } from './lib/triggers/new-label';

export const gmailAuth = PieceAuth.OAuth2({
  description: 'Connect to Gmail',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ],
});

export const gmail = createPiece({
  displayName: 'Gmail',
  description: 'Gmail integration for sending, receiving, and managing emails',
  auth: gmailAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['ActivePieces Team'],
  actions: [
    replyToEmail,
    createDraftReply,
    addLabelToEmail,
    removeLabelFromEmail,
    createLabel,
    archiveEmail,
    deleteEmail,
    removeLabelFromThread,
    findEmail,
  ],
  triggers: [
    newStarredEmail,
    newConversation,
    newAttachment,
    newLabel,
  ],
});
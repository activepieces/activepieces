import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email';
import { addLabelToEmail } from './lib/actions/add-label-to-email';
import { removeLabelFromEmail } from './lib/actions/remove-label-from-email';
import { createLabel } from './lib/actions/create-label';
import { archiveEmail } from './lib/actions/archive-email';
import { deleteEmail } from './lib/actions/delete-email';
import { removeLabelFromThread } from './lib/actions/remove-label-from-thread';
import { replyToEmail } from './lib/actions/reply-to-email';
import { createDraftReply } from './lib/actions/create-draft-reply';
import { findEmail } from './lib/actions/find-email';

import { newAttachment } from './lib/triggers/new-attachment';
import { newConversation } from './lib/triggers/new-conversation';
import { newLabel } from './lib/triggers/new-label';
import { newStarredEmail } from './lib/triggers/new-starred-email';

export const gmailAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/gmail.send',
    'email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels'
  ],
});

export const gmail = createPiece({
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
  categories: [
    PieceCategory.COMMUNICATION,
    PieceCategory.BUSINESS_INTELLIGENCE,
  ],
  actions: [
    gmailSendEmailAction,
    replyToEmail,
    createDraftReply,
    addLabelToEmail,
    removeLabelFromEmail,
    createLabel,
    archiveEmail,
    deleteEmail,
    removeLabelFromThread,
    findEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://gmail.googleapis.com/gmail/v1',
      auth: gmailAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: 'Gmail',
  description: 'Email service by Google',

  authors: [
    'kanarelo',
    'abdullahranginwala',
    'BastienMe',
    'Salem-Alaa',
    'kishanprmr',
    'MoShizzle',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'AdamSelene',
    'Ani-4x'
  ],
  
  triggers: [gmailNewEmailTrigger,
     gmailNewLabeledEmailTrigger,
    newStarredEmail,
    newConversation,
    newAttachment,
    newLabel
    ],
  auth: gmailAuth,
});

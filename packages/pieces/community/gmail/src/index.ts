import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import { gmailAddLabelAction } from './lib/actions/add-label-to-email';
import { gmailArchiveEmailAction } from './lib/actions/archive-email';
import { gmailCreateDraftReplyAction } from './lib/actions/create-draft-reply';
import { gmailCreateLabelAction } from './lib/actions/create-label';
import { gmailDeleteEmailAction } from './lib/actions/delete-email';
import { gmailFindEmailAction } from './lib/actions/find-email';
import { gmailGetMailAction } from './lib/actions/get-mail-action';
import { gmailGetThreadAction } from './lib/actions/get-thread-action';
import { gmailRemoveLabelAction } from './lib/actions/remove-label-from-email';
import { gmailRemoveLabelFromThreadAction } from './lib/actions/remove-label-from-thread';
import { gmailReplyToEmailAction } from './lib/actions/reply-to-email';
import { gmailSearchMail } from './lib/actions/search-email-action';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email';
import { gmailNewAttachmentTrigger } from './lib/triggers/new-attachment';
import { gmailNewConversationTrigger } from './lib/triggers/new-conversation';
import { gmailNewLabelTrigger } from './lib/triggers/new-label-trigger';
import { gmailNewStarredEmailTrigger } from './lib/triggers/new-starred-email';

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
    gmailAddLabelAction,
    gmailArchiveEmailAction,
    gmailCreateDraftReplyAction,
    gmailCreateLabelAction,
    gmailDeleteEmailAction,
    gmailFindEmailAction,
    gmailGetMailAction,
    gmailGetThreadAction,
    gmailRemoveLabelAction,
    gmailRemoveLabelFromThreadAction,
    gmailReplyToEmailAction,
    gmailSearchMail,
    gmailSendEmailAction,
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
  ],
  triggers: [
    gmailNewEmailTrigger,
    gmailNewLabeledEmailTrigger,
    gmailNewAttachmentTrigger,
    gmailNewConversationTrigger,
    gmailNewEmailTrigger,
    gmailNewLabelTrigger,
    gmailNewLabeledEmailTrigger,
    gmailNewStarredEmailTrigger,
  ],
  auth: gmailAuth,
});

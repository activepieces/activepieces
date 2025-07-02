import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import { gmailReplyToEmailAction } from './lib/actions/reply-to-email-action';
import { gmailCreateDraftReplyAction } from './lib/actions/create-draft-reply-action';
import { gmailAddLabelToEmailAction } from './lib/actions/add-label-to-email-action';
import { gmailRemoveLabelFromEmailAction } from './lib/actions/remove-label-from-email-action';
import { gmailCreateLabelAction } from './lib/actions/create-label-action';
import { gmailArchiveEmailAction } from './lib/actions/archive-email-action';
import { gmailDeleteEmailAction } from './lib/actions/delete-email-action';
import { gmailRemoveLabelFromThreadAction } from './lib/actions/remove-label-from-thread-action';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email';
import { gmailNewAttachmentTrigger } from './lib/triggers/new-attachment';
import { gmailNewLabelTrigger } from './lib/triggers/new-label';
import { gmailSearchMailAction } from './lib/actions/search-email-action';
import { gmailGetEmailAction } from './lib/actions/get-mail-action';

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
    'https://www.googleapis.com/auth/gmail.labels',
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
    gmailReplyToEmailAction,
    gmailCreateDraftReplyAction,
    gmailAddLabelToEmailAction,
    gmailRemoveLabelFromEmailAction,
    gmailCreateLabelAction,
    gmailArchiveEmailAction,
    gmailGetEmailAction,
    gmailDeleteEmailAction,
    gmailRemoveLabelFromThreadAction,
    gmailSearchMailAction,
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
    'onyedikachi-david',
  ],
  triggers: [
    gmailNewEmailTrigger,
    gmailNewLabeledEmailTrigger,
    gmailNewAttachmentTrigger,
    gmailNewLabelTrigger,
  ],
  auth: gmailAuth,
});

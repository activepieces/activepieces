import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { gmailSendEmailAction } from './lib/actions/send-email-action';
import { gmailReplyToEmailAction } from './lib/actions/reply-to-email-action';
import { gmailCreateDraftReplyAction } from './lib/actions/create-draft-reply-action';
import { gmailNewEmailTrigger } from './lib/triggers/new-email';
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email';
import { requestApprovalInEmail } from './lib/actions/request-approval-in-email';
import { gmailNewAttachmentTrigger } from './lib/triggers/new-attachment';
import { gmailNewLabelTrigger } from './lib/triggers/new-label';
import { gmailSearchMailAction } from './lib/actions/search-email-action';
import { gmailGetEmailAction } from './lib/actions/get-mail-action';
import { gmailAuth, getAccessToken, GmailAuthValue } from './lib/auth';
import { gmailAiSendEmailAction } from './lib/actions/ai-send-email-action';
import { gmailAiReplyToThreadAction } from './lib/actions/ai-reply-to-thread-action';
import { gmailAiGetMessageAction } from './lib/actions/ai-get-message-action';
import { gmailAiSearchEmailAction } from './lib/actions/ai-search-email-action';
import { gmailGetThread } from './lib/actions/get-thread-action';
import { gmailCreateDraftAction } from './lib/actions/create-draft-action';
import { gmailUpdateDraftAction } from './lib/actions/update-draft-action';
import { gmailSendDraftAction } from './lib/actions/send-draft-action';
import { gmailGetDraftAction } from './lib/actions/get-draft-action';
import { gmailListDraftsAction } from './lib/actions/list-drafts-action';
import { gmailDeleteDraftAction } from './lib/actions/delete-draft-action';
import { gmailListThreadsAction } from './lib/actions/list-threads-action';
import { gmailGetAttachmentAction } from './lib/actions/get-attachment-action';
import { gmailForwardMessageAction } from './lib/actions/forward-message-action';
import { gmailListLabelsAction } from './lib/actions/list-labels-action';
import { gmailGetLabelAction } from './lib/actions/get-label-action';
import { gmailGetProfileAction } from './lib/actions/get-profile-action';
import { gmailListHistoryAction } from './lib/actions/list-history-action';
import { gmailStopWatchAction } from './lib/actions/stop-watch-action';

export {
  gmailAuth,
  getAccessToken,
  GmailAuthValue,
  createGoogleClient,
} from './lib/auth';

export const gmail = createPiece({
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
  categories: [
    PieceCategory.COMMUNICATION,
    PieceCategory.BUSINESS_INTELLIGENCE,
  ],
  actions: [
    gmailSendEmailAction,
    requestApprovalInEmail,
    gmailReplyToEmailAction,
    gmailCreateDraftReplyAction,
    gmailGetEmailAction,
    gmailSearchMailAction,
    gmailAiSendEmailAction,
    gmailAiReplyToThreadAction,
    gmailAiGetMessageAction,
    gmailAiSearchEmailAction,
    gmailGetThread,
    gmailCreateDraftAction,
    gmailUpdateDraftAction,
    gmailSendDraftAction,
    gmailGetDraftAction,
    gmailListDraftsAction,
    gmailDeleteDraftAction,
    gmailListThreadsAction,
    gmailGetAttachmentAction,
    gmailForwardMessageAction,
    gmailListLabelsAction,
    gmailGetLabelAction,
    gmailGetProfileAction,
    gmailListHistoryAction,
    gmailStopWatchAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://gmail.googleapis.com/gmail/v1',
      auth: gmailAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${await getAccessToken(auth as GmailAuthValue)}`,
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
    'sanket-a11y',
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

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createInbox } from './lib/actions/create-inbox';
import { getInbox } from './lib/actions/get-inbox';
import { deleteInbox } from './lib/actions/delete-inbox';
import { listInboxes } from './lib/actions/list-inboxes';
import { sendEmail } from './lib/actions/send-email';
import { listEmails } from './lib/actions/list-emails';
import { getEmail } from './lib/actions/get-email';
import { searchEmails } from './lib/actions/search-emails';
import { getAccount } from './lib/actions/get-account';
import { newEmailTrigger } from './lib/triggers/new-email';
import { newThreadTrigger } from './lib/triggers/new-thread';
import { threadReplyTrigger } from './lib/triggers/thread-reply';
import { emailBouncedTrigger } from './lib/triggers/email-bounced';
import { emailSentTrigger } from './lib/triggers/email-sent';
import { lobstermailCommon } from './lib/common';

export const lobstermailAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To get your LobsterMail API key:
1. Sign up or log in at **https://lobstermail.ai**
2. Go to **Settings → API Keys**
3. Click **Create New Key**
4. Copy the key — it starts with \`lm_sk_test_\` (sandbox) or \`lm_sk_live_\` (production)

Need help? See https://lobstermail.ai/docs`,
});

export const lobstermail = createPiece({
  displayName: 'LobsterMail',
  description:
    'Email infrastructure for AI agents — create inboxes, send and receive email, search, threads, and webhooks.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/lobstermail.png',
  authors: ['ibussieres'],
  categories: [PieceCategory.COMMUNICATION],
  auth: lobstermailAuth,
  actions: [
    createInbox,
    getInbox,
    deleteInbox,
    listInboxes,
    sendEmail,
    listEmails,
    getEmail,
    searchEmails,
    getAccount,
    createCustomApiCallAction({
      baseUrl: () => lobstermailCommon.baseUrl,
      auth: lobstermailAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [
    newEmailTrigger,
    newThreadTrigger,
    threadReplyTrigger,
    emailBouncedTrigger,
    emailSentTrigger,
  ],
});

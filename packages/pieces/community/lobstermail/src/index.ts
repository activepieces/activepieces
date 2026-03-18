import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createInbox } from './lib/actions/create-inbox';
import { listInboxes } from './lib/actions/list-inboxes';
import { sendEmail } from './lib/actions/send-email';
import { listEmails } from './lib/actions/list-emails';
import { getEmail } from './lib/actions/get-email';
import { searchEmails } from './lib/actions/search-emails';
import { createWebhook } from './lib/actions/create-webhook';
import { getAccount } from './lib/actions/get-account';
import { newEmailTrigger } from './lib/triggers/new-email';
import { lobstermailCommon } from './lib/common';

export const lobstermailAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'LobsterMail API key (starts with lm_sk_test_ or lm_sk_live_). ' +
    'Get one free at https://lobstermail.ai',
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
    listInboxes,
    sendEmail,
    listEmails,
    getEmail,
    searchEmails,
    createWebhook,
    getAccount,
    createCustomApiCallAction({
      baseUrl: () => lobstermailCommon.baseUrl,
      auth: lobstermailAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newEmailTrigger],
});

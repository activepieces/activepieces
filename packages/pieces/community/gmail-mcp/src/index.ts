import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { gmailMcpAuth } from './lib/common/auth';
import { sendEmail } from './lib/actions/send-email';
import { readEmail } from './lib/actions/read-email';
import { searchEmails } from './lib/actions/search-emails';
import { addLabel } from './lib/actions/add-label';
import { archiveEmail } from './lib/actions/archive-email';
import { newEmailTrigger } from './lib/triggers/new-email';

export const gmailMcp = createPiece({
  displayName: 'Gmail MCP',
  description: 'Gmail integration via Model Context Protocol - send, read, search, and manage emails',
  auth: gmailMcpAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
  categories: ['COMMUNICATION'],
  authors: ['pvbang'],
  actions: [
    sendEmail,
    readEmail,
    searchEmails,
    addLabel,
    archiveEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://gmail.googleapis.com/gmail/v1/users/me',
      auth: gmailMcpAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { access_token: string }).access_token}`,
      }),
    }),
  ],
  triggers: [newEmailTrigger],
});

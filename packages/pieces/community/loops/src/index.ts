import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { loopsAuth, LOOPS_BASE_URL } from './lib/auth';
import { createContact } from './lib/actions/create-contact';
import { sendEvent } from './lib/actions/send-event';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email';
import { findContact } from './lib/actions/find-contact';
import { deleteContact } from './lib/actions/delete-contact';

export const loops = createPiece({
  displayName: 'Loops',
  description:
    'Loops is an email platform for sending beautiful transactional and marketing emails. Manage contacts, trigger automations with events, and send transactional emails from your workflows.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/loops.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  auth: loopsAuth,
  actions: [
    createContact,
    sendEvent,
    sendTransactionalEmail,
    findContact,
    deleteContact,
    createCustomApiCallAction({
      baseUrl: () => LOOPS_BASE_URL,
      auth: loopsAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});

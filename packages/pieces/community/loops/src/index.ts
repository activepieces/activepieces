import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { loopsAuth, LOOPS_BASE_URL } from './lib/auth';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { sendEvent } from './lib/actions/send-event';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email';
import { findContact } from './lib/actions/find-contact';
import { findContactByEmail } from './lib/actions/find-contact-by-email';
import { findContactByUserId } from './lib/actions/find-contact-by-user-id';
import { deleteContact } from './lib/actions/delete-contact';
import { listMailingLists } from './lib/actions/list-mailing-lists';
import { listContactProperties } from './lib/actions/list-contact-properties';
import { createContactProperty } from './lib/actions/create-contact-property';
import { listTransactionalEmails } from './lib/actions/list-transactional-emails';
import { checkContactSuppression } from './lib/actions/check-contact-suppression';

export const loops = createPiece({
  displayName: 'Loops',
  description:
    'Loops is an email platform for sending beautiful transactional and marketing emails. Manage contacts, trigger automations with events, and send transactional emails from your workflows.',
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/loops.png',
  authors: ['Harmatta', 'OdaiAhmed99'],
  categories: [PieceCategory.COMMUNICATION, PieceCategory.MARKETING],
  auth: loopsAuth,
  actions: [
    createContact,
    updateContact,
    sendEvent,
    sendTransactionalEmail,
    findContact,
    findContactByEmail,
    findContactByUserId,
    deleteContact,
    listMailingLists,
    listContactProperties,
    createContactProperty,
    listTransactionalEmails,
    checkContactSuppression,
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

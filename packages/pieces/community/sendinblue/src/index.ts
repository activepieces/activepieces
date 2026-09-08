import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createEvent } from './lib/actions/create-event';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { findContact } from './lib/actions/find-contact';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email';
import { sendTransactionalSms } from './lib/actions/send-transactional-sms';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { sendinblueAuth } from './lib/auth';
import { BREVO_API_URL } from './lib/common';
import { contactAddedToList } from './lib/triggers/contact-added-to-list';
import { contactDeleted } from './lib/triggers/contact-deleted';
import { contactUnsubscribed } from './lib/triggers/contact-unsubscribed';
import { contactUpdated } from './lib/triggers/contact-updated';
import { emailBounced } from './lib/triggers/email-bounced';
import { emailClicked } from './lib/triggers/email-clicked';
import { emailDelivered } from './lib/triggers/email-delivered';
import { emailOpened } from './lib/triggers/email-opened';

export const sendinblue = createPiece({
  displayName: 'Brevo',
  description:
    'Formerly Sendinblue, is a SaaS solution for relationship marketing',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/brevo.png',
  authors: ["kanarelo","BLaidzX","Salem-Alaa","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.MARKETING],
  auth: sendinblueAuth,
  actions: [
    createOrUpdateContact,
    findContact,
    unsubscribeContact,
    sendTransactionalEmail,
    sendTransactionalSms,
    createEvent,
    createCustomApiCallAction({
      baseUrl: () => BREVO_API_URL,
      auth: sendinblueAuth,
      authMapping: async (auth) => ({
        'api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [
    contactAddedToList,
    contactUpdated,
    contactDeleted,
    contactUnsubscribed,
    emailDelivered,
    emailOpened,
    emailClicked,
    emailBounced,
  ],
});

export { sendinblueAuth };

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createContact } from './lib/actions/create-contact';
import { createContactList } from './lib/actions/create-contact-list';
import { createEvent } from './lib/actions/create-event';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { deleteContact } from './lib/actions/delete-contact';
import { findContact } from './lib/actions/find-contact';
import { getContact } from './lib/actions/get-contact';
import { getContactCampaignStats } from './lib/actions/get-contact-campaign-stats';
import { getContactList } from './lib/actions/get-contact-list';
import { getImportProcess } from './lib/actions/get-import-process';
import { importContacts } from './lib/actions/import-contacts';
import { listContactAttributes } from './lib/actions/list-contact-attributes';
import { listContactLists } from './lib/actions/list-contact-lists';
import { listContacts } from './lib/actions/list-contacts';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email';
import { sendTransactionalSms } from './lib/actions/send-transactional-sms';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { updateContact } from './lib/actions/update-contact';
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
  minimumSupportedRelease: '0.87.0',
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
    createContact,
    updateContact,
    getContact,
    listContacts,
    deleteContact,
    importContacts,
    getImportProcess,
    getContactCampaignStats,
    listContactAttributes,
    createContactList,
    getContactList,
    listContactLists,
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

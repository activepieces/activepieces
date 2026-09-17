import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCompany } from './lib/actions/create-company';
import { createContactList } from './lib/actions/create-contact-list';
import { createEmailCampaign } from './lib/actions/create-email-campaign';
import { createEvent } from './lib/actions/create-event';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { createOrUpdateEmailTemplate } from './lib/actions/create-or-update-email-template';
import { createSmsCampaign } from './lib/actions/create-sms-campaign';
import { deleteCompany } from './lib/actions/delete-company';
import { deleteContact } from './lib/actions/delete-contact';
import { deleteEmailTemplate } from './lib/actions/delete-email-template';
import { deleteSmsCampaign } from './lib/actions/delete-sms-campaign';
import { findContact } from './lib/actions/find-contact';
import { getAccountInfo } from './lib/actions/get-account-info';
import { getCompany } from './lib/actions/get-company';
import { getContactCampaignStats } from './lib/actions/get-contact-campaign-stats';
import { getContactList } from './lib/actions/get-contact-list';
import { getEmailCampaign } from './lib/actions/get-email-campaign';
import { getEmailTemplate } from './lib/actions/get-email-template';
import { getImportProcess } from './lib/actions/get-import-process';
import { getSmsCampaign } from './lib/actions/get-sms-campaign';
import { importContacts } from './lib/actions/import-contacts';
import { listCompanies } from './lib/actions/list-companies';
import { listContactAttributes } from './lib/actions/list-contact-attributes';
import { listContactLists } from './lib/actions/list-contact-lists';
import { listContacts } from './lib/actions/list-contacts';
import { listCrmNotes } from './lib/actions/list-crm-notes';
import { listEmailCampaigns } from './lib/actions/list-email-campaigns';
import { listEmailTemplates } from './lib/actions/list-email-templates';
import { listSenderDomains } from './lib/actions/list-sender-domains';
import { listSenders } from './lib/actions/list-senders';
import { listSmsCampaigns } from './lib/actions/list-sms-campaigns';
import { listTransactionalEmailEvents } from './lib/actions/list-transactional-email-events';
import { sendEmailCampaignNow } from './lib/actions/send-email-campaign-now';
import { sendTransactionalEmail } from './lib/actions/send-transactional-email';
import { sendTransactionalSms } from './lib/actions/send-transactional-sms';
import { unsubscribeContact } from './lib/actions/unsubscribe-contact';
import { updateContact } from './lib/actions/update-contact';
import { updateEmailCampaign } from './lib/actions/update-email-campaign';
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
    listContacts,
    updateContact,
    deleteContact,
    importContacts,
    getImportProcess,
    listContactAttributes,
    getContactCampaignStats,
    createContactList,
    listContactLists,
    getContactList,
    createCompany,
    getCompany,
    listCompanies,
    deleteCompany,
    listCrmNotes,
    listSenders,
    listSenderDomains,
    createOrUpdateEmailTemplate,
    getEmailTemplate,
    listEmailTemplates,
    deleteEmailTemplate,
    createEmailCampaign,
    updateEmailCampaign,
    getEmailCampaign,
    listEmailCampaigns,
    sendEmailCampaignNow,
    createSmsCampaign,
    getSmsCampaign,
    listSmsCampaigns,
    deleteSmsCampaign,
    listTransactionalEmailEvents,
    getAccountInfo,
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

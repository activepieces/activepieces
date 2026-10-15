import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  createCustomApiCallAction,
  HttpError,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { sendBatchEmails } from './lib/actions/send-batch-emails.action';
import { createContact } from './lib/actions/create-contact.action';
import { updateContact } from './lib/actions/update-contact.action';
import { deleteContact } from './lib/actions/delete-contact.action';
import { listContacts } from './lib/actions/list-contacts.action';
import { getEmailStatus } from './lib/actions/get-email-status.action';
import { listEmails } from './lib/actions/list-emails.action';
import { cancelScheduledEmail } from './lib/actions/cancel-scheduled-email.action';
import { rescheduleEmail } from './lib/actions/reschedule-email.action';
import { listDomains } from './lib/actions/list-domains.action';
import { createDomain } from './lib/actions/create-domain.action';
import { deleteDomain } from './lib/actions/delete-domain.action';
import { verifyDomain } from './lib/actions/verify-domain.action';
import { listAudiences } from './lib/actions/list-audiences.action';
import { createAudience } from './lib/actions/create-audience.action';
import { deleteAudience } from './lib/actions/delete-audience.action';
import { listBroadcasts } from './lib/actions/list-broadcasts.action';
import { createBroadcast } from './lib/actions/create-broadcast.action';
import { sendBroadcast } from './lib/actions/send-broadcast.action';
import { deleteBroadcast } from './lib/actions/delete-broadcast.action';
import { getBroadcast } from './lib/actions/get-broadcast.action';
import { updateBroadcast } from './lib/actions/update-broadcast.action';
import { getContact } from './lib/actions/get-contact.action';
import { addContactToSegment } from './lib/actions/add-contact-to-segment.action';
import { removeContactFromSegment } from './lib/actions/remove-contact-from-segment.action';
import { listContactSegments } from './lib/actions/list-contact-segments.action';
import { listContactTopics } from './lib/actions/list-contact-topics.action';
import { createContactProperty } from './lib/actions/create-contact-property.action';
import { getContactProperty } from './lib/actions/get-contact-property.action';
import { listContactProperties } from './lib/actions/list-contact-properties.action';
import { updateContactProperty } from './lib/actions/update-contact-property.action';
import { deleteContactProperty } from './lib/actions/delete-contact-property.action';
import { createSegment } from './lib/actions/create-segment.action';
import { getSegment } from './lib/actions/get-segment.action';
import { listSegments } from './lib/actions/list-segments.action';
import { deleteSegment } from './lib/actions/delete-segment.action';
import { createTopic } from './lib/actions/create-topic.action';
import { getTopic } from './lib/actions/get-topic.action';
import { listTopics } from './lib/actions/list-topics.action';
import { updateTopic } from './lib/actions/update-topic.action';
import { deleteTopic } from './lib/actions/delete-topic.action';
import { createTemplate } from './lib/actions/create-template.action';
import { getTemplate } from './lib/actions/get-template.action';
import { listTemplates } from './lib/actions/list-templates.action';
import { updateTemplate } from './lib/actions/update-template.action';
import { deleteTemplate } from './lib/actions/delete-template.action';
import { publishTemplate } from './lib/actions/publish-template.action';
import { duplicateTemplate } from './lib/actions/duplicate-template.action';
import { createWebhook } from './lib/actions/create-webhook.action';
import { getWebhook } from './lib/actions/get-webhook.action';
import { listWebhooks } from './lib/actions/list-webhooks.action';
import { updateWebhook } from './lib/actions/update-webhook.action';
import { deleteWebhook } from './lib/actions/delete-webhook.action';
import { getEmailAttachment } from './lib/actions/get-email-attachment.action';
import { listEmailAttachments } from './lib/actions/list-email-attachments.action';
import { listReceivedEmails } from './lib/actions/list-received-emails.action';
import { emailBounced } from './lib/triggers/email-bounced.trigger';
import { RESEND_BASE_URL } from './lib/common/client';

export const resendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your [Resend dashboard](https://resend.com/overview)
2. Go to **API Keys** in the left sidebar
3. Click **Create API Key**, give it a name, and copy the key`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${RESEND_BASE_URL}/api-keys`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch (error) {
      // A restricted (send-only) key returns 401 with name 'restricted_api_key' — it is valid
      if (error instanceof HttpError) {
        const body = error.response.body;
        if (typeof body === 'object' && body !== null && 'name' in body && body.name === 'restricted_api_key') {
          return { valid: true };
        }
      }
      return { valid: false, error: 'Invalid API key. Please check your Resend API key.' };
    }
  },
});

export const resend = createPiece({
  displayName: 'Resend',
  description: 'The email API for developers',
  auth: resendAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/resend.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['Tosh94'],
  actions: [
    sendEmail,
    sendBatchEmails,
    getEmailStatus,
    listEmails,
    cancelScheduledEmail,
    rescheduleEmail,
    createContact,
    updateContact,
    deleteContact,
    listContacts,
    listDomains,
    createDomain,
    deleteDomain,
    verifyDomain,
    listAudiences,
    createAudience,
    deleteAudience,
    listBroadcasts,
    createBroadcast,
    sendBroadcast,
    deleteBroadcast,
    getBroadcast,
    updateBroadcast,
    getContact,
    addContactToSegment,
    removeContactFromSegment,
    listContactSegments,
    listContactTopics,
    createContactProperty,
    getContactProperty,
    listContactProperties,
    updateContactProperty,
    deleteContactProperty,
    createSegment,
    getSegment,
    listSegments,
    deleteSegment,
    createTopic,
    getTopic,
    listTopics,
    updateTopic,
    deleteTopic,
    createTemplate,
    getTemplate,
    listTemplates,
    updateTemplate,
    deleteTemplate,
    publishTemplate,
    duplicateTemplate,
    createWebhook,
    getWebhook,
    listWebhooks,
    updateWebhook,
    deleteWebhook,
    getEmailAttachment,
    listEmailAttachments,
    listReceivedEmails,
    createCustomApiCallAction({
      baseUrl: () => RESEND_BASE_URL,
      auth: resendAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [emailBounced],
});

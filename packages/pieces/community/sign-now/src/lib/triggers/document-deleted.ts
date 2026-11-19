import { createTrigger } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../common/webhook';
import { signNowSchemas } from '../common/schemas';

const SAMPLE_DATA = {
  meta: {
    timestamp: 1661430936,
    event: 'user.document.delete',
    environment: 'https://api.signnow.com',
    initiator_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    callback_url: 'https://cloud.activepieces.com/api/v1/webhooks/FLOW_ID',
  },
  content: {
    document_id: 'a1b2c3d4e5f67890123456789abcdef012345678',
    document_name: 'Contract.pdf',
    user_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    initiator_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    initiator_email: 'owner@example.com',
  },
};

export const documentDeletedTrigger = createTrigger({
  name: 'document_deleted',
  classification: 'READ',
  sampleData: SAMPLE_DATA,
  ...signNowWebhook.webhookTriggerConfig({
    displayName: 'Document Deleted',
    description:
      'Triggers when a document is deleted from your SignNow account, including deletions made by this piece. Each trigger uses one of the 10 active webhooks SignNow allows without an API plan.',
    aiDescription:
      'Fires when a document is deleted from the connected SignNow account (user.document.delete), including deletions made by this piece. Emits the deleted document ID and name. Retried deliveries of the same event are ignored.',
    event: 'user.document.delete',
    storeKey: 'sign_now_document_deleted_subscription_id',
    outputSchema: signNowSchemas.documentEvent({ withInitiator: true }),
  }),
});

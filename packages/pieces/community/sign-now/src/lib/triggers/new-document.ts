import { createTrigger } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../common/webhook';
import { signNowSchemas } from '../common/schemas';

const SAMPLE_DATA = {
  meta: {
    timestamp: 1661430936,
    event: 'user.document.create',
    environment: 'https://api.signnow.com',
    initiator_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    callback_url: 'https://cloud.activepieces.com/api/v1/webhooks/FLOW_ID',
  },
  content: {
    document_id: 'a1b2c3d4e5f67890123456789abcdef012345678',
    document_name: 'Contract.pdf',
    user_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
  },
};

export const newDocumentTrigger = createTrigger({
  name: 'new_document',
  classification: 'READ',
  sampleData: SAMPLE_DATA,
  ...signNowWebhook.webhookTriggerConfig({
    displayName: 'New Document',
    description:
      'Triggers when a document is created in your SignNow account, including documents created by this piece. Each trigger uses one of the 10 active webhooks SignNow allows without an API plan.',
    aiDescription:
      'Fires when a document is created in the connected SignNow account (user.document.create), including uploads and template copies made by this piece, so avoid flows that create documents from this event. Emits the document ID, name and owner. Retried deliveries of the same event are ignored.',
    event: 'user.document.create',
    storeKey: 'sign_now_new_document_subscription_id',
    outputSchema: signNowSchemas.documentEvent({ withInitiator: false }),
  }),
});

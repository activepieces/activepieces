import { createTrigger } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../common/webhook';
import { signNowSchemas } from '../common/schemas';

const SAMPLE_DATA = {
  meta: {
    timestamp: 1661430936,
    event: 'user.document.update',
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

export const documentUpdatedTrigger = createTrigger({
  name: 'document_updated',
  classification: 'READ',
  sampleData: SAMPLE_DATA,
  ...signNowWebhook.webhookTriggerConfig({
    displayName: 'Document Updated',
    description:
      'Triggers when a document in your SignNow account is updated, including changes made by this piece. Each trigger uses one of the 10 active webhooks SignNow allows without an API plan.',
    aiDescription:
      'Fires when a document in the connected SignNow account changes (user.document.update), including field, name and invite changes made by this piece, so avoid flows that edit documents from this event. Emits the document ID, name and owner. Retried deliveries of the same event are ignored.',
    event: 'user.document.update',
    storeKey: 'sign_now_document_updated_subscription_id',
    outputSchema: signNowSchemas.documentEvent({ withInitiator: false }),
  }),
});

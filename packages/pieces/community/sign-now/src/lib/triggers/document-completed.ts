import { createTrigger } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../common/webhook';
import { signNowSchemas } from '../common/schemas';

const SAMPLE_DATA = {
  meta: {
    timestamp: 1661430936,
    event: 'user.document.complete',
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

export const documentCompletedTrigger = createTrigger({
  name: 'document_completed',
  classification: 'READ',
  sampleData: SAMPLE_DATA,
  ...signNowWebhook.webhookTriggerConfig({
    displayName: 'Document Completed',
    description:
      'Triggers when all signers have filled in and signed a document. Each trigger uses one of the 10 active webhooks SignNow allows without an API plan.',
    aiDescription:
      'Fires when a SignNow document is fully completed, meaning every signer has filled in and signed it (user.document.complete). Use to act on a finished, signed document, for example download, archive or notify. Retried deliveries of the same event are ignored.',
    event: 'user.document.complete',
    storeKey: 'sign_now_document_completed_subscription_id',
    outputSchema: signNowSchemas.documentEvent({ withInitiator: false }),
  }),
});

import { createTrigger } from '@activepieces/pieces-framework';
import { signNowWebhook } from '../common/webhook';
import { signNowSchemas } from '../common/schemas';

const SAMPLE_DATA = {
  meta: {
    timestamp: 1661430936,
    event: 'user.document_group.complete',
    environment: 'https://api.signnow.com',
    initiator_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    callback_url: 'https://cloud.activepieces.com/api/v1/webhooks/FLOW_ID',
  },
  content: {
    group_id: 'a1b2c3d4e5f67890123456789abcdef012345678',
    group_name: 'Contract Package',
    user_id: 'b2c3d4e5f67890123456789abcdef0123456789a',
    initiator_id: 'c3d4e5f67890123456789abcdef0123456789ab1',
    initiator_email: 'signer@example.com',
    completed_at: 1700000000,
    documents: [
      {
        document_id: 'd4e5f67890123456789abcdef0123456789ab12c',
        document_name: 'Contract',
        status: 'completed',
      },
    ],
    invite_steps: [
      {
        order: 1,
        status: 'completed',
        signers: [
          {
            email: 'signer@example.com',
            role_name: 'Signer 1',
            action: 'sign',
            status: 'fulfilled',
            document_id: 'd4e5f67890123456789abcdef0123456789ab12c',
            signed_at: 1700000000,
          },
        ],
      },
    ],
  },
};

export const documentGroupCompletedTrigger = createTrigger({
  name: 'document_group_completed',
  classification: 'READ',
  sampleData: SAMPLE_DATA,
  ...signNowWebhook.webhookTriggerConfig({
    displayName: 'Document Group Completed',
    description:
      'Triggers when all signers have filled in and signed every document in a document group. Each trigger uses one of the 10 active webhooks SignNow allows without an API plan.',
    aiDescription:
      'Fires when a SignNow document group is fully completed, meaning every signer has signed all documents in the group (user.document_group.complete). Use to act on a finished multi-document signing package. Retried deliveries of the same event are ignored.',
    event: 'user.document_group.complete',
    storeKey: 'sign_now_document_group_completed_subscription_id',
    outputSchema: signNowSchemas.documentGroupEvent,
  }),
});

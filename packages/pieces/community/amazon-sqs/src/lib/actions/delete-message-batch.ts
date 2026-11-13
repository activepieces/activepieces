import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { mapBatchResult, readReceiptHandleEntries } from '../common/queue-settings';
import { batchResultOutputSchema } from '../output-schemas';

export const deleteMessageBatch = createAction({
  name: 'delete_message_batch',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Message Batch',
  auth: amazonSqsAuth,
  description: 'Deletes up to 10 received messages from a queue in one request.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes 2 to 10 received messages (for one message use Delete Message) from one Amazon SQS queue, identified by their receipt handles (not message IDs). Entry IDs in the result are entry1..entryN in input order. Returns per-entry successful and failed lists; partial failure does not fail the step, so check the failed list (an expired handle fails with ReceiptHandleIsInvalid). Repeating with still-valid handles succeeds without effect.',
    idempotent: true,
  },
  outputSchema: batchResultOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    entries: Property.Array({
      displayName: 'Messages',
      description: 'Between 1 and 10 receipt handles.',
      required: true,
      properties: {
        receiptHandle: Property.LongText({
          displayName: 'Receipt Handle',
          description: 'From Receive Messages or the New Message trigger.',
          required: true,
        }),
      },
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const entries = readReceiptHandleEntries({ entries: propsValue.entries, withTimeout: false });
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries.map((entry) => ({ Id: entry.id, ReceiptHandle: entry.receiptHandle })),
      })
    );
    return mapBatchResult({ successful: response.Successful, failed: response.Failed });
  },
});

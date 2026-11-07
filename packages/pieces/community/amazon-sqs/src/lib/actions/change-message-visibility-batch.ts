import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { mapBatchResult, readReceiptHandleEntries } from '../common/queue-settings';
import { batchResultOutputSchema } from '../output-schemas';

export const changeMessageVisibilityBatch = createAction({
  name: 'change_message_visibility_batch',
  classification: 'WRITE',
  displayName: 'Change Message Visibility Batch',
  auth: amazonSqsAuth,
  description: 'Changes the visibility timeout of up to 10 received messages.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes the visibility timeout of 2 to 10 received Amazon SQS messages (for one message use Change Message Visibility) in one queue, each identified by its receipt handle with its own timeout (0-43200 seconds; 0 releases it immediately). Entry IDs in the result are entry1..entryN in input order. Returns per-entry successful and failed lists; partial failure does not fail the step. Each timeout counts from now, so repeating restarts the timers.',
    idempotent: false,
  },
  outputSchema: batchResultOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    entries: Property.Array({
      displayName: 'Messages',
      description: 'Between 1 and 10 messages.',
      required: true,
      properties: {
        receiptHandle: Property.LongText({
          displayName: 'Receipt Handle',
          description: 'From Receive Messages or the New Message trigger.',
          required: true,
        }),
        visibilityTimeout: Property.Number({
          displayName: 'Visibility Timeout (seconds)',
          description: 'New timeout from now, 0-43200 seconds.',
          required: true,
        }),
      },
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const entries = readReceiptHandleEntries({ entries: propsValue.entries, withTimeout: true });
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.ChangeMessageVisibilityBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries.map((entry) => ({
          Id: entry.id,
          ReceiptHandle: entry.receiptHandle,
          VisibilityTimeout: entry.visibilityTimeout,
        })),
      })
    );
    return mapBatchResult({ successful: response.Successful, failed: response.Failed });
  },
});

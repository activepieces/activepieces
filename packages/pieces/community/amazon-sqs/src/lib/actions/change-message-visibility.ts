import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, parseOptionalInt, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { changeVisibilityOutputSchema } from '../output-schemas';

export const changeMessageVisibility = createAction({
  name: 'change_message_visibility',
  classification: 'WRITE',
  displayName: 'Change Message Visibility',
  auth: amazonSqsAuth,
  description:
    'Extends or shortens how long a received message stays hidden. Set 0 to make it visible again right away.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes the visibility timeout of one received Amazon SQS message, identified by its receipt handle. Use to get more processing time, or set 0 to release the message back to the queue immediately. The new timeout counts from now, so repeating the call with the same value restarts the timer rather than stacking.',
    idempotent: false,
  },
  outputSchema: changeVisibilityOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    receiptHandle: Property.LongText({
      displayName: 'Receipt Handle',
      description: 'The receipt handle from Receive Messages or the New Message trigger.',
      required: true,
    }),
    visibilityTimeout: Property.Number({
      displayName: 'Visibility Timeout (seconds)',
      description: 'New timeout from now, 0-43200 seconds.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const receiptHandle = propsValue.receiptHandle?.trim();
    if (!receiptHandle) {
      throw new Error('Receipt Handle is required.');
    }
    const visibilityTimeout = parseOptionalInt({ value: propsValue.visibilityTimeout, name: 'Visibility Timeout', min: 0, max: 43200 });
    if (visibilityTimeout === undefined) {
      throw new Error('Visibility Timeout is required.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(
      new sqs.ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: visibilityTimeout,
      })
    );
    return { success: true, visibilityTimeout };
  },
});

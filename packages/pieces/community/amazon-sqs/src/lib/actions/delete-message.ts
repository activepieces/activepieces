import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { deleteMessageOutputSchema } from '../output-schemas';

export const deleteMessage = createAction({
  name: 'delete_message',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Message',
  auth: amazonSqsAuth,
  description: 'Deletes a received message from a queue using its receipt handle.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one message from an Amazon SQS queue, identified by the receipt handle returned when the message was received (not the message ID). Use after a message has been processed. Repeating the delete with the same still-valid receipt handle succeeds without effect, but an expired or invalid receipt handle (for example after the visibility timeout ended and the message was received again) fails with ReceiptHandleIsInvalid.',
    idempotent: true,
  },
  outputSchema: deleteMessageOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    receiptHandle: Property.LongText({
      displayName: 'Receipt Handle',
      description: 'The receipt handle from Receive Messages or the New Message trigger.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const receiptHandle = propsValue.receiptHandle?.trim();
    if (!receiptHandle) {
      throw new Error('Receipt Handle is required.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(
      new sqs.DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
    );
    return { success: true, queueUrl };
  },
});

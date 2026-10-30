import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import {
  createSqsClient, loadSqs,
  parseOptionalInt,
  resolveQueueUrl,
  toStringMessageAttributes,
} from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { sendMessageOutputSchema } from '../output-schemas';

export const sendMessage = createAction({
  name: 'sendMessage',
  classification: 'WRITE',
  displayName: 'Send Message',
  auth: amazonSqsAuth,
  description: 'Sends a message to an Amazon SQS queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends one message to an Amazon SQS queue (standard or FIFO), given the full queue URL in "Queue URL (manual)" or the Queue dropdown. Supports an optional delay, string message attributes, and the message group ID (required for FIFO) and deduplication ID (FIFO without content-based deduplication). Returns the message ID. For 2 to 10 messages in one call, use Send Message Batch. Not idempotent on standard queues: each call enqueues a new message; on FIFO queues a repeat with the same deduplication ID within 5 minutes is dropped by SQS.',
    idempotent: false,
  },
  outputSchema: sendMessageOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    messageBody: Property.LongText({
      displayName: 'Message Body',
      description: 'The message content as text or JSON, up to 1 MiB.',
      placeholder: '{"orderId":"1234","status":"paid"}',
      required: true,
    }),
    delaySeconds: Property.Number({
      displayName: 'Delay (seconds)',
      description: 'Seconds (0-900) to hide the message. Not supported on FIFO queues.',
      required: false,
    }),
    messageAttributes: Property.Object({
      displayName: 'Message Attributes',
      description: 'Up to 10 string attributes sent alongside the body.',
      required: false,
    }),
    messageGroupId: Property.ShortText({
      displayName: 'Message Group ID',
      description: 'Required for FIFO queues. Same-group messages arrive in order.',
      placeholder: 'order-1234',
      required: false,
    }),
    messageDeduplicationId: Property.ShortText({
      displayName: 'Message Deduplication ID',
      description: 'FIFO only. Required unless content-based deduplication is on.',
      placeholder: 'order-1234-paid',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const delaySeconds = parseOptionalInt({ value: propsValue.delaySeconds, name: 'Delay (seconds)', min: 0, max: 900 });
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: propsValue.messageBody,
        DelaySeconds: delaySeconds,
        MessageAttributes: toStringMessageAttributes(propsValue.messageAttributes),
        MessageGroupId: propsValue.messageGroupId?.trim() || undefined,
        MessageDeduplicationId: propsValue.messageDeduplicationId?.trim() || undefined,
      })
    );
    return {
      messageId: response.MessageId ?? null,
      sequenceNumber: response.SequenceNumber ?? null,
      md5OfMessageBody: response.MD5OfMessageBody ?? null,
    };
  },
});

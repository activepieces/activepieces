import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, parseOptionalInt, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { sendMessageBatchOutputSchema } from '../output-schemas';

export const sendMessageBatch = createAction({
  name: 'send_message_batch',
  classification: 'WRITE',
  displayName: 'Send Message Batch',
  auth: amazonSqsAuth,
  description: 'Sends up to 10 messages to a queue in one request.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends 2 to 10 messages (for a single message use Send Message) to one Amazon SQS queue in a single request. Each entry has a body and optional delay, message group ID and deduplication ID (FIFO). Returns per-entry successful and failed lists; partial failure does not fail the step, so check the failed list. Not idempotent on standard queues: rerunning enqueues the messages again.',
    idempotent: false,
  },
  outputSchema: sendMessageBatchOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    entries: Property.Array({
      displayName: 'Messages',
      description: 'Between 1 and 10 messages.',
      required: true,
      properties: {
        messageBody: Property.LongText({
          displayName: 'Message Body',
          required: true,
        }),
        delaySeconds: Property.Number({
          displayName: 'Delay (seconds)',
          description: '0-900. Not supported per message on FIFO queues.',
          required: false,
        }),
        messageGroupId: Property.ShortText({
          displayName: 'Message Group ID',
          description: 'Required for FIFO queues.',
          required: false,
        }),
        messageDeduplicationId: Property.ShortText({
          displayName: 'Message Deduplication ID',
          description: 'FIFO only, unless content-based deduplication is on.',
          required: false,
        }),
      },
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const rawEntries = (propsValue.entries ?? []).map(parseBatchEntry);
    if (rawEntries.length === 0 || rawEntries.length > 10) {
      throw new Error('Provide between 1 and 10 messages.');
    }
    const entries = rawEntries.map((entry, index) => {
      if (typeof entry.messageBody !== 'string' || entry.messageBody === '') {
        throw new Error(`Message ${index + 1} needs a message body.`);
      }
      return {
        Id: `msg${index + 1}`,
        MessageBody: entry.messageBody,
        DelaySeconds: parseOptionalInt({ value: entry.delaySeconds, name: `Delay of message ${index + 1}`, min: 0, max: 900 }),
        MessageGroupId: entry.messageGroupId?.trim() || undefined,
        MessageDeduplicationId: entry.messageDeduplicationId?.trim() || undefined,
      };
    });
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.SendMessageBatchCommand({ QueueUrl: queueUrl, Entries: entries })
    );
    const successful = (response.Successful ?? []).map((item) => ({
      id: item.Id ?? null,
      messageId: item.MessageId ?? null,
      sequenceNumber: item.SequenceNumber ?? null,
      md5OfMessageBody: item.MD5OfMessageBody ?? null,
    }));
    const failed = (response.Failed ?? []).map((item) => ({
      id: item.Id ?? null,
      code: item.Code ?? null,
      message: item.Message ?? null,
      senderFault: item.SenderFault ?? null,
    }));
    return {
      successful,
      failed,
      successCount: successful.length,
      failureCount: failed.length,
    };
  },
});

function parseBatchEntry(entry: unknown): BatchEntry {
  if (typeof entry !== 'object' || entry === null) {
    return {};
  }
  const messageBody: unknown = Reflect.get(entry, 'messageBody');
  const delaySeconds: unknown = Reflect.get(entry, 'delaySeconds');
  const messageGroupId: unknown = Reflect.get(entry, 'messageGroupId');
  const messageDeduplicationId: unknown = Reflect.get(entry, 'messageDeduplicationId');
  return {
    messageBody: typeof messageBody === 'string' ? messageBody : undefined,
    delaySeconds,
    messageGroupId: typeof messageGroupId === 'string' ? messageGroupId : undefined,
    messageDeduplicationId:
      typeof messageDeduplicationId === 'string' ? messageDeduplicationId : undefined,
  };
}

type BatchEntry = {
  messageBody?: string;
  delaySeconds?: unknown;
  messageGroupId?: string;
  messageDeduplicationId?: string;
};

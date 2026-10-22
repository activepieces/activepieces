import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import type { Message, SQSClient } from '@aws-sdk/client-sqs';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, normalizeMessage, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { newMessageOutputSchema } from '../output-schemas';

export const newMessage = createTrigger({
  auth: amazonSqsAuth,
  name: 'new_message',
  displayName: 'New Message in Queue',
  description:
    'Triggers for each new message in a queue. Messages are deleted from the queue once received by this trigger.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once per message that arrives in an Amazon SQS queue. Each poll receives up to 100 messages, emits each one, then deletes them from the queue, so the queue should be dedicated to this flow. Delivery is at-least-once: a message whose delete fails is still emitted, is not remembered as seen, and fires again when SQS makes it visible again. Recent message IDs that were deleted are remembered to suppress repeats. A failed flow run does not put the message back.',
  },
  outputSchema: newMessageOutputSchema,
  props: {
    info: Property.MarkDown({
      value:
        'Messages are **deleted from the queue** after this trigger receives them. Use a queue dedicated to this flow. Testing does not delete messages, but it does receive them, which increases their receive count. Repeated tests can move messages to a dead-letter queue if the queue has a receive limit.',
    }),
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put(SEEN_IDS_KEY, []);
  },
  async onDisable(context) {
    await context.store.delete(SEEN_IDS_KEY);
  },
  async run(context) {
    const queueUrl = resolveQueueUrl(context.propsValue);
    const client = await createSqsClient({ auth: context.auth.props, queueUrl });
    const received: Message[] = [];
    for (let batch = 0; batch < MAX_BATCHES_PER_POLL; batch++) {
      const messages = await receiveBatch({ client, queueUrl, visibilityTimeout: undefined, waitTimeSeconds: 1 });
      received.push(...messages);
      if (messages.length < 10) {
        break;
      }
    }
    if (received.length === 0) {
      return [];
    }
    const seen = (await context.store.get<string[]>(SEEN_IDS_KEY)) ?? [];
    const seenSet = new Set(seen);
    const fresh = received.filter((m) => !m.MessageId || !seenSet.has(m.MessageId));
    const { deletedIds, failedCount } = await deleteReceived({ client, queueUrl, messages: received });
    for (const message of fresh) {
      const id = message.MessageId;
      if (id && deletedIds.has(id) && !seenSet.has(id)) {
        seenSet.add(id);
        seen.push(id);
      }
    }
    try {
      await context.store.put(SEEN_IDS_KEY, seen.slice(-MAX_SEEN_IDS));
    } catch (error) {
      console.warn('Amazon SQS: could not save seen message IDs; messages are still emitted', error);
    }
    if (failedCount > 0) {
      console.warn(
        `Amazon SQS: ${failedCount} received message(s) could not be deleted and will be emitted again when they are received again.`
      );
    }
    return fresh.map(normalizeMessage);
  },
  async test(context) {
    const queueUrl = resolveQueueUrl(context.propsValue);
    const client = await createSqsClient({ auth: context.auth.props, queueUrl });
    const messages = await receiveBatch({ client, queueUrl, visibilityTimeout: 0, waitTimeSeconds: 0 });
    return messages.map(normalizeMessage);
  },
  sampleData: {
    messageId: '5fea7756-0ea4-451a-a703-a558b933e274',
    receiptHandle: 'AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a...',
    body: '{"orderId":"1234","status":"paid"}',
    md5OfBody: 'fafb00f5732ab283681e124bf8747ed1',
    sentAt: '2026-10-22T09:15:00.000Z',
    approximateReceiveCount: 1,
    approximateFirstReceiveAt: '2026-10-22T09:15:02.000Z',
    senderId: 'AIDASSYFHUBOBT7F4XT75',
    messageGroupId: null,
    messageDeduplicationId: null,
    sequenceNumber: null,
    messageAttributes: { source: 'checkout' },
  },
});

const SEEN_IDS_KEY = 'sqs_seen_message_ids';
const MAX_SEEN_IDS = 1000;
const MAX_BATCHES_PER_POLL = 10;

async function receiveBatch({
  client,
  queueUrl,
  visibilityTimeout,
  waitTimeSeconds,
}: {
  client: SQSClient;
  queueUrl: string;
  visibilityTimeout: number | undefined;
  waitTimeSeconds: number;
}): Promise<Message[]> {
  const sqs = await loadSqs();
  const response = await client.send(
    new sqs.ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: waitTimeSeconds,
      VisibilityTimeout: visibilityTimeout,
      MessageSystemAttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    })
  );
  return response.Messages ?? [];
}

async function deleteReceived({
  client,
  queueUrl,
  messages,
}: {
  client: SQSClient;
  queueUrl: string;
  messages: Message[];
}): Promise<{ deletedIds: Set<string>; failedCount: number }> {
  const sqs = await loadSqs();
  const deletedIds = new Set<string>();
  let failedCount = 0;
  const withHandles = messages.filter((m) => m.ReceiptHandle);
  for (let i = 0; i < withHandles.length; i += 10) {
    const chunk = withHandles.slice(i, i + 10);
    try {
      const response = await client.send(
        new sqs.DeleteMessageBatchCommand({
          QueueUrl: queueUrl,
          Entries: chunk.map((m, index) => ({
            Id: `d${index}`,
            ReceiptHandle: m.ReceiptHandle,
          })),
        })
      );
      const failedEntryIds = new Set((response.Failed ?? []).map((f) => f.Id));
      chunk.forEach((m, index) => {
        if (failedEntryIds.has(`d${index}`)) {
          failedCount++;
        } else if (m.MessageId) {
          deletedIds.add(m.MessageId);
        }
      });
    } catch (error) {
      console.warn('Amazon SQS: delete request failed', error);
      failedCount += chunk.length;
    }
  }
  return { deletedIds, failedCount };
}

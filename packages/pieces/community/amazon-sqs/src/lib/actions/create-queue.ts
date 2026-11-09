import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs } from '../common/client';
import { buildQueueAttributes, queueSettingsProps, toTagMap } from '../common/queue-settings';
import { createQueueOutputSchema } from '../output-schemas';

export const createQueue = createAction({
  name: 'create_queue',
  classification: 'WRITE',
  displayName: 'Create Queue',
  auth: amazonSqsAuth,
  description: 'Creates a standard or FIFO queue in the connection region.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates an Amazon SQS queue in the connection region and returns its URL. Set fifo to create a FIFO queue (".fifo" is added to the name if missing); content-based deduplication applies only to FIFO. Optional settings: visibility timeout, retention, delivery delay, max message size, receive wait time, a dead-letter queue (ARN plus max receive count) and tags. Idempotent when repeated with the same name and identical settings (returns the existing URL); fails with QueueNameExists if a queue with that name has different settings. A name of a queue deleted less than 60 seconds ago cannot be reused yet.',
    idempotent: true,
  },
  outputSchema: createQueueOutputSchema,
  props: {
    queueName: Property.ShortText({
      displayName: 'Queue Name',
      description: 'Up to 80 letters, numbers, hyphens or underscores.',
      required: true,
      placeholder: 'my-queue',
    }),
    fifo: Property.Checkbox({
      displayName: 'FIFO Queue',
      description: 'Strict ordering and exactly-once. Adds ".fifo" to the name.',
      required: false,
      defaultValue: false,
    }),
    contentBasedDeduplication: Property.Checkbox({
      displayName: 'Content-Based Deduplication',
      description: 'FIFO only. Deduplicate by a hash of the message body.',
      required: false,
      defaultValue: false,
    }),
    visibilityTimeout: queueSettingsProps.visibilityTimeout,
    messageRetentionPeriod: queueSettingsProps.messageRetentionPeriod,
    delaySeconds: queueSettingsProps.delaySeconds,
    maximumMessageSize: queueSettingsProps.maximumMessageSize,
    receiveMessageWaitTimeSeconds: queueSettingsProps.receiveMessageWaitTimeSeconds,
    deadLetterQueueArn: queueSettingsProps.deadLetterQueueArn,
    maxReceiveCount: queueSettingsProps.maxReceiveCount,
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Up to 50 key/value tags for cost tracking.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const rawName = propsValue.queueName?.trim() ?? '';
    const fifo = propsValue.fifo === true;
    const queueName = fifo && !rawName.endsWith('.fifo') ? `${rawName}.fifo` : rawName;
    const baseName = queueName.endsWith('.fifo') ? queueName.slice(0, -5) : queueName;
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(baseName) || queueName.length > 80) {
      throw new Error('Queue Name must be 1-80 characters: letters, numbers, hyphens or underscores (FIFO names end in ".fifo").');
    }
    if (!fifo && queueName.endsWith('.fifo')) {
      throw new Error('Names ending in ".fifo" are only allowed for FIFO queues. Turn on "FIFO Queue".');
    }
    if (!fifo && propsValue.contentBasedDeduplication === true) {
      throw new Error('Content-Based Deduplication is only available for FIFO queues.');
    }
    const attributes = buildQueueAttributes(propsValue);
    if (fifo) {
      attributes['FifoQueue'] = 'true';
      if (propsValue.contentBasedDeduplication === true) {
        attributes['ContentBasedDeduplication'] = 'true';
      }
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props });
    const response = await client.send(
      new sqs.CreateQueueCommand({
        QueueName: queueName,
        Attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        tags: toTagMap(propsValue.tags),
      })
    );
    return { queueName, queueUrl: response.QueueUrl ?? null, fifo };
  },
});

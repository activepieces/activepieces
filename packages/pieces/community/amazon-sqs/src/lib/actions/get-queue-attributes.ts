import { createAction } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { getQueueAttributesOutputSchema } from '../output-schemas';

export const getQueueAttributes = createAction({
  name: 'get_queue_attributes',
  classification: 'READ',
  displayName: 'Get Queue Attributes',
  auth: amazonSqsAuth,
  description: 'Gets message counts and settings of a queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the attributes of one Amazon SQS queue: approximate number of visible, in-flight and delayed messages, ARN, whether it is FIFO, visibility timeout, retention, delay, max message size, created and modified times, and redrive policy. Use to check queue depth or settings. Read-only; counts are approximate.',
    idempotent: true,
  },
  outputSchema: getQueueAttributesOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(
      new sqs.GetQueueAttributesCommand({ QueueUrl: queueUrl, AttributeNames: ['All'] })
    );
    const a = response.Attributes ?? {};
    let redrivePolicy: unknown = null;
    if (a['RedrivePolicy']) {
      try {
        redrivePolicy = JSON.parse(a['RedrivePolicy']);
      } catch {
        redrivePolicy = a['RedrivePolicy'];
      }
    }
    return {
      queueUrl,
      queueArn: a['QueueArn'] ?? null,
      approximateNumberOfMessages: toNumber(a['ApproximateNumberOfMessages']),
      approximateNumberOfMessagesNotVisible: toNumber(a['ApproximateNumberOfMessagesNotVisible']),
      approximateNumberOfMessagesDelayed: toNumber(a['ApproximateNumberOfMessagesDelayed']),
      fifoQueue: a['FifoQueue'] === 'true',
      contentBasedDeduplication: a['ContentBasedDeduplication'] === 'true',
      visibilityTimeout: toNumber(a['VisibilityTimeout']),
      messageRetentionPeriod: toNumber(a['MessageRetentionPeriod']),
      maximumMessageSize: toNumber(a['MaximumMessageSize']),
      delaySeconds: toNumber(a['DelaySeconds']),
      receiveMessageWaitTimeSeconds: toNumber(a['ReceiveMessageWaitTimeSeconds']),
      createdAt: toIso(a['CreatedTimestamp']),
      lastModifiedAt: toIso(a['LastModifiedTimestamp']),
      redrivePolicy,
    };
  },
});

function toNumber(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toIso(value: string | undefined): string | null {
  const seconds = toNumber(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

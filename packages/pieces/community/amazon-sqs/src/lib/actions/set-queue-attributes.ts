import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { buildQueueAttributes, queueSettingsProps } from '../common/queue-settings';
import { setQueueAttributesOutputSchema } from '../output-schemas';

export const setQueueAttributes = createAction({
  name: 'set_queue_attributes',
  classification: 'WRITE',
  displayName: 'Set Queue Attributes',
  auth: amazonSqsAuth,
  description: 'Updates queue settings. Only the fields you fill are changed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates settings of one existing Amazon SQS queue: visibility timeout, message retention, delivery delay, max message size, receive wait time, dead-letter queue (ARN plus max receive count) and, for FIFO queues, content-based deduplication. Only the provided settings are changed; others keep their current values. Idempotent: repeating with the same values leaves the queue unchanged. Changes can take up to 60 seconds to apply (retention up to 15 minutes). Returns the names of the attributes sent.',
    idempotent: true,
  },
  outputSchema: setQueueAttributesOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    visibilityTimeout: queueSettingsProps.visibilityTimeout,
    messageRetentionPeriod: queueSettingsProps.messageRetentionPeriod,
    delaySeconds: queueSettingsProps.delaySeconds,
    maximumMessageSize: queueSettingsProps.maximumMessageSize,
    receiveMessageWaitTimeSeconds: queueSettingsProps.receiveMessageWaitTimeSeconds,
    deadLetterQueueArn: queueSettingsProps.deadLetterQueueArn,
    maxReceiveCount: queueSettingsProps.maxReceiveCount,
    contentBasedDeduplication: Property.StaticDropdown({
      displayName: 'Content-Based Deduplication',
      description: 'FIFO queues only. Leave empty to keep the current value.',
      required: false,
      options: {
        options: [
          { label: 'Turn on', value: 'true' },
          { label: 'Turn off', value: 'false' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const attributes = buildQueueAttributes(propsValue);
    const dedup = propsValue.contentBasedDeduplication;
    if (dedup === 'true' || dedup === 'false') {
      attributes['ContentBasedDeduplication'] = dedup;
    }
    const updatedAttributes = Object.keys(attributes);
    if (updatedAttributes.length === 0) {
      throw new Error('Fill at least one setting to update.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(
      new sqs.SetQueueAttributesCommand({ QueueUrl: queueUrl, Attributes: attributes })
    );
    return { success: true, queueUrl, updatedAttributes };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { purgeQueueOutputSchema } from '../output-schemas';

export const purgeQueue = createAction({
  name: 'purge_queue',
  classification: 'DESTRUCTIVE',
  displayName: 'Purge Queue',
  auth: amazonSqsAuth,
  description:
    'Deletes all messages in a queue. This cannot be undone and can run once every 60 seconds per queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Irreversibly deletes every message in an Amazon SQS queue (the queue itself stays). Only use when the user explicitly asks to empty a queue. SQS allows one purge per queue every 60 seconds; a second call within that window fails with PurgeQueueInProgress. Deletion can take up to 60 seconds to complete.',
    idempotent: false,
  },
  outputSchema: purgeQueueOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(new sqs.PurgeQueueCommand({ QueueUrl: queueUrl }));
    return { success: true, queueUrl };
  },
});

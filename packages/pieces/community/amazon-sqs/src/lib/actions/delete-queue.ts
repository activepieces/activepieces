import { createAction } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { deleteQueueOutputSchema } from '../output-schemas';

export const deleteQueue = createAction({
  name: 'delete_queue',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Queue',
  auth: amazonSqsAuth,
  description: 'Permanently deletes a queue and every message in it.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one Amazon SQS queue and all messages in it. Irreversible: the messages cannot be recovered. Deletion can take up to 60 seconds, and a queue with the same name cannot be created until 60 seconds after the delete. Use only when the user explicitly wants the whole queue removed; to only empty it use Purge Queue, to remove one message use Delete Message.',
    idempotent: false,
  },
  outputSchema: deleteQueueOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(new sqs.DeleteQueueCommand({ QueueUrl: queueUrl }));
    return { success: true, queueUrl };
  },
});

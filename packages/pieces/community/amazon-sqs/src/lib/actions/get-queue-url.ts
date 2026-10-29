import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs } from '../common/client';
import { getQueueUrlOutputSchema } from '../output-schemas';

export const getQueueUrl = createAction({
  name: 'get_queue_url',
  classification: 'READ',
  displayName: 'Get Queue URL',
  auth: amazonSqsAuth,
  description: 'Finds the URL of a queue from its exact name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the full URL of one Amazon SQS queue in the connection region, looked up by its exact name (FIFO names end in ".fifo"). Optionally give the 12-digit AWS account ID that owns the queue to look up a queue shared from another account. Use the URL as the queue for other actions. Read-only; fails with QueueDoesNotExist if no queue has that name.',
    idempotent: true,
  },
  outputSchema: getQueueUrlOutputSchema,
  props: {
    queueName: Property.ShortText({
      displayName: 'Queue Name',
      description: 'Exact queue name, case-sensitive.',
      required: true,
      placeholder: 'my-queue',
    }),
    queueOwnerAccountId: Property.ShortText({
      displayName: 'Queue Owner Account ID',
      description: 'Only for a queue owned by another AWS account.',
      required: false,
      placeholder: '123456789012',
    }),
  },
  async run({ propsValue, auth }) {
    const queueName = propsValue.queueName?.trim();
    if (!queueName) {
      throw new Error('Queue Name is required.');
    }
    const ownerId = propsValue.queueOwnerAccountId?.trim() || undefined;
    if (ownerId && !/^\d{12}$/.test(ownerId)) {
      throw new Error('Queue Owner Account ID must be a 12-digit AWS account ID.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props });
    const response = await client.send(
      new sqs.GetQueueUrlCommand({ QueueName: queueName, QueueOwnerAWSAccountId: ownerId })
    );
    return { queueName, queueUrl: response.QueueUrl ?? null };
  },
});

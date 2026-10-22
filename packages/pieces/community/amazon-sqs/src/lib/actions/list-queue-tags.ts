import { createAction } from '@activepieces/pieces-framework';
import { ListQueueTagsCommand } from '@aws-sdk/client-sqs';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { listQueueTagsOutputSchema } from '../output-schemas';

export const listQueueTags = createAction({
  name: 'list_queue_tags',
  classification: 'READ',
  displayName: 'List Queue Tags',
  auth: amazonSqsAuth,
  description: 'Gets all tags on a queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns all cost allocation tags on one Amazon SQS queue as a key/value object, plus the tag count. Read-only.',
    idempotent: true,
  },
  outputSchema: listQueueTagsOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const client = createSqsClient({ auth: auth.props, queueUrl });
    const response = await client.send(new ListQueueTagsCommand({ QueueUrl: queueUrl }));
    const tags = response.Tags ?? {};
    return { queueUrl, tags, count: Object.keys(tags).length };
  },
});

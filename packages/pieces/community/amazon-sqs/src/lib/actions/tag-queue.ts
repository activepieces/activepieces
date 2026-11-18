import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { toTagMap } from '../common/queue-settings';
import { tagQueueOutputSchema } from '../output-schemas';

export const tagQueue = createAction({
  name: 'tag_queue',
  classification: 'WRITE',
  displayName: 'Tag Queue',
  auth: amazonSqsAuth,
  description: 'Adds or updates cost allocation tags on a queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds or overwrites key/value tags on one Amazon SQS queue (a queue holds at most 50 tags; keys are case-sensitive). Tags not mentioned are kept. Idempotent: repeating with the same tags leaves the queue unchanged. To remove tags use Untag Queue; to read them use List Queue Tags.',
    idempotent: true,
  },
  outputSchema: tagQueueOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Key/value pairs to add or overwrite.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const tags = toTagMap(propsValue.tags);
    if (!tags) {
      throw new Error('Add at least one tag.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(new sqs.TagQueueCommand({ QueueUrl: queueUrl, Tags: tags }));
    return { success: true, queueUrl, tagKeys: Object.keys(tags) };
  },
});

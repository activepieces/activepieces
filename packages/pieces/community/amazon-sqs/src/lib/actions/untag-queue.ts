import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, resolveQueueUrl } from '../common/client';
import { manualQueueUrlProp, queueUrlDropdown } from '../common/props';
import { tagQueueOutputSchema } from '../output-schemas';

export const untagQueue = createAction({
  name: 'untag_queue',
  classification: 'WRITE',
  displayName: 'Untag Queue',
  auth: amazonSqsAuth,
  description: 'Removes tags from a queue by key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes the tags with the given keys (case-sensitive) from one Amazon SQS queue. The queue and its messages are not affected; keys that are not present are ignored, so repeating the call is safe. Use Tag Queue to add tags back and List Queue Tags to see current tags.',
    idempotent: true,
  },
  outputSchema: tagQueueOutputSchema,
  props: {
    queueUrl: queueUrlDropdown,
    manualQueueUrl: manualQueueUrlProp,
    tagKeys: Property.Array({
      displayName: 'Tag Keys',
      description: 'Keys of the tags to remove.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const queueUrl = resolveQueueUrl(propsValue);
    const tagKeys = (propsValue.tagKeys ?? [])
      .map((key) => (typeof key === 'string' ? key.trim() : ''))
      .filter((key) => key !== '');
    if (tagKeys.length === 0) {
      throw new Error('Add at least one tag key.');
    }
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props, queueUrl });
    await client.send(new sqs.UntagQueueCommand({ QueueUrl: queueUrl, TagKeys: tagKeys }));
    return { success: true, queueUrl, tagKeys };
  },
});

import { createAction } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';
import { topicDropdown } from '../common/props';

export const deleteTopicAction = createAction({
  auth: amazonSnsAuth,
  name: 'delete_topic',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Topic',
  description: 'Deletes a topic and all of its subscriptions. This cannot be undone.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes an SNS topic by ARN together with all of its subscriptions; messages not yet delivered may be lost. Cannot be undone. Idempotent: AWS reports success when the topic is already gone.',
    idempotent: true,
  },
  props: {
    topic_arn: topicDropdown({
      displayName: 'Topic',
      description: 'The topic to delete.',
      required: true,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'topic_arn', label: 'Topic ARN' },
    ],
  },
  async run(context) {
    const topicArn = context.propsValue.topic_arn.trim();
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    await callSns({
      operation: 'delete topic',
      call: () => client.send(new sdk.DeleteTopicCommand({ TopicArn: topicArn })),
    });
    return { deleted: true, topic_arn: topicArn };
  },
});

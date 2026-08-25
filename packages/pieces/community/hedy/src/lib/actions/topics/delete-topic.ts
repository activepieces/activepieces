import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { createClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { assertIdPrefix } from '../../common/validation';

export const deleteTopic = createAction({
  auth: hedyAuth,
  name: 'delete-topic',
  displayName: 'Delete Topic',
  description: 'Delete a topic.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete a Hedy topic identified by a topic ID (must be prefixed with "topic_"). Idempotent in effect: once deleted, repeating the call leaves the topic absent (a repeat may error if the topic no longer exists).',
    idempotent: true,
  },
  props: {
    topicId: commonProps.topicId,
  },
  async run(context) {
    const topicId = assertIdPrefix(context.propsValue['topicId'] as string, 'topic_', 'Topic ID');
    const client = createClient(context.auth);

    const response = await client.request({
      method: HttpMethod.DELETE,
      path: `/topics/${topicId}`,
    });

    return response ?? { success: true, deleted: true };
  },
});

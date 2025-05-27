import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const newCommentPostedTrigger = createTrigger({
  name: 'new_comment_posted',
  auth: circleAuth,
  displayName: 'New Comment Posted',
  description: 'Triggered when a new comment is posted on a post. Useful for alerting authors or moderators.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '123456',
    post_id: '789012',
    body: 'This is a sample comment',
    created_at: '2025-01-01T12:00:00Z'
  },

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    const payload = {
      url: webhookUrl,
      event: 'new_comment_posted',
    };

    const response = await makeCircleRequest(
      context.auth as string,
      HttpMethod.POST,
      '/webhooks',
      payload
    );

    await context.store.put('webhookId', response.id);
    return response;
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');

    if (webhookId) {
      await makeCircleRequest(
        context.auth as string,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload as {
      body: {
        id: string;
        post_id: string;
        body: string;
        created_at: string;
      };
    };

    const { body } = payload;

    return [{
      commentId: body.id,
      postId: body.post_id,
      body: body.body,
      createdAt: body.created_at,
    }];
  },
});

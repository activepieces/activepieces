import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const newPostCreatedTrigger = createTrigger({
  name: 'new_post_created',
  auth: circleAuth,
  displayName: 'New Post Created',
  description: 'Triggered when a new post is created.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    space_id: Property.ShortText({
      displayName: 'Space ID (Optional)',
      description: 'Optionally filter by space ID if supported by your webhook provider',
      required: false,
    }),
  },
  sampleData: {
    id: '123456',
    name: 'Sample Post Title',
    body: 'This is a sample post body',
    created_at: '2025-01-01T12:00:00Z',
    space_id: '1',
    user_name: 'Test User',
    user_email: 'test@example.com',
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;
    const { space_id } = context.propsValue;

    const payload: Record<string, any> = {
      url: webhookUrl,
      event: 'new_post_created',
    };

    if (space_id) {
      payload['space_id'] = space_id;
    }

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
        name: string;
        body: string;
        created_at: string;
        space_id: string;
        user_name: string;
        user_email: string;
      };
    };
  
    const { body } = payload;
  
    return [{
      postId: body.id,
      title: body.name,
      content: body.body,
      createdAt: body.created_at,
      spaceId: body.space_id,
      authorName: body.user_name,
      authorEmail: body.user_email,
    }];
  }
});

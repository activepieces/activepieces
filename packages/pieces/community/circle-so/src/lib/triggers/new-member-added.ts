import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeCircleRequest } from '../common';
import { circleAuth } from '../../index';

export const newMemberAddedTrigger = createTrigger({
  name: 'new_member_added',
  auth: circleAuth,
  displayName: 'New Member Added',
  description: 'Triggered when a new member is added to the community. Useful for welcoming new members or starting onboarding workflows.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '123456',
    name: 'Test User',
    email: 'test.user@example.com',
    created_at: '2025-01-01T12:00:00Z'
  },
  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    const payload = {
      url: webhookUrl,
      event: 'new_member_added',
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
        name: string;
        email: string;
        created_at: string;
      };
    };

    const { body } = payload;

    return [{
      memberId: body.id,
      name: body.name,
      email: body.email,
      createdAt: body.created_at,
    }];
  },
});

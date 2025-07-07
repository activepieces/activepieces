import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';

const TRIGGER_KEY = 'klaviyo-new-profile-webhook-id';

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new-profile',
  displayName: 'New Profile Created',
  description: 'Triggers when a new profile is created in Klaviyo.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    const response = await klaviyoApiCall<{ data: { id: string } }>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/webhooks`,
      headers: {
        revision: '2025-04-15',
        'content-type': 'application/vnd.api+json',
        accept: 'application/vnd.api+json',
      },
      body: {
        data: {
          type: 'webhook',
          attributes: {
            url: context.webhookUrl,
            event_types: ['profile.created'],
          },
        },
      },
    });

    await context.store.put<string>(TRIGGER_KEY, response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    if (!isNil(webhookId)) {
      await klaviyoApiCall({
        apiKey: context.auth,
        method: HttpMethod.DELETE,
        resourceUri: `/webhooks/${webhookId}`,
        headers: {
          revision: '2025-04-15',
          accept: 'application/vnd.api+json',
        },
      });
    }
  },
  async test(context) {
    return [
      {
        id: 'sample_profile_id',
        email: 'jane@example.com',
        created: '2025-07-07T12:00:00Z',
      },
    ];
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: 'sample_profile_id',
    email: 'jane@example.com',
    created: '2025-07-07T12:00:00Z',
  },
});

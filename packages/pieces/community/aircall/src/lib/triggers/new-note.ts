import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const TRIGGER_KEY = 'trigger_new-note';

export const newNote = createTrigger({
  auth: aircallAuth,
  name: 'newNote',
  displayName: 'New Note',
  description: 'Triggers when a new note is added to a call.',
  props: {},
  sampleData:  {
      id: 12345,
      direction: 'inbound',
      status: 'answered',
      started_at: '2023-07-31T10:30:00Z',
      answered_at: '2023-07-31T10:30:05Z',
      ended_at: '2023-07-31T10:35:00Z',
      duration: 300,
      from: '+1234567890',
      to: '+0987654321',
      via: '+0987654321',
      comments: [
        {
          id: 789,
          content: 'Customer called about billing inquiry',
          posted_at: '2023-07-31T10:36:00Z',
          posted_by: {
            id: 456,
            name: 'John Smith',
            email: 'john.smith@company.com',
          },
        },
      ],
      contact: {
        id: 456,
        first_name: 'Jane',
        last_name: 'Doe',
        phone_numbers: [
          {
            id: 789,
            label: 'Mobile',
            value: '+1234567890',
          },
        ],
      },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhookUrl = context.webhookUrl;

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events: ['call.commented'],
      }
    );

    const { webhook } = response as { webhook: { webhook_id: string } };

    await context.store.put<string>(TRIGGER_KEY, webhook.webhook_id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (webhookId) {
      await makeRequest(
        context.auth,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event: string;
      data: Record<string, any>;
    };

    // Verify this is a call commented event
    if (payload.event === 'call.commented') {
      return [payload.data];
    }

    return [];
  },
});

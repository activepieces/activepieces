import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

const TRIGGER_KEY = 'trigger_call-ended';

export const callEnded = createTrigger({
  auth: aircallAuth,
  name: 'callEnded',
  displayName: 'Call Ended',
  description: 'Triggers when a call ends.',
  props: {},
  sampleData: {
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
    recording: {
      id: 456,
      url: 'https://api.aircall.io/v1/calls/12345/recording',
      filename: 'call_12345_recording.mp3',
    },
    comments: [
      {
        id: 789,
        content: 'Customer inquiry resolved',
        posted_at: '2023-07-31T10:36:00Z',
        posted_by: {
          id: 456,
          name: 'John Smith',
          email: 'john.smith@company.com',
        },
      },
    ],
    tags: [
      {
        id: 101,
        name: 'Customer Support',
        color: '#ff0000',
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
    user: {
      id: 123,
      name: 'Agent Smith',
      email: 'agent@company.com',
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
        events: ['call.ended'],
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

    if (payload.event === 'call.ended') {
      return [payload.data];
    }

    return [];
  },
  async test(context) {
    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      '/calls?order=desc&per_page=10'
    );

    const { calls } = response as { calls: { id: number }[] };

    return calls;
  },
});

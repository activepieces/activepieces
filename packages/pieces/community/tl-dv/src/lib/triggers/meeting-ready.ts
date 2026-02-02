import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { tldvAuth } from '../common/auth';

export const meetingReady = createTrigger({
  auth: tldvAuth,
  name: 'meeting_ready',
  displayName: 'Meeting Ready',
  description: 'Triggers when a meeting has finished processing and is ready',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, configure a webhook in tl;dv:

1. Go to your tl;dv dashboard
2. Navigate to Settings > Webhooks
3. Add a new webhook
4. Set the **URL** to:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Select the **MeetingReady** event type
6. Choose the scope (User, Team, or Organization level)
7. Save the webhook

The webhook will trigger whenever a meeting finishes processing.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'webhook-123',
    event: 'MeetingReady',
    data: {
      id: 'meeting-123',
      name: 'Team Standup Meeting',
      happenedAt: '2024-01-15T10:00:00Z',
      url: 'https://app.tldv.io/meetings/meeting-123',
      duration: 1800,
      organizer: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      invitees: [
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      ],
      template: '{}',
      extraProperties: {},
    },
    executedAt: '2024-01-15T10:30:00Z',
  },
  async onEnable(context) {
    // Webhook URL is automatically provided by Activepieces
    // User needs to manually configure the webhook in tl;dv dashboard
  },
  async onDisable(context) {
    // User should remove webhook from tl;dv dashboard
  },
  async run(context) {
    const payload = context.payload.body as {
      id: string;
      event: string;
      data: {
        id: string;
        name: string;
        happenedAt: string;
        url: string;
        duration: number;
        organizer: {
          name: string;
          email: string;
        };
        invitees: Array<{
          name: string;
          email: string;
        }>;
        template: string;
        extraProperties: Record<string, any>;
      };
      executedAt: string;
    };

    if (payload.event === 'MeetingReady') {
      return [payload];
    }

    return [];
  },
});


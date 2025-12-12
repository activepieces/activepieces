import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { tldvAuth } from '../common/auth';

export const transcriptReady = createTrigger({
  auth: tldvAuth,
  name: 'transcript_ready',
  displayName: 'Transcript Ready',
  description: 'Triggers when a meeting transcript has been generated',
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
5. Select the **TranscriptReady** event type
6. Choose the scope (User, Team, or Organization level)
7. Save the webhook

The webhook will trigger whenever a meeting transcript is generated.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'webhook-456',
    event: 'TranscriptReady',
    data: {
      id: 'transcript-123',
      meetingId: 'meeting-123',
      data: [
        {
          speaker: 'John Doe',
          text: 'Hello everyone, welcome to today\'s meeting.',
          startTime: 0,
          endTime: 3,
        },
        {
          speaker: 'Jane Smith',
          text: 'Thanks for having me.',
          startTime: 4,
          endTime: 6,
        },
      ],
    },
    executedAt: '2024-01-15T10:35:00Z',
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
        meetingId: string;
        data: Array<{
          speaker: string;
          text: string;
          startTime: number;
          endTime: number;
        }>;
      };
      executedAt: string;
    };

    if (payload.event === 'TranscriptReady') {
      return [payload];
    }

    return [];
  },
});


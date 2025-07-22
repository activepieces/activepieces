import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const webhookInstructions = `**Setup Instructions:**
1. Copy the webhook URL below.
2. In your Kallabot AI agent configuration, go to Actions/Webhooks settings  .
3. Enable webhooks and paste the webhook URL.
4. Your agent will now send call data to this webhook when a call ends.`;

const testInstructions = `
**Test URL:**

If you want to generate sample data without triggering the flow, append \`/test\` to your webhook URL.

`;

export const callEventsTrigger = createTrigger({
  name: 'catch_webhook',
  displayName: 'Call Events Webhook',
  description:
    'Receives webhook data when call events occur from Kallabot AI agents.',
  requireAuth: false,
  props: {
    webhookUrl: Property.MarkDown({
      value: `**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\``,
      variant: MarkdownVariant.BORDERLESS,
    }),
    instructions: Property.MarkDown({
      value: webhookInstructions,
      variant: MarkdownVariant.INFO,
    }),
    testInstructions: Property.MarkDown({
      value: testInstructions,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    call_sid: 'CA1234567890abcdef1234567890abcdef',
    agent_id: 'agent-123e4567-e89b-12d3-a456-426614174000',
    agent_name: 'Customer Service Bot',
    account_id: 'account-123e4567-e89b-12d3-a456-426614174000',
    from_number: '+1234567890',
    to_number: '+0987654321',
    duration: 120,
    cost: 0.25,
    status: 'completed',
    call_type: 'outbound',
    recording_url:
      'https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.wav',
    recording_sid: 'RE1234567890abcdef1234567890abcdef',
    transcription: {
      conversation: [
        {
          speaker: 'agent',
          message:
            'Hello! This is regarding your recent order cancellation. How can I help you today?',
          timestamp: '2024-01-15T10:30:05Z',
        },
        {
          speaker: 'customer',
          message:
            'Hi, yes I cancelled my order because I found a better price elsewhere.',
          timestamp: '2024-01-15T10:30:15Z',
        },
      ],
      sentiment: 'neutral',
      summary:
        'Customer cancelled order due to price. Interested in price matching discussion.',
    },
    created_at: '2024-01-15T10:30:00Z',
    webhook_url: 'https://your-webhook-url.com/endpoint',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // No specific setup needed for webhook triggers
  },
  async onDisable() {
    // No cleanup needed for webhook triggers
  },
  async run(context) {
    const payloadBody = context.payload.body as any;

    // Return the webhook payload data
    return [payloadBody];
  },
});

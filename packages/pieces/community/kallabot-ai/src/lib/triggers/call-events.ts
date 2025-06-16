import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined, MarkdownVariant } from '@activepieces/shared';

const webhookInstructions = `**Setup Instructions:**
1. Copy the webhook URL below
2. In your Kallabot AI agent configuration, go to Actions/Webhooks settings  
3. Enable webhooks and paste the webhook URL
4. Your agent will now send call data to this webhook when a call ends.`;

const testInstructions = `
**Test URL:**

If you want to generate sample data without triggering the flow, append \`/test\` to your webhook URL.

`;

export const callEventsTrigger = createTrigger({
  name: 'catch_webhook',
  displayName: 'Call Events Webhook',
  description: 'Receives webhook data when call events occur from Kallabot AI agents.',
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
    event_type: 'call_ended',
    call_sid: 'CA1234567890abcdef1234567890abcdef',
    agent_id: 'agent_123',
    account_id: 'account_456',
    from_number: '+1234567890',
    to_number: '+0987654321',
    call_duration: 120,
    call_status: 'completed',
    recording_url: 'https://s3.us-east-1.amazonaws.com/kallabot-recordings/Accounts/.../Recordings/RE123.wav',
    call_cost: 0.05,
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      campaign_id: 'campaign_789',
      custom_data: {}
    }
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
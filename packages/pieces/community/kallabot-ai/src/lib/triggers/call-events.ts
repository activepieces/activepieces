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
    "event_type": "call_completed",
    "call_sid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "status": "completed",
    "call_type": "inbound",
    "from_number": "+1234567890",
    "to_number": "+1987654321",
    "duration": 125.5,
    "cost": 1.25,
    "created_at": "2024-01-15T10:30:00Z",
    "agent": {
      "agent_id": "agent_123456789",
      "name": "Customer Service Agent"
    },
    "recording": {
      "url": "https://kallabot-s3-amazon.com/recordings/recording_123.wav",
      "sid": "RExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    },
    "transcription": {
      "conversation": [
        {
          "speaker": "agent",
          "text": "Hello, thank you for calling. How can I help you today?",
          "timestamp": "2024-01-15T10:30:05Z"
        },
        {
          "speaker": "customer",
          "text": "Hi, I need help with my account.",
          "timestamp": "2024-01-15T10:30:10Z"
        }
      ]
    },
    "transfer": {
      "transferred": false,
      "department": null,
      "number": null,
      "time": null
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

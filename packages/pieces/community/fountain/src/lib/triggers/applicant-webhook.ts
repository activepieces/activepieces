import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const setupMarkdown = `
## Setup Instructions

1. Go to your Fountain account Settings > Automations
2. Click "Create automation"
3. Select "Applicant" as the source
4. Choose your trigger conditions (e.g., when applicant status changes)
5. Select "Send a webhook..." as the action
6. Copy and paste the webhook URL below into the URL field
7. Set the Authentication key (this will be sent as Authorization header)
8. Make sure to select "Send applicant payload" in the webhook options

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

export const fountainApplicantWebhook = createTrigger({
  name: 'applicant_webhook',
  displayName: 'Applicant Webhook',
  description: 'Triggers when Fountain sends applicant webhook events',
  props: {
    setup: Property.MarkDown({
      value: setupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    verify_auth: Property.Checkbox({
      displayName: 'Verify Authentication',
      description: 'Verify the Authorization header matches the expected key',
      required: false,
      defaultValue: false,
    }),
    auth_key: Property.ShortText({
      displayName: 'Authentication Key',
      description: 'The authentication key set in Fountain webhook configuration',
      required: false,
    }),
  },
  sampleData: {
    applicant: {
      id: "12345",
      name: "John Doe",
      email: "john.doe@example.com",
      phone_number: "+1234567890",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-15T10:30:00Z",
      funnel: {
        id: "67890",
        title: "Software Engineer Position"
      },
      stage: {
        id: "abc123",
        title: "Interview Scheduled"
      }
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // No setup needed - webhook URL is provided for manual configuration in Fountain
  },
  async onDisable() {
    // No cleanup needed
  },
  async run(context) {
    const payload = context.payload.body;

    if (context.propsValue.verify_auth && context.propsValue.auth_key) {
      const authHeader = context.payload.headers['authorization'];
      if (!authHeader || authHeader !== context.propsValue.auth_key) {
        throw new Error('Authentication failed');
      }
    }

    return [payload];
  },
});

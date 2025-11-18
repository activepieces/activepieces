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
3. Select "Worker" as the source
4. Choose your trigger conditions (e.g., when worker status changes)
5. Select "Send a webhook..." as the action
6. Copy and paste the webhook URL below into the URL field
7. Set the Authentication key (this will be sent as Authorization header)
8. Make sure to select "Send worker payload" in the webhook options

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
`;

export const fountainWorkerWebhook = createTrigger({
  name: 'worker_webhook',
  displayName: 'Worker Webhook',
  description: 'Triggers when Fountain sends worker webhook events',
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
    worker: {
      _id: "6916f97536b4690e60234ecf",
      createdAt: "2025-11-14T09:42:13.646Z",
      firstname: "Test",
      lastname: "Profile",
      displayFullName: "Test Profile",
      personalEmail: {
        email: "whatever@example.com"
      },
      employmentStatus: {
        type: "created",
        subtype: "employee"
      },
      customAttributes: [
        {
          customAttributeUuid: "56606812-8f05-4ea3-8a17-642da842317c",
          key: "requirement_drivers_license_status",
          value: "OUT"
        }
      ],
      company: {
        uuid: "4651064c-ac9a-4063-9fe1-1c356843a93c",
        name: "Fountain"
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

import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const setupMarkdown = `
## Setup Instructions

1. Go to your Fountain Onboard system
2. Add a Universal Task with Webhook integration
3. Select the trigger type (task completion or flow end)
4. Copy and paste the webhook URL below into the webhook configuration
5. Publish the flow

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`

This trigger will fire when workers complete tasks or reach flow endpoints in Onboard.
`;

export const fountainUniversalTasksWebhook = createTrigger({
  name: 'universal_tasks_webhook',
  displayName: 'Universal Tasks Webhook',
  description: 'Triggers when workers complete tasks or reach flow endpoints in Fountain Onboard',
  props: {
    setup: Property.MarkDown({
      value: setupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    worker: {
      uuid: "b897bd4d-3bd3-4e98-aa94-69cba600c679",
      firstName: "Harry",
      lastName: "Potter",
      startDate: "2024-08-07",
      email: "harry.potter+fyd9xrr@example.com",
      customAttributes: {
        "Compliance Drivers License": {
          url: null,
          complianceCheckTemplateUuid: "85fb6026-be74-4fe2-9054-f806f577a852"
        },
        "In Compliance": false,
        "Onboard completed": false
      },
      workerPageUrl: "http://localhost:8200/employer/workers/b897bd4d-3bd3-4e98-aa94-69cba600c679"
    },
    tasks: [
      {
        title: "Welcome to the team!",
        uuid: "5bed4436-2ef0-4f0f-a49f-539cf7e4671a",
        status: "completed",
        type: "informationSharing",
        data: {
          inputData: [],
          w4Profile: null,
          i9Profile: null,
          hirePapiProfile: null
        }
      }
    ],
    flowTitle: "webhook"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // No setup needed - webhook URL is provided for manual configuration in Fountain
  },
  async onDisable() {
    // No cleanup needed
  },
  async run(context) {
    const payload = context.payload.body as any;

    if (!payload.worker || !payload.tasks || !payload.flowTitle) {
      return [];
    }

    return [payload];
  },
});

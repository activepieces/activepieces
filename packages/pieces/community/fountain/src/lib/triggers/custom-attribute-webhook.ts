import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const setupMarkdown = `
## Setup Instructions

1. Go to your Fountain account Settings > Worker Attributes
2. Find the custom attribute you want to monitor
3. Click "..." > Manage Webhooks
4. In the modal, click "Add Webhook"
5. Copy and paste the webhook URL below into the URL field
6. Save the webhook configuration

**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`

This trigger will fire whenever the specified custom attribute's value changes for any worker.
`;

export const fountainCustomAttributeWebhook = createTrigger({
  name: 'custom_attribute_webhook',
  displayName: 'Custom Attribute Webhook',
  description: 'Triggers when Fountain worker custom attribute values change',
  props: {
    setup: Property.MarkDown({
      value: setupMarkdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    webhookUuid: "36ea7dc3-2378-4769-a749-54387dea22c6",
    companyUuid: "b69527e2-cf03-45e4-b667-48db36133391",
    trigger: {
      type: "customAttribute",
      resourceIdentifier: "583ff255-459d-47b5-9f9f-b3a300c22c02"
    },
    action: "update",
    timestamp: "2024-07-28T13:06:11.443Z",
    workerUuid: "3b8d5848-c96a-4639-ac7d-132fe36a43f0",
    previousState: {
      customAttributeUuid: "583ff255-459d-47b5-9f9f-b3a300c22c02",
      customAttribute: {
        label: "test",
        dataType: "string",
        key: "test",
        readOnly: false,
        hidden: false,
        protected: false,
        uuid: "583ff255-459d-47b5-9f9f-b3a300c22c02"
      },
      value: "before"
    },
    newState: {
      customAttributeUuid: "583ff255-459d-47b5-9f9f-b3a300c22c02",
      customAttribute: {
        label: "test",
        dataType: "string",
        key: "test",
        readOnly: false,
        hidden: false,
        protected: false,
        uuid: "583ff255-459d-47b5-9f9f-b3a300c22c02"
      },
      value: "after"
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
    const payload = context.payload.body as any;

    if (!payload.trigger || payload.trigger.type !== 'customAttribute') {
      return [];
    }

    return [payload];
  },
});

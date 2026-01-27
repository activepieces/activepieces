import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { documergeAuth } from '../common/auth';

export const newMergedRoute = createTrigger({
  auth: documergeAuth,
  name: 'new_merged_route',
  displayName: 'New Merged Route',
  description: 'Triggers when a merged/populated route is created',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, configure a Webhook Delivery Method in DocuMerge:

1. Go to your DocuMerge dashboard
2. Navigate to your **Route** settings
3. Add a new **Webhook Delivery Method**
4. Set the **URL** to:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Configure the webhook options:
   - ✅ **Send temporary download url (file_url)** - Provides a 1-hour download link
   - ✅ **Send data using JSON** - Sends data as JSON
   - ✅ **Send merge data** - Includes field data in the payload
6. Click **Submit** to save

The webhook will trigger whenever a route merge is completed.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    file_url: 'https://app.documerge.ai/download/temp/xyz789...',
    fields: {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      company: 'Tech Corp',
    },
    route_name: 'Customer Onboarding',
    route_id: '67890',
    merged_at: '2024-01-15T14:45:00Z',
  },
  async onEnable(context) {
    // Webhook URL is automatically provided by Activepieces
    // User needs to manually configure the webhook URL in DocuMerge dashboard
  },
  async onDisable(context) {
    // User should remove webhook delivery method from DocuMerge dashboard
  },
  async run(context) {
    return [context.payload.body];
  },
});


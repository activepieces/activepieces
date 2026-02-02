import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { documergeAuth } from '../common/auth';

export const newMergedDocument = createTrigger({
  auth: documergeAuth,
  name: 'new_merged_document',
  displayName: 'New Merged Document',
  description: 'Triggers when a merged/populated document is created',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## Setup Instructions

To use this trigger, configure a Webhook Delivery Method in DocuMerge:

1. Go to your DocuMerge dashboard
2. Navigate to your Document or Route settings
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

The webhook will trigger whenever a document is merged.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    file_url: 'https://app.documerge.ai/download/temp/abc123...',
    fields: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Inc',
    },
    document_name: 'Contract_JohnDoe.pdf',
    document_id: '12345',
    merged_at: '2024-01-15T10:30:00Z',
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


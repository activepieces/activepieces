import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { documentproAuth } from '../common/auth';

export const newDocument = createTrigger({
  auth: documentproAuth,
  name: 'newDocument',
  displayName: 'New Document',
  description: 'Triggers when a new document is uploaded to DocumentPro',
  props: {
    webhook_info: Property.MarkDown({
      value: `
**In DocumentPro Dashboard:**
   - Navigate to your desired Workflow
   - Go to the "Workflow" tab
   - Find the "Webhook Notification" option in the export section
   - Set the Webhook Endpoint URL to:
            \`\`\`text
			{{webhookUrl}}
			\`\`\`
   - Click Save

 `,
    }),
  },
  sampleData: {
    event: 'file_request_status_change',
    timestamp: '2024-07-25T14:30:29.565249',
    data: {
      request_id: 'a7813466-6f9a-4c33-8128-427e7a4df755',
      request_status: 'completed',
      response_body: {
        file_name: 'sample_document.pdf',
        template_id: '8e9beda9-5cba-42eb-a70a-b3e5eec9120a',
        template_title: 'Sample Parser',
        num_pages: 5,
        result_json_data: {
          field1: 'value1',
          field2: 'value2',
        },
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Webhook URL is automatically provided by Activepieces
    // User needs to manually configure the webhook URL in DocumentPro dashboard
  },
  async onDisable(context) {
    // User should remove webhook from DocumentPro dashboard
  },
  async run(context) {
    return [context.payload.body];
  },
});

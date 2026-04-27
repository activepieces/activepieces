import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';

export const rowCreatedTrigger = createTrigger({
  name: 'baserow_row_created',
  auth: baserowAuth,
  displayName: 'Row Created',
  description: 'Triggers when a new row is created in a Baserow table.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. In Baserow, click the **···** menu beside your table and select **Webhooks**.
2. Click **Create webhook +**.
3. Set the HTTP method to **POST**.
4. Paste the following URL into the endpoint field:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Under events, select **Rows created**.
6. Click **Save**.
`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    id: 1,
    order: '1.00000000000000000000',
    Name: 'Example row',
  },
  async onEnable() {
    // Manual setup required — user registers the webhook URL in Baserow UI.
  },
  async onDisable() {
    // Manual cleanup — user deletes the webhook in Baserow UI.
  },
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    return body.items ?? [];
  },
});

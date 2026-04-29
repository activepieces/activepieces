import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';

export const rowsCreatedTrigger = createTrigger({
  name: 'baserow_rows_created',
  auth: baserowAuth,
  displayName: 'Rows Created (Batch)',
  description:
    'Triggers when new rows are created in a Baserow table. Returns all rows from the event as a single batch.',
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
    rows: [
      { id: 1, order: '1.00000000000000000000', Name: 'Row 1' },
      { id: 2, order: '2.00000000000000000000', Name: 'Row 2' },
    ],
    count: 2,
  },
  async onEnable() {
    // Manual setup required — user registers the webhook URL in Baserow UI.
  },
  async onDisable() {
    // Manual cleanup — user deletes the webhook in Baserow UI.
  },
  async run(context) {
    const body = context.payload.body as { items?: unknown[] };
    const rows = body.items ?? [];
    return [{ rows, count: rows.length }];
  },
});

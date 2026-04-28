import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';

export const rowsUpdatedTrigger = createTrigger({
  name: 'baserow_rows_updated',
  auth: baserowAuth,
  displayName: 'Rows Updated (Batch)',
  description:
    'Triggers when existing rows are updated in a Baserow table. Returns all rows from the event as a single batch.',
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
5. Under events, select **Rows updated**.
6. Click **Save**.
`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    rows: [
      {
        row: { id: 1, order: '1.00000000000000000000', Name: 'Updated Row 1' },
        previous: { id: 1, order: '1.00000000000000000000', Name: 'Original Row 1' },
      },
    ],
    count: 1,
  },
  async onEnable() {
    // Manual setup required — user registers the webhook URL in Baserow UI.
  },
  async onDisable() {
    // Manual cleanup — user deletes the webhook in Baserow UI.
  },
  async run(context) {
    const body = context.payload.body as {
      items?: Record<string, unknown>[];
      old_items?: Record<string, unknown>[];
    };
    const rows = (body.items ?? []).map((item, i) => ({
      row: item,
      previous: (body.old_items ?? [])[i] ?? null,
    }));
    return [{ rows, count: rows.length }];
  },
});

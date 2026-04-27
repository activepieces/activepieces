import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { baserowAuth } from '../auth';

export const rowsDeletedTrigger = createTrigger({
  name: 'baserow_rows_deleted',
  auth: baserowAuth,
  displayName: 'Rows Deleted (Batch)',
  description:
    'Triggers when rows are deleted from a Baserow table. Returns all deleted row IDs from the event as a single batch.',
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
5. Under events, select **Rows deleted**.
6. Click **Save**.
`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    rows: [{ id: 1 }, { id: 2 }],
    count: 2,
  },
  async onEnable() {
    // Manual setup required — user registers the webhook URL in Baserow UI.
  },
  async onDisable() {
    // Manual cleanup — user deletes the webhook in Baserow UI.
  },
  async run(context) {
    const body = context.payload.body as { row_ids?: number[] };
    const rows = (body.row_ids ?? []).map((id) => ({ id }));
    return [{ rows, count: rows.length }];
  },
});

import {
  createTrigger,
  MarkdownVariant,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

const message = `1. In [Poper](https://app.poper.ai/), open your popup and click **Edit Popup**.
2. Open the **Integrations** tab and choose **Webhooks**.
3. Name the webhook and paste this URL:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
4. Click **Connect**, then save the popup.
`;

export const newLead = createTrigger({
  name: 'newLead',
  classification: 'READ',
  displayName: 'New Lead',
  description: 'Triggers when a Poper popup captures a new lead.',
  aiMetadata: {
    description: 'Fires when a Poper popup captures a new lead, such as a visitor submitting their email or contact details through a popup form. The event represents a single newly collected lead and delivers the submitted form data from the popup.',
  },
  props: {
    markdown: Property.MarkDown({
      value: message,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    response: { email: 'jane@example.com' },
    popupID: '292',
    responseID: 2195,
    timestamp: 'Mon, 06 May 2024 06:34:44 GMT',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    return [context.payload.body];
  },
});

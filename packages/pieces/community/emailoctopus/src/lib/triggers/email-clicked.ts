import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { emailOctopusProps } from '../common/props';
import { emailEventTriggerOutputSchema } from '../output-schemas';
import { emailOctopusAuth } from '../auth';
import { MarkdownVariant } from '@activepieces/pieces-framework';

export const emailClickedTrigger = createTrigger({
  auth: emailOctopusAuth,
  name: 'emailClicked',
  classification: 'READ',
  displayName: 'Email Clicked',
  description: 'Triggers when a link inside a specific campaign email is clicked.',
  aiMetadata: {
    description: 'Fires when a recipient clicks a link inside an EmailOctopus campaign email (a contact.clicked webhook event), representing a click-through engagement. Can be scoped to a single campaign id, or left unfiltered to catch clicks across all campaigns.',
  },
  props: {
    campaign_id: emailOctopusProps.campaignId({ required: false }),
     liveMarkdown: Property.MarkDown({
          value: `
          **Live URL:**
    \`\`\`text
    {{webhookUrl}}
    \`\`\``,
          variant: MarkdownVariant.BORDERLESS,
        }),
    instructions: Property.MarkDown({
      value: `
      **Manual Setup Required**

      1. Go to your EmailOctopus Dashboard.
      2. Navigate to **API & Integrations** → **Webhooks**.
      3. Click **Add webhook**.
      4. Paste the Above URL into the **URL** field:
      5. Select the **Email clicked** event.
      6. (Optional) Choose the campaign you want to filter on in this trigger.
      7. Save the webhook.
      `,
    }),
  },
  sampleData: {
    id: '42636763-73f9-463e-af8b-3f720bb3d889',
    type: 'contact.clicked',
    list_id: 'fa482fa2-5ac4-11ed-9f7a-67da1c836cf8',
    contact_id: 'e3ab8c80-5f65-11ed-835e-030e4bb63150',
    occurred_at: '2022-11-18T15:20:23+00:00',
    contact_email_address: 'user@example.com',
    campaign_id: '12345678-1234-1234-1234-123456789abc',
  },
  outputSchema: emailEventTriggerOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const body = context.payload.body as
      | { type?: string; campaign_id?: string }
      | { type?: string; campaign_id?: string }[];
    const events = Array.isArray(body) ? body : [body];
    const campaignIdFilter = context.propsValue.campaign_id;
    return events.filter(
      (event) =>
        event?.type === 'contact.clicked' &&
        (!campaignIdFilter || event.campaign_id === campaignIdFilter)
    );
  },
});

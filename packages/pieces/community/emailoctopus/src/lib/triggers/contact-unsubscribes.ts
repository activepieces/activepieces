import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../auth';
import { emailOctopusProps } from '../common/props';
import { contactEventTriggerOutputSchema } from '../output-schemas';
import { MarkdownVariant } from '@activepieces/pieces-framework';

export const contactUnsubscribesTrigger = createTrigger({
  auth: emailOctopusAuth,
  name: 'contactUnsubscribes',
  classification: 'READ',
  displayName: 'Contact Unsubscribes',
  description: 'Triggers when a contact unsubscribes from a list.',
  aiMetadata: {
    description: 'Fires when a contact unsubscribes from an EmailOctopus list (a contact.unsubscribed webhook event), representing an opt-out. Can be scoped to a single list id, or left unfiltered to catch unsubscribes across all lists.',
  },
  props: {
    list_id: emailOctopusProps.listId({ required: true }),
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
      2. Navigate to **API & Integrations → Webhooks**.
      3. Click **Add webhook**.
      4. Paste the Above URL:
      5. Select the **Email unsubscribed** event.
      6. (Optional) Restrict to the specific list chosen above.
      7. Save the webhook.
      `,
    }),
  },
  sampleData: {
    id: '42636763-73f9-463e-af8b-3f720bb3d889',
    type: 'contact.unsubscribed',
    list_id: 'fa482fa2-5ac4-11ed-9f7a-67da1c836cf8',
    contact_id: 'e3ab8c80-5f65-11ed-835e-030e4bb63150',
    occurred_at: '2022-11-18T15:20:23+00:00',
    contact_fields: {
      LastName: 'Example',
      FirstName: 'Claire',
    },
    contact_status: 'unsubscribed',
    contact_email_address: 'claire@example.com',
    contact_tags: ['vip'],
  },
  outputSchema: contactEventTriggerOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const body = context.payload.body as
      | { type?: string; list_id?: string }
      | { type?: string; list_id?: string }[];
    const events = Array.isArray(body) ? body : [body];
    const listIdFilter = context.propsValue.list_id;
    return events.filter(
      (event) =>
        event?.type === 'contact.unsubscribed' &&
        (!listIdFilter || event.list_id === listIdFilter)
    );
  },
});

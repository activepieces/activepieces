import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { emailOctopusAuth } from '../common/auth';
import { emailOctopusProps } from '../common/props';
import { MarkdownVariant } from '@activepieces/shared';

interface EmailOctopusEvent {
  type: string;
  id: string;
  contact_email_address: string;
  contact_fields?: Record<string, string>;
  contact_tags?: string[];
  contact_status?: string;
  list_id?: string;
  occurred_at?: string;
}

export const contactUnsubscribes = createTrigger({
  auth: emailOctopusAuth,
  name: 'contactUnsubscribes',
  displayName: 'Contact Unsubscribes',
  description: 'Triggers when a contact unsubscribes from a list.',
  props: {
    list_id: emailOctopusProps.listId(true),
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
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const events = context.payload.body;
    const listIdFilter = context.propsValue.list_id;

    if (Array.isArray(events)) {
      return events.filter(
        (event: EmailOctopusEvent) =>
          event.type === 'contact.unsubscribed' &&
          (!listIdFilter || event.list_id === listIdFilter)
      );
    }

    if (
      (events as EmailOctopusEvent)?.type === 'contact.unsubscribed' &&
      (!listIdFilter || (events as EmailOctopusEvent).list_id === listIdFilter)
    ) {
      return [events];
    }

    return [];
  },
});

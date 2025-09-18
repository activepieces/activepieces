import { Property,createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';


interface EmailOctopusEvent {
  type: string;
  id: string;
  contact_email_address: string;
  contact_fields?: Record<string, string>;
  contact_tags?: string[];
  contact_status?: string;
}

export const newContact = createTrigger({
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added to a particular list.',
  props: {
    markdown: Property.MarkDown({
      value: `To use webhooks, please manually set up on EmailOctopus Dashboard -> API & Integrations -> Webhooks
      Put this url as the endpoint:
			\`\`\`
			{{webhookUrl}}
			\`\`\`
			`,
    }),
  },
  sampleData: {
    id: "42636763-73f9-463e-af8b-3f720bb3d889",
    type: "contact.created",
    list_id: "fa482fa2-5ac4-11ed-9f7a-67da1c836cf8",
    contact_id: "e3ab8c80-5f65-11ed-835e-030e4bb63150",
    occurred_at: "2022-11-18T15:20:23+00:00",
    contact_fields: {
      "LastName": "Example",
      "FirstName": "Claire"
    },
    contact_status: "SUBSCRIBED",
    contact_email_address: "claire@example.com",
    contact_tags: ["vip"]
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

    if (Array.isArray(events)) {
      return events.filter((event: EmailOctopusEvent) => event.type === 'contact.created');
    }

    if ((events as EmailOctopusEvent)?.type === 'contact.created') {
      return [events];
    }

    return [];
  }
});
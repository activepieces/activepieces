import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

interface EmailOctopusEvent {
  type: string;
  id: string;
  contact_email_address: string;
  campaign_id?: string;
}

export const emailClicked = createTrigger({
  name: 'emailClicked',
  displayName: 'Email Clicked',
  description: 'Fires when a link inside a specific campaign email is clicked.',
  props: {},
  sampleData: {
    id: "42636763-73f9-463e-af8b-3f720bb3d889",
    type: "contact.clicked",
    list_id: "fa482fa2-5ac4-11ed-9f7a-67da1c836cf8",
    contact_id: "e3ab8c80-5f65-11ed-835e-030e4bb63150",
    occurred_at: "2022-11-18T15:20:23+00:00",
    contact_email_address: "user@example.com",
    campaign_id: "12345678-1234-1234-1234-123456789abc"
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
      return events.filter((event: EmailOctopusEvent) => event.type === 'contact.clicked');
    }
    
    if ((events as EmailOctopusEvent)?.type === 'contact.clicked') {
      return [events];
    }
    
    return [];
  }
});
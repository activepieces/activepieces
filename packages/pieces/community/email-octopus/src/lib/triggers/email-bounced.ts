import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const emailBounced = createTrigger({
  name: 'emailBounced',
  displayName: 'Email Bounced',
  description: 'Fires when an email to a recipient bounces from a specific campaign.',
  props: {},
  sampleData: {
    id: "42636763-73f9-463e-af8b-3f720bb3d889",
    type: "contact.bounced",
    list_id: "fa482fa2-5ac4-11ed-9f7a-67da1c836cf8",
    contact_id: "e3ab8c80-5f65-11ed-835e-030e4bb63150",
    occurred_at: "2022-11-18T15:20:23+00:00",
    contact_email_address: "user@example.com",
    contact_status: "BOUNCED",
    campaign_id: "12345678-1234-1234-1234-123456789abc"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // No automatic webhook creation - user configures manually in Email Octopus dashboard
    // Webhook URL: context.webhookUrl
    return;
  },
  async onDisable() {
    // User removes webhook manually from Email Octopus dashboard
    return;
  },
  async run(context) {
    const events = context.payload.body;
    
    // Filter for bounce events only
    if (Array.isArray(events)) {
        return events.filter((event: EmailOctopusEvent) => event.type === 'contact.bounced');
    }
    
    if ((events as EmailOctopusEvent)?.type === 'contact.bounced') {
        return [events];
    }
    
    return [];
  }
});

interface EmailOctopusEvent{
    type: string;
    id: string;
    contact_email_address: string;
}
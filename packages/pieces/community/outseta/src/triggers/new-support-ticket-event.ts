import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newSupportTicketEventTrigger = createTrigger({
  name: 'new_support_ticket_event',
  auth: outsetaAuth,
  displayName: 'New Support Ticket Event',
  description:
    "Triggers on support ticket events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventSubType: Property.StaticDropdown({
      displayName: 'Event',
      description:
        'Select the ticket event to listen for. Must match the notification type you configure in Outseta.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Ticket Created', value: 'created' },
          { label: 'Ticket Updated', value: 'updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Subject: 'Example ticket',
    Body: 'Example body',
    CaseStatus: 1,
    Source: 1,
    FromPerson: null,
    Created: '2024-01-10T00:00:00Z',
    Updated: '2024-01-10T00:00:00Z',
  },
  async onEnable() {
    // Webhook must be configured manually in Outseta (Settings → Notifications)
  },
  async onDisable() {
    // Webhook must be removed manually in Outseta
  },
  async run(context) {
    return [context.payload.body as Record<string, unknown>];
  },
  async test(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const orderBy = context.propsValue.eventSubType === 'created' ? 'Created' : 'Updated';
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/support/cases?$top=5&$orderby=${orderBy} desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newPersonEventTrigger = createTrigger({
  name: 'new_person_event',
  auth: outsetaAuth,
  displayName: 'New Person Event',
  description:
    "Triggers on person lifecycle events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventSubType: Property.StaticDropdown({
      displayName: 'Event',
      description:
        'Select the person event to listen for. Must match the notification type you configure in Outseta.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Person Created', value: 'created' },
          { label: 'Person Updated', value: 'updated' },
          { label: 'Person Deleted', value: 'deleted' },
          { label: 'Person Login', value: 'login' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Email: 'jane.doe@example.com',
    FirstName: 'Jane',
    LastName: 'Doe',
    FullName: 'Jane Doe',
    MailingAddress: null,
    Account: null,
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
      `/api/v1/crm/people?$top=5&$orderby=${orderBy} desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newDealEventTrigger = createTrigger({
  name: 'new_deal_event',
  auth: outsetaAuth,
  displayName: 'New Deal Event',
  description:
    "Triggers on deal lifecycle events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventSubType: Property.StaticDropdown({
      displayName: 'Event',
      description:
        'Select the deal event to listen for. Must match the notification type you configure in Outseta.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Deal Created', value: 'created' },
          { label: 'Deal Updated', value: 'updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Name: 'Example Deal',
    Amount: 1000,
    DueDate: null,
    DealPipelineStage: null,
    Account: null,
    DealPeople: [],
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
      `/api/v1/crm/deals?$top=5&$orderby=${orderBy} desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

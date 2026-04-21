import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { shouldFireOnPayload } from '../common/trigger-filter';

export const newPersonEventTrigger = createTrigger({
  name: 'new_person_event',
  auth: outsetaAuth,
  displayName: 'New Person Event',
  description:
    "Triggers on person lifecycle events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        '**Setup:** Copy this trigger\'s webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select the event you chose below and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.\n\n**Filtering:** Outseta webhook payloads do not include event-type metadata, so this trigger can only filter Created vs non-Created events from the payload itself. To narrow further (e.g. only Updated, only Deleted), configure only the Outseta notifications you actually want for this URL.',
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more person events to listen for. Configure a matching notification in Outseta for each selected event, all pointing to this webhook URL.',
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
    const payload = context.payload.body as Record<string, unknown>;
    const selected = (context.propsValue.eventSubTypes ?? []) as string[];
    if (
      !shouldFireOnPayload({
        payload,
        selectedSubTypes: selected,
        createSubType: 'created',
        updateSubTypes: ['updated', 'deleted', 'login'],
      })
    ) {
      return [];
    }
    return [payload];
  },
  async test(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const selected = (context.propsValue.eventSubTypes ?? []) as string[];
    const orderBy = selected.includes('created') ? 'Created' : 'Updated';
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/crm/people?limit=5&orderBy=${orderBy}&orderDirection=desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

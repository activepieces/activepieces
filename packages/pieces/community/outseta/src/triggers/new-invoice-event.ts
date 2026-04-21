import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newInvoiceEventTrigger = createTrigger({
  name: 'new_invoice_event',
  auth: outsetaAuth,
  displayName: 'New Invoice Event',
  description:
    "Triggers on invoice lifecycle events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more invoice events to listen for. Configure a matching notification in Outseta for each selected event, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Invoice Created', value: 'created' },
          { label: 'Invoice Deleted', value: 'deleted' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    InvoiceDate: '2024-01-10T00:00:00Z',
    Number: 1001,
    BillingRenewalTerm: 1,
    Amount: 99.0,
    AmountOutstanding: 0,
    Subscription: null,
    InvoiceLineItems: [],
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

    const selected = (context.propsValue.eventSubTypes ?? []) as string[];
    const orderBy = selected.includes('created') ? 'Created' : 'Updated';
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/billing/invoices?$top=5&$orderby=${orderBy} desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

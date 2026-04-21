import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newSubscriptionEventTrigger = createTrigger({
  name: 'new_subscription_event',
  auth: outsetaAuth,
  displayName: 'New Subscription Event',
  description:
    "Triggers on subscription billing events. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        '**Setup:** Copy this trigger\'s webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select the event you chose below and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.',
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more subscription events to listen for. Configure a matching notification in Outseta for each selected event, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscription Started', value: 'started' },
          { label: 'Plan Updated', value: 'plan_updated' },
          { label: 'Cancellation Requested', value: 'cancellation_requested' },
          { label: 'Payment Collected', value: 'payment_collected' },
          { label: 'Payment Declined', value: 'payment_declined' },
          { label: 'Add-ons Changed', value: 'addons_changed' },
          { label: 'Renewal Extended', value: 'renewal_extended' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    BillingRenewalTerm: 1,
    Account: null,
    Plan: null,
    Quantity: null,
    StartDate: '2024-01-10T00:00:00Z',
    EndDate: null,
    RenewalDate: '2025-01-10T00:00:00Z',
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
    const orderBy = selected.includes('started') ? 'Created' : 'Updated';
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/billing/subscriptions?$top=5&$orderby=${orderBy} desc`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

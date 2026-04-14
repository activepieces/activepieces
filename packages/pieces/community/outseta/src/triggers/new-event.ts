import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newEventTrigger = createTrigger({
  name: 'new_event',
  auth: outsetaAuth,
  displayName: 'New Event',
  description:
    "Triggers when a specific event occurs in Outseta. Configure a matching notification in Outseta → Settings → Notifications pointing to this trigger's webhook URL.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description:
        'Select the event to listen for. You must configure a matching notification in Outseta for the same event type (the webhook URL you provide to Outseta will only receive events of the type you selected there).',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Account Created', value: 'account_created' },
          { label: 'Account Updated', value: 'account_updated' },
          { label: 'Account Stage Updated', value: 'account_stage_updated' },
          { label: 'Account Deleted', value: 'account_deleted' },
          { label: 'Account Billing Information Updated', value: 'account_billing_info_updated' },
          { label: 'Person Created', value: 'person_created' },
          { label: 'Person Updated', value: 'person_updated' },
          { label: 'Person Deleted', value: 'person_deleted' },
          { label: 'Person Login', value: 'person_login' },
          { label: 'Deal Created', value: 'deal_created' },
          { label: 'Deal Updated', value: 'deal_updated' },
          { label: 'Subscription Started', value: 'subscription_started' },
          { label: 'Subscription Plan Updated', value: 'subscription_plan_updated' },
          { label: 'Subscription Cancellation Requested', value: 'subscription_cancellation_requested' },
          { label: 'Subscription Payment Collected', value: 'subscription_payment_collected' },
          { label: 'Subscription Payment Declined', value: 'subscription_payment_declined' },
          { label: 'Subscription Add-ons Changed', value: 'subscription_addons_changed' },
          { label: 'Subscription Renewal Extended', value: 'subscription_renewal_extended' },
          { label: 'Invoice Created', value: 'invoice_created' },
          { label: 'Invoice Deleted', value: 'invoice_deleted' },
          { label: 'Support Ticket Created', value: 'support_ticket_created' },
          { label: 'Support Ticket Updated', value: 'support_ticket_updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123ExAmple',
    Name: 'Example Entity',
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

    const endpoint = getEndpointForEventType(
      context.propsValue.eventType as string
    );

    if (!endpoint) {
      const res = await client.get<Record<string, unknown>>(
        '/api/v1/activities?$top=5&$orderby=ActivityDateTime desc'
      );
      return extractItems(res);
    }

    const res = await client.get<Record<string, unknown>>(
      `${endpoint.path}?$top=5&$orderby=${endpoint.orderBy} desc`
    );
    return extractItems(res);
  },
});

function getEndpointForEventType(eventType: string): EventEndpoint | null {
  switch (eventType) {
    case 'account_created':
      return { path: '/api/v1/crm/accounts', orderBy: 'Created' };
    case 'account_updated':
    case 'account_stage_updated':
    case 'account_billing_info_updated':
      return { path: '/api/v1/crm/accounts', orderBy: 'Updated' };
    case 'person_created':
      return { path: '/api/v1/crm/people', orderBy: 'Created' };
    case 'person_updated':
    case 'person_login':
      return { path: '/api/v1/crm/people', orderBy: 'Updated' };
    case 'deal_created':
      return { path: '/api/v1/crm/deals', orderBy: 'Created' };
    case 'deal_updated':
      return { path: '/api/v1/crm/deals', orderBy: 'Updated' };
    case 'subscription_started':
    case 'subscription_plan_updated':
    case 'subscription_cancellation_requested':
    case 'subscription_payment_collected':
    case 'subscription_payment_declined':
    case 'subscription_addons_changed':
    case 'subscription_renewal_extended':
      return { path: '/api/v1/billing/subscriptions', orderBy: 'Updated' };
    case 'invoice_created':
      return { path: '/api/v1/billing/invoices', orderBy: 'Created' };
    case 'support_ticket_created':
      return { path: '/api/v1/support/cases', orderBy: 'Created' };
    case 'support_ticket_updated':
      return { path: '/api/v1/support/cases', orderBy: 'Updated' };
    default:
      return null;
  }
}

function extractItems(res: Record<string, unknown>): Record<string, unknown>[] {
  const raw = (res?.['items'] ?? res?.['Items']) as Record<string, unknown>[] | undefined;
  return raw ?? [];
}

type EventEndpoint = { path: string; orderBy: string };

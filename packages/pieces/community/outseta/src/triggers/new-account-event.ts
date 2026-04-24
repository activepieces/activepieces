import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newAccountEventTrigger = createTrigger({
  name: 'new_account_event',
  auth: outsetaAuth,
  displayName: 'New Account Event',
  description:
    "Triggers on any account-scoped event (account lifecycle, account stage, billing information, subscription, invoice). The webhook payload is always an Account object — event-specific details such as the invoice or amount for a payment event are in the Account's ActivityEventData field.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        "**Setup:** Copy this trigger's webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select each event you chose below, and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.\n\n**Payload shape:** every account-scoped event in Outseta sends an **Account** object as the webhook body, regardless of the specific event. Subscription, billing and invoice details for the triggering event are nested in `ActivityEventData`.\n\n**Filtering:** Outseta payloads do not include event-type metadata, so the flow fires on every webhook hitting this URL. The selection below drives the test() sample data and tells you which Outseta notifications to configure — it is not a runtime filter. Configure only the Outseta notifications you actually want for this URL.",
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more account-scoped events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Account Created', value: 'account_created' },
          { label: 'Account Updated', value: 'account_updated' },
          { label: 'Account Deleted', value: 'account_deleted' },
          { label: 'Account Stage Updated', value: 'account_stage_updated' },
          { label: 'Account Billing Information Updated', value: 'account_billing_information_updated' },
          { label: 'Account Add Person', value: 'account_add_person' },
          { label: 'Account Subscription Started', value: 'account_subscription_started' },
          { label: 'Account Subscription Plan Updated', value: 'account_subscription_plan_updated' },
          { label: 'Account Subscription Cancellation Requested', value: 'account_subscription_cancellation_requested' },
          { label: 'Account Subscription Payment Collected', value: 'account_subscription_payment_collected' },
          { label: 'Account Subscription Payment Declined', value: 'account_subscription_payment_declined' },
          { label: 'Account Subscription Add-ons Changed', value: 'account_subscription_addons_changed' },
          { label: 'Account Subscription Renewal Extended', value: 'account_subscription_renewal_extended' },
          { label: 'Account Billing Invoice Created', value: 'account_billing_invoice_created' },
          { label: 'Account Billing Invoice Deleted', value: 'account_billing_invoice_deleted' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Name: 'Example Corp',
    AccountStage: 2,
    AccountStageLabel: 'Subscribing',
    ClientIdentifier: null,
    InvoiceNotes: null,
    PersonAccount: [],
    Subscriptions: [],
    ActivityEventData: null,
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
    const onlyCreate = selected.length > 0 && selected.every((s) => s.endsWith('_created'));
    const orderProperty = onlyCreate ? 'Created' : 'Updated';
    const res = await client.get<{ items?: Record<string, unknown>[]; Items?: Record<string, unknown>[] }>(
      `/api/v1/crm/accounts?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

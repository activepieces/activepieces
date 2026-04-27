import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newAddOnEventTrigger = createTrigger({
  name: 'new_add_on_event',
  auth: outsetaAuth,
  displayName: 'New Add-On Event',
  description:
    "Triggers on Outseta Add-On catalog events (creation or update of a billing add-on in your Outseta configuration). The webhook payload is an Add-On object — event-specific details are in the Add-On's ActivityEventData field. Note: this fires when an admin edits the add-on catalog in Outseta, not when a customer's subscription add-ons change (use New Account Event → Account Subscription Add Ons Changed for that).",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        "**Setup:** Copy this trigger's webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select each event you chose below, and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.\n\n**Payload shape:** every Add-On event in Outseta sends an **Add-On** object as the webhook body. Event-specific details are nested in `ActivityEventData`.\n\n**Filtering:** Outseta payloads do not include event-type metadata, so the flow fires on every webhook hitting this URL. The selection below drives the test() sample data and tells you which Outseta notifications to configure — it is not a runtime filter. Configure only the Outseta notifications you actually want for this URL.",
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more Add-On catalog events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        // Mirrors the Outseta admin dropdown verbatim (Settings → Notifications →
        // Add Notification → Activity Type), so users can match each option here
        // 1:1 with the notifications they configure on the Outseta side.
        options: [
          { label: 'Add On Created', value: 'add_on_created' },
          { label: 'Add On Updated', value: 'add_on_updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Name: 'Extra Hours',
    Description: 'Additional usage-based hours for the Pro plan.',
    BillingAddOnType: 2,
    MonthlyRate: 0,
    AnnualRate: 0,
    QuarterlyRate: 0,
    OneTimeRate: 0,
    SetupFee: 0,
    IsTaxable: false,
    IsActive: true,
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
      `/api/v1/billing/addons?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

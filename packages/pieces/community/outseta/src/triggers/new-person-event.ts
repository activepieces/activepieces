import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newPersonEventTrigger = createTrigger({
  name: 'new_person_event',
  auth: outsetaAuth,
  displayName: 'New Person Event',
  description:
    "Triggers on any person-scoped event (lifecycle, login, email engagement, list subscription, segment, support ticket). The webhook payload is always a Person object — event-specific details such as the email message, list, segment or ticket are in the Person's ActivityEventData field.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        "**Setup:** Copy this trigger's webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select each event you chose below, and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.\n\n**Payload shape:** every person-scoped event in Outseta sends a **Person** object as the webhook body, regardless of the specific event. Email engagement, list, segment, login and support-ticket details for the triggering event are nested in `ActivityEventData`.\n\n**Filtering:** Outseta payloads do not include event-type metadata, so the flow fires on every webhook hitting this URL. The selection below drives the test() sample data and tells you which Outseta notifications to configure — it is not a runtime filter. Configure only the Outseta notifications you actually want for this URL.",
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more person-scoped events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        // Mirrors the Outseta admin dropdown verbatim (Settings → Notifications →
        // Add Notification → Activity Type), so users can match each option here
        // 1:1 with the notifications they configure on the Outseta side.
        options: [
          { label: 'Person Created', value: 'person_created' },
          { label: 'Person Updated', value: 'person_updated' },
          { label: 'Person Deleted', value: 'person_deleted' },
          { label: 'Person Login', value: 'person_login' },
          { label: 'Person List Subscribed', value: 'person_list_subscribed' },
          { label: 'Person List Confirmed', value: 'person_list_confirmed' },
          { label: 'Person List Unsubscribed', value: 'person_list_unsubscribed' },
          { label: 'Person Segment Added', value: 'person_segment_added' },
          { label: 'Person Segment Removed', value: 'person_segment_removed' },
          { label: 'Person Email Opened', value: 'person_email_opened' },
          { label: 'Person Email Clicked', value: 'person_email_clicked' },
          { label: 'Person Email Bounce', value: 'person_email_bounce' },
          { label: 'Person Email Spam', value: 'person_email_spam' },
          { label: 'Person Email Subscribed', value: 'person_email_subscribed' },
          { label: 'Person Email Unsubscribed', value: 'person_email_unsubscribed' },
          { label: 'Person Support Ticket Created', value: 'person_support_ticket_created' },
          { label: 'Person Support Ticket Updated', value: 'person_support_ticket_updated' },
          { label: 'Person Support Ticket Closed', value: 'person_support_ticket_closed' },
          { label: 'Person Lead Form Submitted', value: 'person_lead_form_submitted' },
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
      `/api/v1/crm/people?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

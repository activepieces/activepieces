import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newTaskEventTrigger = createTrigger({
  name: 'new_task_event',
  auth: outsetaAuth,
  displayName: 'New Task Event',
  description:
    "Triggers on Outseta Task lifecycle events (creation, update). The webhook payload is a Task object — event-specific details are in the Task's ActivityEventData field.",
  type: TriggerStrategy.WEBHOOK,
  props: {
    setup: Property.MarkDown({
      value:
        "**Setup:** Copy this trigger's webhook URL `{{webhookUrl}}`. In Outseta go to **Settings → Notifications → Add Notification**, select each event you chose below, and paste the URL as the callback. If you selected multiple events, create one notification per event — all pointing to this same URL.\n\n**Payload shape:** every Task event in Outseta sends a **Task** object as the webhook body. Event-specific details are nested in `ActivityEventData`.\n\n**Filtering:** Outseta payloads do not include event-type metadata, so the flow fires on every webhook hitting this URL. The selection below drives the test() sample data and tells you which Outseta notifications to configure — it is not a runtime filter. Configure only the Outseta notifications you actually want for this URL.",
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more Task events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        // Mirrors the Outseta admin dropdown verbatim (Settings → Notifications →
        // Add Notification → Activity Type), so users can match each option here
        // 1:1 with the notifications they configure on the Outseta side.
        options: [
          { label: 'Task Created', value: 'task_created' },
          { label: 'Task Updated', value: 'task_updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Title: 'Follow up with the customer',
    Description: 'Schedule a check-in call to review onboarding progress.',
    DueDate: '2024-01-17T00:00:00Z',
    IsCompleted: false,
    Account: null,
    Person: null,
    Deal: null,
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
      `/api/v1/crm/tasks?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

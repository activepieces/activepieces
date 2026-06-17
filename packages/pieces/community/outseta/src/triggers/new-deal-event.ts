import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newDealEventTrigger = createTrigger({
  name: 'new_deal_event',
  auth: outsetaAuth,
  displayName: 'New Deal Event',
  description: 'Triggers on deal-scoped events (lifecycle, contact/account association).',
  type: TriggerStrategy.WEBHOOK,
  aiMetadata: {
    description:
      'Fires on any deal-scoped Outseta event (lifecycle, contact/account association). Each webhook delivers one Deal object; the specific event\'s details are nested in its ActivityEventData.',
  },
  props: {
    setup: Property.MarkDown({
      value: `
- In Outseta, go to **Settings → Notifications → Add Notification**.
- Select the deal event and paste the webhook URL in the callback field:
  \`\`\`text
  {{webhookUrl}}
  \`\`\`
- Create one notification per event, all pointing to this same URL.
`,
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more deal-scoped events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        // Mirrors the Outseta admin dropdown verbatim (Settings → Notifications →
        // Add Notification → Activity Type), so users can match each option here
        // 1:1 with the notifications they configure on the Outseta side.
        options: [
          { label: 'Deal Created', value: 'deal_created' },
          { label: 'Deal Updated', value: 'deal_updated' },
          { label: 'Deal Add Person', value: 'deal_add_person' },
          { label: 'Deal Add Account', value: 'deal_add_account' },
          { label: 'Deal Deleted', value: 'deal_deleted' },
          { label: 'Deal Due Date', value: 'deal_due_date' },
          // Manual activity events. Per Outseta support, these fire with the
          // entity they are attached to as the webhook payload — when logged
          // against a Deal, the body is the Deal.
          { label: 'Custom', value: 'custom' },
          { label: 'Note', value: 'note' },
          { label: 'Email', value: 'email' },
          { label: 'Phone Call', value: 'phone_call' },
          { label: 'Meeting', value: 'meeting' },
          { label: 'Chat', value: 'chat' },
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
      `/api/v1/crm/deals?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

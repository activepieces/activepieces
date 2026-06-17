import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const newPlanEventTrigger = createTrigger({
  name: 'new_plan_event',
  auth: outsetaAuth,
  displayName: 'New Plan Event',
  description: 'Triggers when a billing plan is created or updated in the Outseta catalog.',
  type: TriggerStrategy.WEBHOOK,
  aiMetadata: {
    description:
      'Fires when a billing plan is created or updated in the Outseta catalog (admin configuration), not when a customer\'s subscription changes. Each webhook delivers one Plan object.',
  },
  props: {
    setup: Property.MarkDown({
      value: `
- In Outseta, go to **Settings → Notifications → Add Notification**.
- Select the plan event and paste the webhook URL in the callback field:
  \`\`\`text
  {{webhookUrl}}
  \`\`\`
- Create one notification per event, all pointing to this same URL.
`,
    }),
    eventSubTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Events',
      description:
        'Select one or more Plan catalog events to listen for. Configure a matching Outseta notification for each, all pointing to this webhook URL.',
      required: true,
      options: {
        disabled: false,
        // Mirrors the Outseta admin dropdown verbatim (Settings → Notifications →
        // Add Notification → Activity Type), so users can match each option here
        // 1:1 with the notifications they configure on the Outseta side.
        options: [
          { label: 'Plan Created', value: 'plan_created' },
          { label: 'Plan Updated', value: 'plan_updated' },
        ],
      },
    }),
  },
  sampleData: {
    Uid: 'abc123xyz',
    Name: 'Pro Annual',
    Description: 'Annual professional plan with all features included.',
    MonthlyRate: 0,
    AnnualRate: 348,
    QuarterlyRate: 0,
    OneTimeRate: 0,
    SetupFee: 0,
    IsTaxable: false,
    IsActive: true,
    IsPerUser: false,
    TrialPeriodDays: 14,
    ExpiresAfterMonths: 0,
    PlanFamily: null,
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
      `/api/v1/billing/plans?limit=5&orderBy=${orderProperty}%20DESC`
    );
    return res?.items ?? res?.Items ?? [];
  },
});

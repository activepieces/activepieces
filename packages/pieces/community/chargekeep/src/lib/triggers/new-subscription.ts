import { createTrigger, MarkdownVariant, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../auth';
import { chargekeepOutputSchemas } from '../common/output-schemas';
import { createChargekeepWebhookHooks, deliveryKeys } from './helpers';

const hooks = createChargekeepWebhookHooks({ eventName: 'Subscription.CreatedOrUpdated', storeKey: '_new_subscription_trigger', deliveryKey: deliveryKeys.bySubscriptionChange });

export const newSubscription = createTrigger({
  auth: chargekeepAuth,
  name: 'new_subscription',
  classification: 'READ',
  displayName: 'New or Updated Subscription',
  description: 'Fires when a subscription is created, changed or replaced.',
  aiMetadata: {
    description: 'Fires when a subscription is created or updated in the ChargeKeep/Sperse CRM, emitting one item per changed subscription (subscription id, product name, dates, amount, frequency, statusId, contact id/name/email). Replacing a subscription emits two items: the old one with statusId U and the new one with statusId A.',
  },
  props: {
    setup_info: Property.MarkDown({
      value: 'ChargeKeep sends new and changed subscriptions once you publish the flow. A replaced subscription arrives as two items. Your API key needs permission to subscribe to events.',
      variant: MarkdownVariant.INFO,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  outputSchema: chargekeepOutputSchemas.subscriptionTrigger,
  sampleData: {
    eventType: 'Subscription.CreatedOrUpdated',
    contactId: 3994,
    contactFullName: 'Frank Micheal',
    contactEmail: 'frank@example.com',
    contactXrefs: [],
    id: 536778,
    name: 'Subscription_Name',
    startDate: '2024-06-30T09:29:43.6271352Z',
    endDate: '2025-06-30T09:29:43.6271352Z',
    amount: 100,
    frequency: 'Annual',
    trialDayCount: null,
    gracePeriodDayCount: null,
    statusId: 'A',
    cancelationReason: null,
    eventTime: '2024-09-06T00:29:07',
  },
  async onEnable(context) {
    await hooks.onEnable({ auth: context.auth, webhookUrl: context.webhookUrl, store: context.store });
  },
  async onDisable(context) {
    await hooks.onDisable({ auth: context.auth, store: context.store });
  },
  async run(context) {
    return hooks.run(context);
  },
});

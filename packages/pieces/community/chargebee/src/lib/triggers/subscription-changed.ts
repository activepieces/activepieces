import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import {
  fetchRecentEvents,
  subscribeChargebeeWebhook,
  unsubscribeChargebeeWebhook,
} from '../common/webhook';

const EVENT_TYPE = 'subscription_changed';
const STORE_KEY = '_chargebee_subscription_changed_webhook_id';

export const subscriptionChanged = createTrigger({
  auth: chargebeeAuth,
  name: 'subscription_changed',
  displayName: 'Subscription Changed',
  description:
    'Triggers when a subscription is updated — plan change, quantity, or add-ons.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'ev_subscriptiwwy6f7',
    occurred_at: 1776067863,
    source: 'admin_console',
    object: 'event',
    api_version: 'v2',
    event_type: 'subscription_changed',
    webhook_status: 'not_applicable',
    content: {
      subscription: {
        activated_at: 1612890920,
        billing_period: 1,
        billing_period_unit: 'month',
        created_at: 1612890920,
        currency_code: 'USD',
        '...': '...',
      },
      customer: {
        allow_direct_debit: false,
        auto_collection: 'on',
        billing_address: {
          city: 'Walnut',
          country: 'US',
          first_name: 'John',
          last_name: 'Doe',
          line1: 'PO Box 9999',
          '...': '...',
        },
        card_status: 'no_card',
        created_at: 1517505731,
        '...': '...',
      },
      invoice: {
        adjustment_credit_notes: {},
        amount_adjusted: 0,
        amount_due: 0,
        amount_paid: 1000,
        amount_to_collect: 0,
        '...': '...',
      },
    },
  },
  async onEnable(context) {
    const webhookId = await subscribeChargebeeWebhook(
      context.auth.props.site,
      context.auth.props.api_key,
      context.webhookUrl,
      EVENT_TYPE
    );
    await context.store.put<string>(STORE_KEY, webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(STORE_KEY);
    if (webhookId) {
      await unsubscribeChargebeeWebhook(
        context.auth.props.site,
        context.auth.props.api_key,
        webhookId
      );
    }
  },
  async test(context) {
    return fetchRecentEvents(
      context.auth.props.site,
      context.auth.props.api_key,
      EVENT_TYPE
    );
  },
  async run(context) {
    return [context.payload.body];
  },
});

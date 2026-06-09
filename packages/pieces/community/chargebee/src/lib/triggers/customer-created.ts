import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import {
  fetchRecentEvents,
  subscribeChargebeeWebhook,
  unsubscribeChargebeeWebhook,
} from '../common/webhook';

const EVENT_TYPE = 'customer_created';
const STORE_KEY = '_chargebee_customer_created_webhook_id';

export const customerCreated = createTrigger({
  auth: chargebeeAuth,
  name: 'customer_created',
  displayName: 'Customer Created',
  description: 'Triggers when a new customer is created in Chargebee.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'ev_customercwwy6nq',
    occurred_at: 1776067864,
    source: 'admin_console',
    object: 'event',
    api_version: 'v2',
    event_type: 'customer_created',
    webhook_status: 'not_applicable',
    content: {
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

import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import {
  fetchRecentEvents,
  subscribeChargebeeWebhook,
  unsubscribeChargebeeWebhook,
} from '../common/webhook';

const EVENT_TYPE = 'invoice_generated';
const STORE_KEY = '_chargebee_invoice_generated_webhook_id';

export const invoiceGenerated = createTrigger({
  auth: chargebeeAuth,
  name: 'invoice_generated',
  displayName: 'Invoice Generated',
  description: 'Triggers when a new invoice is generated for a subscription.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'ev_invoicegewwy4m2',
    occurred_at: 1776067861,
    source: 'admin_console',
    object: 'event',
    api_version: 'v2',
    event_type: 'invoice_generated',
    webhook_status: 'not_applicable',
    content: {
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

import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { apId } from '@activepieces/shared';
import { brexAuth } from '../../';
import { BREX_BASE_URL } from '../common';

const WEBHOOK_ID_STORE_KEY = 'brex_webhook_subscription_id';

function createBrexWebhookTrigger({
  name,
  displayName,
  description,
  eventType,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: brexAuth,
    name,
    displayName,
    description,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData,
    async onEnable(context) {
      const response = await httpClient.sendRequest<{ id: string }>({
        method: HttpMethod.POST,
        url: `${BREX_BASE_URL}/v1/webhooks`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
        headers: { 'Idempotency-Key': apId() },
        body: {
          url: context.webhookUrl,
          event_types: [eventType],
        },
      });
      await context.store.put(WEBHOOK_ID_STORE_KEY, response.body.id);
    },
    async onDisable(context) {
      const webhookId = await context.store.get<string>(WEBHOOK_ID_STORE_KEY);
      if (webhookId) {
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${BREX_BASE_URL}/v1/webhooks/${webhookId}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
          },
        });
      }
    },
    async run(context) {
      return [context.payload.body];
    },
    async test() {
      return [sampleData];
    },
  });
}

export const expensePaymentUpdated = createBrexWebhookTrigger({
  name: 'expense_payment_updated',
  displayName: 'Expense Payment Updated',
  description: 'Triggers when the payment status of an expense changes.',
  eventType: 'EXPENSE_PAYMENT_UPDATED',
  sampleData: {
    event_type: 'EXPENSE_PAYMENT_UPDATED',
    expense_id: 'expense_id',
    company_id: 'company_id',
    payment_status: 'CLEARED',
    payment_type: 'CARD',
    payment_description: 'SQ *COFFEE SHOP',
    amount: { amount: 2450, currency: 'USD' },
  },
});

export const transferProcessed = createBrexWebhookTrigger({
  name: 'transfer_processed',
  displayName: 'Transfer Processed',
  description: 'Triggers when a payment / transfer is successfully processed.',
  eventType: 'TRANSFER_PROCESSED',
  sampleData: {
    event_type: 'TRANSFER_PROCESSED',
    transfer_id: 'transfer_id',
    company_id: 'company_id',
  },
});

export const transferFailed = createBrexWebhookTrigger({
  name: 'transfer_failed',
  displayName: 'Transfer Failed',
  description: 'Triggers when a payment / transfer fails.',
  eventType: 'TRANSFER_FAILED',
  sampleData: {
    event_type: 'TRANSFER_FAILED',
    transfer_id: 'transfer_id',
    company_id: 'company_id',
  },
});

export const userUpdated = createBrexWebhookTrigger({
  name: 'user_updated',
  displayName: 'User Updated',
  description: 'Triggers when a user is created or their details change.',
  eventType: 'USER_UPDATED',
  sampleData: {
    event_type: 'USER_UPDATED',
    user_id: 'user_id',
    company_id: 'company_id',
  },
});

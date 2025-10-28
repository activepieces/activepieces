import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { StripeWebhookInformation } from '../common/types';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

type StripeWebhookPayload = {
  data: {
    object: {
      [key: string]: unknown;
    };
  };
};

export const stripeInvoicePaymentFailed = createTrigger({
  auth: stripeAuth,
  name: 'invoice_payment_failed',
  displayName: 'Invoice Payment Failed',
  description: 'Fires when a payment against an invoice fails.',
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Only trigger for invoices belonging to this customer ID (e.g., `cus_...`).',
      required: false,
    }),
  },

  sampleData: {
    id: 'in_1MtHbELkdIwHu7ixl4OzzPMv',
    object: 'invoice',
    customer: 'cus_NeZwdNtLEOXuvB',
    status: 'open',
    amount_due: 1500,
    amount_paid: 0,
    amount_remaining: 1500,
    attempt_count: 1,
    attempted: true,
    billing_reason: 'subscription_cycle',
    collection_method: 'charge_automatically',
    created: 1680644467,
    currency: 'usd',
    customer_email: 'jennyrosen@example.com',
    customer_name: 'Jenny Rosen',
    hosted_invoice_url: 'https://invoice.stripe.com/i/acct_...',
    last_finalization_error: {
      code: 'card_declined',
      doc_url: 'https://stripe.com/docs/error-codes/card-declined',
      message: 'Your card was declined.',
      param: '',
      payment_intent: {
        id: 'pi_123',
        object: 'payment_intent',
      },
      type: 'card_error',
    },
    livemode: false,
    next_payment_attempt: 1681251667,
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'invoice.payment_failed',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>(
      '_invoice_payment_failed_trigger',
      {
        webhookId: webhook.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_invoice_payment_failed_trigger'
    );
    if (webhookInfo !== null && webhookInfo !== undefined) {
      await stripeCommon.unsubscribeWebhook(
        webhookInfo.webhookId,
        context.auth
      );
    }
  },
  async test(context) {
    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.GET,
      url: 'https://api.stripe.com/v1/checkout/invoices',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        status: 'failed',
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as StripeWebhookPayload;
    const invoiceObject = payloadBody.data.object;
    const { customer } = context.propsValue;

    if (customer && invoiceObject['customer'] !== customer) {
      return [];
    }

    return [invoiceObject];
  },
});

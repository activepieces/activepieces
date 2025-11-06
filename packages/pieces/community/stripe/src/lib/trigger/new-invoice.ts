import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { StripeWebhookInformation } from '../common/types';
import { stripeAuth } from '../..';
import { isEmpty } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

type StripeWebhookPayload = {
  data: {
    object: {
      [key: string]: unknown;
    };
  };
};

export const stripeNewInvoice = createTrigger({
  auth: stripeAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description:
    'Fires when an invoice is created. Supports filters like status, customer, subscription.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only trigger for invoices with this status.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Open', value: 'open' },
          { label: 'Paid', value: 'paid' },
          { label: 'Uncollectible', value: 'uncollectible' },
          { label: 'Void', value: 'void' },
        ],
      },
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Only trigger for invoices belonging to this customer ID (e.g., `cus_...`).',
      required: false,
    }),
    subscription: Property.ShortText({
      displayName: 'Subscription ID',
      description:
        'Only trigger for invoices belonging to this subscription ID (e.g., `sub_...`).',
      required: false,
    }),
  },
  sampleData: {
    id: 'in_1MtHbELkdIwHu7ixl4OzzPMv',
    object: 'invoice',
    customer: 'cus_NeZwdNtLEOXuvB',
    subscription: 'sub_12345ABC',
    status: 'paid',
    amount_due: 999,
    amount_paid: 999,
    amount_remaining: 0,
    billing_reason: 'subscription_cycle',
    collection_method: 'charge_automatically',
    created: 1680644467,
    currency: 'usd',
    customer_email: 'jennyrosen@example.com',
    customer_name: 'Jenny Rosen',
    hosted_invoice_url: 'https://invoice.stripe.com/i/acct_...',
    invoice_pdf: 'https://pay.stripe.com/invoice/acct_.../pdf',
    livemode: false,
    number: 'ABC-123-456',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'invoice.created',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>('_new_invoice_trigger', {
      webhookId: webhook.id,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_new_invoice_trigger'
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
      url: 'https://api.stripe.com/v1/invoices',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as StripeWebhookPayload;
    const invoiceObject = payloadBody.data.object;
    const { status, customer, subscription } = context.propsValue;

    if (status && invoiceObject['status'] !== status) {
      return [];
    }
    if (customer && invoiceObject['customer'] !== customer) {
      return [];
    }
    if (subscription && invoiceObject['subscription'] !== subscription) {
      return [];
    }

    return [invoiceObject];
  },
});

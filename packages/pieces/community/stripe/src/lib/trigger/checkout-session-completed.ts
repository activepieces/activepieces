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

export const stripeCheckoutSessionCompleted = createTrigger({
  auth: stripeAuth,
  name: 'checkout_session_completed',
  displayName: 'Checkout Session Completed',
  description:
    'Fires when a Stripe Checkout Session is successfully completed.',
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Only trigger for checkout sessions created by this customer ID (e.g., `cus_...`).',
      required: false,
    }),
  },
  sampleData: {
    id: 'cs_test_a11YYufWQzNY63zpQ6QSNRQhkUpVph4WRmzW0zWJO2znZKdVujZ0N0S22u',
    object: 'checkout.session',
    amount_subtotal: 2198,
    amount_total: 2198,
    created: 1679600215,
    currency: 'usd',
    customer: 'cus_NWSaVkvdacCUi4',
    customer_details: {
      email: 'jenny.rosen@example.com',
      name: 'Jenny Rosen',
      phone: null,
    },
    livemode: false,
    mode: 'payment',
    payment_intent: 'pi_12345ABC',
    payment_status: 'paid',
    status: 'complete',
    success_url: 'https://example.com/success',
    url: null,
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'checkout.session.completed',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>(
      '_checkout_session_completed_trigger',
      {
        webhookId: webhook.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_checkout_session_completed_trigger'
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
      url: 'https://api.stripe.com/v1/checkout/sessions',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        status: 'complete',
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },
  async run(context) {
    const payloadBody = context.payload.body as StripeWebhookPayload;
    const sessionObject = payloadBody.data.object;
    const { customer } = context.propsValue;

    if (customer && sessionObject['customer'] !== customer) {
      return [];
    }

    return [sessionObject];
  },
});

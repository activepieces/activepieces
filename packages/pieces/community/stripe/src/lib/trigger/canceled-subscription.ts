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

export const stripeCanceledSubscription = createTrigger({
  auth: stripeAuth,
  name: 'canceled_subscription',
  displayName: 'Canceled Subscription',
  description: 'Fires when a subscription is canceled.',
  props: {
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Only trigger for subscriptions belonging to this customer ID (e.g., `cus_...`).',
      required: false,
    }),
  },

  sampleData: {
    id: 'sub_1MlPf9LkdIwHu7ixB6VIYRyX',
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    billing_cycle_anchor: 1678768838,
    cancel_at_period_end: false,
    canceled_at: 1678768842,
    cancellation_details: {
      comment: 'User requested cancellation via support.',
      feedback: 'missing_features',
      reason: 'cancellation_requested',
    },
    collection_method: 'charge_automatically',
    created: 1678768838,
    currency: 'usd',
    customer: 'cus_NWSaVkvdacCUi4',
    ended_at: 1678768842,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_NWSaWTp80M123q',
          object: 'subscription_item',
          price: {
            id: 'price_1MlPf7LkdIwHu7ixgcbP7cwE',
            object: 'price',
            active: true,
            currency: 'usd',
            product: 'prod_NWSaMgipulx8IQ',
            type: 'recurring',
            unit_amount: 1099,
          },
          quantity: 1,
        },
      ],
    },
    latest_invoice: 'in_1MlPf9LkdIwHu7ixEo6hdgCw',
    livemode: false,
    metadata: {},
    start_date: 1678768838,
    status: 'canceled',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'customer.subscription.deleted',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>(
      '_canceled_subscription_trigger',
      {
        webhookId: webhook.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_canceled_subscription_trigger'
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
      url: 'https://api.stripe.com/v1/subscriptions',
      headers: {
        Authorization: 'Bearer ' + context.auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      queryParams: {
        status: 'canceled',
        limit: '5',
      },
    });

    if (isEmpty(response.body) || isEmpty(response.body.data)) return [];

    return response.body.data;
  },

  async run(context) {
    const payloadBody = context.payload.body as StripeWebhookPayload;
    const subscriptionObject = payloadBody.data.object;
    const { customer } = context.propsValue;

    if (customer && subscriptionObject['customer'] !== customer) {
      return [];
    }

    return [subscriptionObject];
  },
});

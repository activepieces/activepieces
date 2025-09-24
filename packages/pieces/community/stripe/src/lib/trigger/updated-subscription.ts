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

export const stripeUpdatedSubscription = createTrigger({
  auth: stripeAuth,
  name: 'updated_subscription',
  displayName: 'Updated Subscription',
  description: 'Fires when an existing subscription is changed.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'New Status',
      description:
        'Only trigger when the subscription is updated to this status.',
      required: false,
      options: {
        options: [
          { label: 'Incomplete', value: 'incomplete' },
          { label: 'Incomplete - Expired', value: 'incomplete_expired' },
          { label: 'Trialing', value: 'trialing' },
          { label: 'Active', value: 'active' },
          { label: 'Past Due', value: 'past_due' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'Unpaid', value: 'unpaid' },
          { label: 'Paused', value: 'paused' },
        ],
      },
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description:
        'Only trigger for subscriptions belonging to this customer ID (e.g., `cus_...`).',
      required: false,
    }),
  },
  sampleData: {
    id: 'sub_1MowQVLkdIwHu7ixeRlqHVzs',
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: false,
    },
    billing_cycle_anchor: 1679609767,
    cancel_at_period_end: false,
    canceled_at: null,
    collection_method: 'charge_automatically',
    created: 1679609767,
    currency: 'usd',
    customer: 'cus_Na6dX7aXxi11N4',
    items: {
      object: 'list',
      data: [
        {
          id: 'si_Na6dzxczY5fwHx',
          object: 'subscription_item',
          price: {
            id: 'price_1MowQULkdIwHu7ixraBm864M',
            object: 'price',
            product: 'prod_Na6dGcTsmU0I4R',
            unit_amount: 2000,
          },
          quantity: 1,
        },
      ],
    },
    latest_invoice: 'in_1MowQWLkdIwHu7ixuzkSPfKd',
    livemode: false,
    metadata: { plan: 'premium' },
    start_date: 1679609767,
    status: 'active',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'customer.subscription.updated',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>(
      '_updated_subscription_trigger',
      {
        webhookId: webhook.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_updated_subscription_trigger'
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
      url: 'https://api.stripe.com/v1/charges',
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
    const subscriptionObject = payloadBody.data.object;
    const { status, customer } = context.propsValue;

    if (status && subscriptionObject['status'] !== status) {
      return [];
    }
    if (customer && subscriptionObject['customer'] !== customer) {
      return [];
    }

    return [subscriptionObject];
  },
});

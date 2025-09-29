import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { StripeWebhookInformation } from '../common/types';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isEmpty } from '@activepieces/shared';

type StripeWebhookPayload = {
  data: {
    object: unknown;
  };
};

export const stripeNewPaymentLink = createTrigger({
  auth: stripeAuth,
  name: 'new_payment_link',
  displayName: 'New Payment Link',
  description: 'Fires when a new Payment Link is created.',
  props: {},
  sampleData: {
    id: 'plink_1MoC3ULkdIwHu7ixZjtGpVl2',
    object: 'payment_link',
    active: true,
    after_completion: {
      hosted_confirmation: {
        custom_message: null,
      },
      type: 'hosted_confirmation',
    },
    allow_promotion_codes: false,
    currency: 'usd',
    customer_creation: 'if_required',
    livemode: false,
    metadata: {},
    payment_method_collection: 'always',
    url: 'https://buy.stripe.com/test_cN25nr0iZ7bUa7meUY',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const webhook = await stripeCommon.subscribeWebhook(
      'payment_link.created',
      context.webhookUrl,
      context.auth
    );
    await context.store.put<StripeWebhookInformation>(
      '_new_payment_link_trigger',
      {
        webhookId: webhook.id,
      }
    );
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<StripeWebhookInformation>(
      '_new_payment_link_trigger'
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
      url: 'https://api.stripe.com/v1/checkout/payment_links',
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
    return [payloadBody.data.object];
  },
});

import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wooCommon } from '../common';
import { wooAuth } from '../..';

export const coupon = createTrigger({
  name: 'coupon',
  displayName: 'Coupon',
  description: 'Triggers when any coupon is created, updated or deleted.',
  type: TriggerStrategy.WEBHOOK,
  auth: wooAuth,
  props: {},
  //Create the webhooks in WooCommerce and save the webhook IDs in store for disable behavior
  async onEnable(context) {
    const webhookIds = await wooCommon.subscribeWebhook(
      context.webhookUrl,
      'Coupon',
      context.auth
    );

    await context.store?.put('_coupon_trigger', {
      webhookIds: webhookIds,
    });
  },
  //Delete the webhooks from WooCommerce
  async onDisable(context) {
    const response = (await context.store?.get('_coupon_trigger')) as {
      webhookIds: number[];
    };
    if (response !== null && response !== undefined) {
      response.webhookIds.forEach(async (webhookId: number) => {
        wooCommon.unsubscribeWebhook(webhookId, context.auth);
      });
    }
  },
  //Return coupon data
  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    id: 22,
    code: '5dollars',
    _links: {
      self: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/coupons/22',
        },
      ],
      collection: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/coupons',
        },
      ],
    },
    amount: '5.00',
    status: 'publish',
    used_by: [],
    meta_data: [],
    description: '',
    product_ids: [20],
    usage_count: 0,
    usage_limit: null,
    date_created: '2023-07-09T15:10:14',
    date_expires: '2023-07-31T00:00:00',
    date_modified: '2023-07-09T15:23:03',
    discount_type: 'fixed_cart',
    free_shipping: true,
    maximum_amount: '0.00',
    minimum_amount: '0.00',
    date_created_gmt: '2023-07-09T15:10:14',
    date_expires_gmt: '2023-07-31T00:00:00',
    date_modified_gmt: '2023-07-09T15:23:03',
    usage_limit_per_user: 1,
    individual_use: false,
    email_restrictions: [],
    exclude_sale_items: false,
    product_categories: [],
    excluded_product_ids: [],
    limit_usage_to_x_items: null,
    excluded_product_categories: [],
  },
});

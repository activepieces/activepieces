import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wooCommon } from '../common';
import { wooAuth } from '../..';

export const customer = createTrigger({
  name: 'customer',
  displayName: 'Customer',
  description: 'Triggers when any customer is created, updated or deleted.',
  type: TriggerStrategy.WEBHOOK,
  auth: wooAuth,
  props: {},
  //Create the webhooks in WooCommerce and save the webhook IDs in store for disable behavior
  async onEnable(context) {
    const webhookIds = await wooCommon.subscribeWebhook(
      context.webhookUrl,
      'Customer',
      context.auth
    );

    await context.store?.put('_customer_trigger', {
      webhookIds: webhookIds,
    });
  },
  //Delete the webhooks from WooCommerce
  async onDisable(context) {
    const response = (await context.store?.get('_customer_trigger')) as {
      webhookIds: number[];
    };
    if (response !== null && response !== undefined) {
      response.webhookIds.forEach(async (webhookId: number) => {
        wooCommon.unsubscribeWebhook(webhookId, context.auth);
      });
    }
  },
  //Return customer data
  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    id: 1,
    role: 'administrator',
    email: 'email@gmail.com',
    avatar_url: '',
    username: 'username',
    first_name: 'First',
    last_name: 'Last',
    date_created: '2023-07-05T14:13:10',
    date_modified: '2023-07-06T14:58:43',
    date_created_gmt: '2023-07-05T14:13:10',
    date_modified_gmt: '2023-07-06T14:58:43',
    is_paying_customer: false,
    _links: {
      self: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/customers/1',
        },
      ],
      collection: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/customers',
        },
      ],
    },
    billing: {
      city: 'City',
      email: 'email@gmail.com',
      phone: '123123123',
      state: 'State',
      company: '',
      country: 'CO',
      postcode: '11111',
      address_1: '# Street',
      address_2: '',
      last_name: 'Last',
      first_name: 'First',
    },
    shipping: {
      city: 'City',
      email: 'email@gmail.com',
      phone: '123123123',
      state: 'State',
      company: '',
      country: 'CO',
      postcode: '11111',
      address_1: '# Street',
      address_2: '',
      last_name: 'Last',
      first_name: 'First',
    },
  },
});

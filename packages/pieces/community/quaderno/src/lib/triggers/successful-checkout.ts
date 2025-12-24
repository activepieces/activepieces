
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const successfulCheckout = createTrigger({
  auth: quadernoAuth,
  name: 'successfulCheckout',
  displayName: 'Successful Checkout',
  description: 'Triggers when a checkout session has been successfully completed',
  props: {},
  sampleData: {
    event_type: 'checkout.succeeded',
    account_id: 99999,
    data: {
      object: {
        transaction_details: {
          session: 43,
          session_permalink:
            'https://demo.quadernoapp.com/checkout/session/8ccf3fdc42b85800188b094b3',
          gateway: 'stripe',
          type: 'charge',
          description: 'Unicorn',
          customer: 'cus_FXesSy8Oz',
          email: 'john@doe.com',
          transaction: 'pi_1F2ZYtEjVKlcq2as8H5V',
          product_id: 'prod_61ffa84a0b8',
          tax_name: 'VAT',
          tax_rate: 20.0,
          extra_tax_name: null,
          extra_tax_rate: null,
          iat: 15647784,
          amount_cents: 1500,
          amount: '15.00',
          currency: 'EUR',
        },
        contact: {
          id: 547540,
          kind: 'company',
          first_name: 'John',
          last_name: 'Doe',
          full_name: 'John Doe',
          contact_name: null,
          street_line_1: 'Fake Street 1',
          postal_code: 'SW15 5PU',
          city: null,
          region: null,
          country: 'GB',
          email: 'john@doe.com',
          web: null,
          language: 'EN',
          tax_id: null,
        },
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookUrl = context.webhookUrl;

    // Create webhook for checkout.succeeded event
    const response = await makeRequest(
      account_name,
      api_key,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events_types: ['checkout.succeeded'],
      }
    );

    // Store webhook ID for later deletion
    await context.store.put('webhookId', response.id.toString());
  },
  async onDisable(context) {
    const { account_name, api_key } = context.auth.props;
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      // Delete webhook
      await makeRequest(
        account_name,
        api_key,
        HttpMethod.DELETE,
        `/webhooks/${webhookId}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
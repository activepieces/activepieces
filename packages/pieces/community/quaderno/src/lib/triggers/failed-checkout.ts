
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const failedCheckout = createTrigger({
  auth: quadernoAuth,
  name: 'failedCheckout',
  displayName: 'Failed Checkout',
  description: 'Triggers when a checkout session payment fails',
  props: {},
  sampleData: {
    event_type: 'checkout.failed',
    account_id: 99999,
    data: {
      object: {
        message: {
          response_message: 'Insufficient funds',
          status_code: 422,
        },
        transaction_details: {
          gateway: 'stripe',
          type: 'charge',
          description: 'Unicorn',
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

    // Create webhook for checkout.failed event
    const response = await makeRequest(
      account_name,
      api_key,
      HttpMethod.POST,
      '/webhooks',
      {
        url: webhookUrl,
        events_types: ['checkout.failed'],
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
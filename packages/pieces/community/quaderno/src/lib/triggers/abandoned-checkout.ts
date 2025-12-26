import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { quadernoAuth } from '../common/auth';

export const abandonedCheckout = createTrigger({
  auth: quadernoAuth,
  name: 'abandonedCheckout',
  displayName: 'Abandoned Checkout',
  description: 'Triggers when a checkout session is abandoned by the customer',
  props: {
     instruction: Property.MarkDown({
          value: `## Quaderno Webhook Setup
          To use this trigger, you need to manually set up a webhook in your Quaderno account:
    
          1. Login to your Quaderno account.
          2. On the left sidebar, navigate to **Settings** > **Webhooks**.
          3. Click on **Create Webhook**.
          4. Enter the following URL in the webhooks field and select **Checkout Abandoned** as webhook trigger:
          \`\`\`text
          {{webhookUrl}}
          \`\`\`
          5. Click Save to register the webhook.
          `,
        }),
  },
  sampleData: {
    event_type: 'checkout.abandoned',
    account_id: 99999,
    data: {
      object: {
        transaction_details: {
          description: 'Unicorn',
          plan: 'awesome',
        },
        contact: {
          first_name: 'John',
          last_name: 'Doe',
          city: null,
          country: 'GB',
          email: 'john@doe.com',
        },
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // const { account_name, api_key } = context.auth.props;
    // const webhookUrl = context.webhookUrl;

    // // Create webhook for checkout.abandoned event
    // const response = await makeRequest(
    //   account_name,
    //   api_key,
    //   HttpMethod.POST,
    //   '/webhooks',
    //   {
    //     url: webhookUrl,
    //     events_types: ['checkout.abandoned'],
    //   }
    // );

    // // Store webhook ID 
    // await context.store.put('webhookId', response.id.toString());
  },
  async onDisable(context) {
    // const { account_name, api_key } = context.auth.props;
    // const webhookId = await context.store.get('webhookId');

    // if (webhookId) {
    //   // Delete webhook
    //   await makeRequest(
    //     account_name,
    //     api_key,
    //     HttpMethod.DELETE,
    //     `/webhooks/${webhookId}`
    //   );
    // }
  },
  async run(context) {
    return [context.payload.body];
  },
});

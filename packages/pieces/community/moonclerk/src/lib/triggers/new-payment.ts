import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { moonclerkAuth } from '../common/auth';
export const newPayment = createTrigger({
  auth: moonclerkAuth,
  name: 'newPayment',
  displayName: 'New Payment',
  description:
    'Triggers when a payment is created in any state (failed, succeeded, etc).',
  props: {
    markdown: Property.MarkDown({
      value: `## MoonClerk Webhook Setup
                To use this trigger, you need to manually set up a webhook in your MoonClerk account:
    
                1. Login to your MoonClerk account.
                2. Navigate to **Account** -> **Settings** -> **Webhooks**.
                3. **Create webhook Endpoint**. keep state as active.
                4. Specify the following URL in the **Webhook URL** field:
                \`\`\`text
                {{webhookUrl}}
                \`\`\`
                5. Select the **Payment Created** event.
                5. Click Save Agent.
                `,
    }),
  },
  sampleData: {
    event: 'payment_created',
    object: 'payment',
    data: {
      id: 1348394,
      date: '2022-04-08T18:57:26Z',
      status: 'successful',
      currency: 'USD',
      amount: 1000,
      fee: 59,
      amount_refunded: 0,
      amount_description: 'Option A',
      name: 'Jim Customer',
      email: 'customer@example.com',
      payment_method: {
        type: 'card',
        last4: '4242',
        brand: 'Visa',
      },
      charge_reference: 'ch_3ohpsF8ra5rqjj',
      // customer_id and customer_reference are available only if the payment was from a recurring checkout
      customer_id: 53453,
      customer_reference: 'cus_4SOZuEc4cxP5L7',
      invoice_reference: 'in_1La8pLqS2UnhPZ',
      custom_fields: {
        shirt_size: {
          id: 23452,
          type: 'string',
          response: 'XL',
        },
        shipping_address: {
          id: 23453,
          type: 'address',
          response: {
            line1: '123 Main St.',
            line2: 'Ste. 153',
            city: 'Greenville',
            state: 'SC',
            postal_code: '29651',
            country: 'United States',
          },
        },
      },
      form_id: 112,
      coupon: {
        code: '10off',
        duration: 'once',
        amount_off: 1000,
        currency: 'USD',
        percent_off: null,
        duration_in_months: null,
        max_redemptions: null,
        redeem_by: null,
      },
      custom_id: 'GHS430',
      // Checkout data is available only if the payment was from a one-time checkout
      checkout: {
        amount_due: 1000,
        coupon_amount: 0,
        coupon_code: null,
        date: '2022-04-08T18:57:26Z',
        fee: 0,
        subtotal: 1000,
        token: '',
        total: 1000,
        trial_period_days: null,
        upfront_amount: 0,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});

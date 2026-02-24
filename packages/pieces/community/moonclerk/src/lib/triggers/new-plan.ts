import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { moonclerkAuth } from '../common/auth';
export const newPlan = createTrigger({
  auth: moonclerkAuth,
  name: 'newPlan',
  displayName: 'New Plan',
  description: 'Triggers when a new plan is created in MoonClerk',
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
                        5. Select the **Plan Created** event.
                        5. Click Save Agent.
                        `,
    }),
  },
  sampleData: {
    event: 'plan_created',
    object: 'customer',
    data: {
      id: 523425,
      account_balance: 0,
      name: 'Jim Customer',
      email: 'customer@example.com',
      payment_method: {
        type: 'card',
        last4: '4242',
        exp_month: 12,
        exp_year: 2018,
        brand: 'Visa',
      },
      custom_id: 'GHS430',
      customer_reference: 'cus_4SOZuEc4cxP5L7',
      discount: {
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
        starts_at: '2022-04-12T20:05:37Z',
        ends_at: '2022-05-12T20:05:37Z',
      },
      delinquent: false,
      management_url: 'https://app.moonclerk.com/manage/xyz1234567',
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
      form_id: 101,
      checkout: {
        amount_due: 1700,
        coupon_amount: 1000,
        coupon_code: '10off',
        date: '2014-07-23T13:44:12Z',
        fee: 200,
        subtotal: 1000,
        token: '',
        total: 1700,
        trial_period_days: null,
        upfront_amount: 500,
      },
      subscription: {
        id: 98,
        subscription_reference: 'sub_3oLgqlp4MgTZC3',
        status: 'active',
        start: '2022-07-23T13:44:16Z',
        first_payment_attempt: '2022-07-23T13:44:16Z',
        next_payment_attempt: '2022-08-23T13:44:16Z',
        current_period_start: '2022-07-23T13:44:16Z',
        current_period_end: '2022-08-23T13:44:16Z',
        trial_start: null,
        trial_end: null,
        trial_period_days: null,
        expires_at: null,
        canceled_at: null,
        ended_at: null,
        plan: {
          id: 131,
          plan_reference: '131',
          amount: 1200,
          amount_description: 'Option A',
          currency: 'USD',
          interval: 'month',
          interval_count: 1,
        },
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

import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { moonclerkAuth } from '../common/auth';
export const paymentSucceeds = createTrigger({
  auth: moonclerkAuth,
  name: 'paymentSucceeds',
  displayName: 'Payment Succeeds',
  description: '',
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
                                5. Select the **Payment Succeeds** event.
                                5. Click Save Agent.
                                `,
    }),
  },
  sampleData: {},
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

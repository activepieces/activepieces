import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { moonclerkAuth } from '../common/auth';
export const planEnded = createTrigger({
  auth: moonclerkAuth,
  name: 'planEnded',
  displayName: 'Plan Ended',
  description:
    'Triggers when a plan is canceled or when the set number periods have been exhausted.',
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

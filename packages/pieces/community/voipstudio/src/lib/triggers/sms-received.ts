import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { voipstudioAuth } from '../common/auth';

export const smsReceived = createTrigger({
  auth: voipstudioAuth,
  name: 'smsReceived',
  displayName: 'SMS Received',
  description: 'Triggers when an SMS message is received in VoipStudio.',
  props: {
    instruction: Property.MarkDown({
      value: `
              1. Login to https://voipstudio.com/
              2. Click on **Integrations**
              3. Scroll down to **Webhooks** and Enable
              4. Select **Add Webhook** to create a new one
              5. Enter any name for the new Webhook to identify
              6. Select events to listen for. Select **SMS Received** event
              7. Enter the following URL in the webhook configuration
        \`\`\`text
                {{webhookUrl}}
                \`\`\`
    
                    `,
    }),
  },
  sampleData: {
    id: 'uk003.608920d55f7ac3.77053295',
    event_time: '2021-04-28 08:46:13',
    event_name: 'sms.received',
    customer_id: 100,
    user_id: 50,
    from_no: '447854740947',
    to_no: '441183211001',
    text: 'Hello, this is a test SMS message',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Register the webhook with VoIPStudio
  },

  async onDisable(context) {
    // Clean up the stored webhook URL
  },

  async run(context) {
    const payload = context.payload.body as any;

    // Return the webhook payload as a single item
    return [payload];
  },
});

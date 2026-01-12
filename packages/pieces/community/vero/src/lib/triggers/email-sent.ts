import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const emailSent = createTrigger({
  auth: veroAuth,
  name: 'emailSent',
  displayName: 'Email Sent',
  description: '',
  props: {
    instruction: Property.MarkDown({
      value: `## Vero Webhook Setup
                    To enable the webhooks, go to **Settings** > **Integrations** > **Webhooks** and enter the URL at which you wish to receive the webhooks.
                    
                    \`\`\`text
                    {{webhookUrl}}
                    \`\`\`
                    `,
    }),
  },
  sampleData: {
    sent_at: 1435016238,
    type: 'sent',
    user: {
      id: 123,
      email: 'steve@getvero.com',
    },
    campaign: {
      id: 987,
      type: 'transactional',
      name: 'Order confirmation',
      group: 'Order confirmation - Email 6',
      channel: 'email',
      subject: 'Your order is being processed!',
      'trigger-event': 'purchased item',
      permalink:
        'http://app.getvero.com/view/1/341d64944577ac1f70f560e37db54a25',
      sent_to: 'user@example.com',
      variation: 'Variation A',
      locale: 'en-US',
    },
    message_id: '20190730123456.1.1B72E094173067F0F@veromail.com',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.type === 'sent') {
      return [body];
    }
    return [];
  },
});

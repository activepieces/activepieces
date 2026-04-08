import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const unsubscribeUser = createTrigger({
  auth: veroAuth,
  name: 'unsubscribeUser',
  displayName: 'Unsubscribe User',
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
    unsubscribed_at: 1435016238,
    type: 'unsubscribed',
    user: {
      id: 123,
      email: 'steve@getvero.com',
    },
    campaign: {
      campaign_title: 'Order confirmation',
      series_title: 'Order Tracking',
      channel: 'email',
      message_id: '20190730123456.1.1B72E094173067F0F@veromail.com',
      email_subject: 'Your order is being processed!',
      variation_name: 'Control',
      template: 'Order Template',
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
    const body = context.payload.body as any;
    if (body.type === 'unsubscribed') {
      return [body];
    }
    return [];
  },
});

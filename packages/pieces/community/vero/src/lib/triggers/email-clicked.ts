import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const emailClicked = createTrigger({
  auth: veroAuth,
  name: 'emailClicked',
  displayName: 'Email Clicked',
  description: 'Triggered when an email is clicked',
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
    clicked_at: 1435016238,
    user_agent:
      'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
    type: 'clicked',
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
    if (body.type === 'clicked') {
      return [body];
    }
    return [];
  },
});

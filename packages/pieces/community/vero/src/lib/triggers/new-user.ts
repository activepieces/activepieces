import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const newUser = createTrigger({
  auth: veroAuth,
  name: 'newUser',
  displayName: 'New User',
  description: 'Triggered when a new user is created',
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
    type: 'user_created',
    user: {
      firstname: 'Steve',
      company: 'Vero',
      role: 'Bot',
      id: 123,
      email: 'steve@getvero.com',
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
    if (body.type === 'user_created') {
      return [body];
    }
    return [];
  },
});

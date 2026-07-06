import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const updateUser = createTrigger({
  auth: veroAuth,
  name: 'updateUser',
  displayName: 'Update User',
  description: '',
  aiMetadata: {
    description:
      'Fires when an existing user profile is updated in Vero, representing a change to a contact such as edited properties or added/removed tags.',
  },
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
    action: 'user_updated',
    type: 'user_updated',
    user: {
      id: 123,
      email: 'steve@getvero.com',
    },
    id: '123',
    email: 'steve@getvero.com',
    changes: {
      _tags: {
        add: ['active-customer'],
        remove: ['unactive-180-days'],
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
    const body = context.payload.body as any;
    if (body.type === 'user_updated') {
      return [body];
    }
    return [];
  },
});

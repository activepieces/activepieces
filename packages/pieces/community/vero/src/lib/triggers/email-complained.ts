import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
export const emailComplained = createTrigger({
  auth: veroAuth,
  name: 'emailComplained',
  displayName: 'Email Complained',
  description: 'Triggered when an email is marked as complained',
  aiMetadata: {
    description:
      'Fires when a recipient marks an email sent through Vero as spam or files a complaint, representing a spam/abuse report for a specific user and campaign.',
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
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.type === 'complained') {
      return [body];
    }
    return [];
  },
});

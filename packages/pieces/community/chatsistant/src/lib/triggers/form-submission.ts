import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { chatsistantAuth } from '../common/auth';

export const formSubmission = createTrigger({
  auth: chatsistantAuth,
  name: 'formSubmission',
  displayName: 'form submission',
  description: 'Triggered when a form is submitted',
  props: {
    markdown: Property.MarkDown({
      value: `## Chatsistant Webhook Setup
            To use this trigger, you need to manually set up a webhook in your Chatsistant account:

            1. Login to your Chatsistant account.
            2. Navigate to **Customizations** tab on the left navigation menu.
            3. Scroll down to **Webhook** and click to expand it.
            4. Select the **Form Submission** event and specify the following URL:
            \`\`\`text
            {{webhookUrl}}
            \`\`\`
            5. Click Save to register the webhook.
            `,
    }),
  },
  sampleData: {
    Email: 'test@gmail.com',
    name: 'Test User',
    session_uuid: 'cf014deb3b3b438d935f1ee7042ff66f',
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

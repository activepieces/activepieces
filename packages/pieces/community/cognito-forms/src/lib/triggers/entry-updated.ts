import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../../index';

export const entryUpdatedTrigger = createTrigger({
  name: 'entry_updated',
  displayName: 'Entry Updated',
  description: 'Triggers when an existing form entry is updated.',
  auth: cognitoFormsAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
          To use this trigger, you need to manually set up a webhook in your Cognito Forms account:
    
          1. Login to your Cognito Forms account.
          2. Select desired form and go to Form Settings.
          3. Enable **Post JSON Data to Website** and add following URL in **Update Entry Endpoint** field:
          \`\`\`text
          {{webhookUrl}}
          \`\`\`
          4. Click Save to save the form changes.
          `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: undefined,
  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },
  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
  },

  async run(context) {
    return [context.payload.body];
  },
});

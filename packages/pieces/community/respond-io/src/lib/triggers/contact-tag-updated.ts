import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import { respondIoAuth } from '../common/auth';

export const contactTagUpdatedTrigger = createTrigger({
  name: 'contact_tag_updated',
  displayName: 'Contact Tag Updated',
  description: 'Triggers when a tag is added or removed from a contact in Respond.io.',
  auth: respondIoAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
			To use this trigger, you need to manually set up a webhook in your Respond.io account:

			1. Login to your Respond.io account.
			2. Go to Settings > Integrations > Webhooks.
			3. Click on "Add Webhook" or "Create New Webhook".
			4. Add the following URL in the **Webhook URL** field:
			\`\`\`text
			{{webhookUrl}}
			\`\`\`
			5. Select **contact.tag.updated** from the event types.
			6. Click Save to create the webhook.
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

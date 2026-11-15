import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { sampleEntry, webhookInstructions } from '../common/trigger-helpers';

export const entryUpdatedTrigger = createTrigger({
  name: 'entry_updated',
  classification: 'READ',
  displayName: 'Entry Updated',
  description: 'Triggers when an existing form entry is updated.',
  aiMetadata: {
    description: 'Fires when an existing entry in a Cognito Forms form is updated, delivering the updated entry with its field values at the top level and status, dates and links under "Entry". Requires the form to post JSON to the webhook URL on update. Cognito Forms may resend an update if delivery fails.',
  },
  auth: cognitoFormsAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: webhookInstructions('Update Entry Endpoint'),
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: sampleEntry,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return [context.payload.body];
  },
});

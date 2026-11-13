import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { cognitoFormsAuth } from '../auth';
import { sampleEntry, webhookInstructions } from '../common/trigger-helpers';

export const newEntryTrigger = createTrigger({
  name: 'new_entry',
  classification: 'READ',
  displayName: 'New Entry',
  description: 'Triggers when a new form entry is submitted.',
  aiMetadata: {
    description: 'Fires when a new entry is submitted to a Cognito Forms form, delivering the entry with its field values at the top level and status, dates and links under "Entry". Requires the form to post JSON to the webhook URL on submit. Cognito Forms may resend an entry if delivery fails, so the same entry can arrive more than once.',
  },
  auth: cognitoFormsAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: webhookInstructions('Submit Entry Endpoint'),
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

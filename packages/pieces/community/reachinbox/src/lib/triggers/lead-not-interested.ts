import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { reachinboxCommon } from '../common';

export const leadNotInterested = createTrigger({
  name: 'leadNotInterested',
  classification: 'READ',
  displayName: 'Lead Not Interested',
  description: 'Triggers when a lead is marked as not interested.',
  aiMetadata: {
    description:
      'Fires when a lead is marked as not interested in ReachInbox (LEAD_NOT_INTERESTED), signaling a negative or opt-out response. Use to suppress or follow up differently; payload includes the lead and campaign. Requires the webhook to be configured in ReachInbox.',
  },
  props: {
    markdown: Property.MarkDown({
      value: reachinboxCommon.webhookInstructions('Lead Not Interested'),
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    email_id: 1,
    lead_id: 1,
    lead_email: 'recipient@example.com',
    email_account: 'sender@example.com',
    step_number: 1,
    message_id: '<test-message-id>',
    timestamp: '2024-03-18T08:15:51.000Z',
    campaign_id: 1,
    campaign_name: 'Test Name',
    event: 'LEAD_NOT_INTERESTED',
    user_webhook_id: '1',
    lead_first_name: 'Lead First Name',
    lead_last_name: 'Lead Last Name',
    email_sent_body: 'Sent Email body',
    email_replied_body: 'Sent Replied body',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Implement webhook subscription logic here
  },
  async onDisable(context) {
    // Implement webhook unsubscription logic here
  },
  async run(context) {
    return [context.payload.body];
  },
});

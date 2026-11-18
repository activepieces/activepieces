import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { reachinboxCommon } from '../common';

export const emailOpened = createTrigger({
  name: 'emailOpened',
  classification: 'READ',
  displayName: 'Email Opened',
  description: 'Triggers when a lead opens an email.',
  aiMetadata: {
    description:
      'Fires when a lead opens an outreach email (EMAIL_OPENED). Represents recipient engagement; payload includes the lead, sending account, step, and campaign. Requires the webhook to be configured in ReachInbox.',
  },
  props: {
    markdown: Property.MarkDown({
      value: reachinboxCommon.webhookInstructions('Email Opened'),
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
    event: 'EMAIL_OPENED',
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

import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { reachinboxCommon } from '../common';

export const emailSent = createTrigger({
  name: 'emailSent',
  classification: 'READ',
  displayName: 'Email Sent',
  description: 'Triggers when an email is sent.',
  aiMetadata: {
    description:
      'Fires when an outreach email is successfully sent to a lead (EMAIL_SENT). Represents a delivered sequence step; payload includes the lead, sending account, step, and campaign. Requires the webhook to be configured in ReachInbox.',
  },
  props: {
    markdown: Property.MarkDown({
      value: reachinboxCommon.webhookInstructions('Email Sent'),
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
    event: 'EMAIL_SENT',
    user_webhook_id: '1',
    lead_first_name: 'Lead First Name',
    lead_last_name: 'Lead Last Name',
    email_sent_body: 'Sent Email body',
    email_replied_body: 'Sent Replied body',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    // Here you would implement logic to enable the webhook with the external service
    // Possibly create a webhook subscription by sending the webhook URL (context.webhookUrl) to the external service
  },

  async onDisable(context) {
    // Here you would implement logic to disable or delete the webhook subscription from the external service
    // Likely sending a DELETE request to the service to remove the webhook
  },

  async run(context) {
    // This will handle the incoming webhook event and return the payload data
    return [context.payload.body];
  },
});

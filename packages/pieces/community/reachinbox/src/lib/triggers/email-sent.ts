import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const message = `

Follow the below steps:

1. Login to the ReachInbox dashboard.
2. Go to the "Profile" section and navigate to the "Settings" tab.
3. Click on the "Integrations" and go to the "Webhooks". Click on the "Add Webhook" button.
4. Copy the following webhook URL and paste it into the "Webhook URL" field.
      \`\`\`text
      {{webhookUrl}}
      \`\`\`

5. Select the event type as "Email Sent".
6. Click on the "Test Trigger" button to simulate a test and capture the webhook response here.
`;

export const emailSent = createTrigger({
  name: 'emailSent',
  displayName: 'Email Sent',
  description: 'Triggers when an email is successfully sent.',
  props: {
    markdown: Property.MarkDown({
      value: message,
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

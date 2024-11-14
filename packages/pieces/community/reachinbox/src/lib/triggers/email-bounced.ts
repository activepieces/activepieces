import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const emailBouncedMessage = `

  Follow the below steps:
  
  1. Login to the ReachInbox dashboard.
  2. Go to the "Profile" section and navigate to the "Settings" tab.
  3. Click on the "Integrations" and go to the "Webhooks". Click on the "Add Webhook" button.
  4. Copy the following webhook URL and paste it into the "Webhook URL" field.
      \`\`\`text
      {{webhookUrl}}
      \`\`\`

  5. Select the event type as "Email Bounced".
  6. Click on the "Test Trigger" button to simulate a test and capture the webhook response here.
  `;

export const emailBounced = createTrigger({
  name: 'emailBounced',
  displayName: 'Email Bounced',
  description: 'Triggers when an email is bounced.',
  props: {
    markdown: Property.MarkDown({
      value: emailBouncedMessage,
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
    event: 'EMAIL_BOUNCED',
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

import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
const markdown = `
To set up the trigger for new form responses, follow these steps:
1. Open your Fillout form in Edit mode
2. At the top, you’ll see four tabs, click on the Integrate tab
3. Inside the Integrate tab, select Webhook.  
4. Add a new webhook with this URL:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
4. Click Test to verify the webhook
5. Once verified, click Finish Setup
Your flow will now trigger whenever someone submits your form.
`;
export const newFormResponse = createTrigger({
  name: 'newFormResponse',
  displayName: 'New Form Response',
  description:
    'Fires when a new submission is received for a selected Fillout form.',
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description:
        'The ID of the Fillout form to watch for new responses. Find this in your Fillout form URL.',
      required: true,
    }),
    instructions: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    responseId: 'abc123',
    formId: 'xyz789',
    answers: [
      { question: 'Name', answer: 'John Doe' },
      { question: 'Email', answer: 'john@example.com' },
    ],
    submittedAt: '2024-06-01T12:00:00Z',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Show instructions to the user to set up the webhook in Fillout
  },
  async onDisable(context) {
    // No action needed, as Fillout webhooks are managed manually
  },
  async run(context) {
    return [context.payload.body];
  },
});

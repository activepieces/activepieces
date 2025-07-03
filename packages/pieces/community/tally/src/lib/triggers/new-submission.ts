import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `
To set up the trigger for new form submissions, follow these steps:

1. Go to the "Dashboard" section.
2. Select the form where you want the trigger to occur.
3. Click on the "Integrations" section.
4. Find the "Webhooks" integration and click on "Connect" to activate it.
5. In the webhook settings, paste the following URL: 
  \`\`\`text
  {{webhookUrl}}
  \`\`\`

  
6. Click on "Submit".
`;

export const tallyFormsNewSubmission = createTrigger({
  name: 'new-submission',
  displayName: 'New Submission',
  auth: PieceAuth.None(),
  description: 'Triggers when form receives a new submission',
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: undefined,
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    return [context.payload.body];
  },
});

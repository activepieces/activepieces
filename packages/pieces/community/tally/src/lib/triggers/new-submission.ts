import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `
- Go to the "Dashboard" section.
- Select the form where you want the trigger to occur.
- Click on "Integrations" section.
- Find "Webhooks" integration and click on "connect" to activate it.
- In the webhook settings, paste this URL: 
  \`{{webhookUrl}}\`
- Click on "Submit".
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

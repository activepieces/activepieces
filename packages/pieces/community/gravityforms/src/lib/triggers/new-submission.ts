import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `
- Go to the "Plugins" section.
- Find and click on the "Webhook" plugin to activate it.
- Now, locate the form where you want the trigger to occur.
- Add a webhook to that form.
- In the webhook settings, paste this URL: 
  \`\`\`text
  {{webhookUrl}}
  \`\`\`

- Keep the other settings unchanged (default).
`;

export const gravityFormsNewSubmission = createTrigger({
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
  sampleData: {},
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    return [context.payload];
  },
});

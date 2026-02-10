import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
generate sample data & triggers published flow.

`;

const markdown = `
To set up the trigger for new form submissions, follow these steps:

1. Go to the "Dashboard" section.
2. Select the form where you want the trigger to occur.
3. Click on the "Settings" section.
4. Find the "Webhook URL" field and paste above URL there.  
6. Click on "Save".
`;

export const newSubmissionTrigger = createTrigger({
  name: 'new-submission',
  displayName: 'New Submission',
  auth: PieceAuth.None(),
  description: 'Triggers when form receives a new submission.',
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
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

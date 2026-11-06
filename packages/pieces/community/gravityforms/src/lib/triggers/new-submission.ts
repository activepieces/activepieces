import {
  createTrigger,
  MarkdownVariant,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `Gravity Forms sends submissions here through its Webhooks Add-On (Elite license):

1. In WordPress, go to **Forms > Add-Ons**, then install and activate **Webhooks**.
2. Open your form, go to **Settings > Webhooks > Add New** and give it a **Name**.
3. Paste this URL into **Request URL**:
   \`\`\`text
   {{webhookUrl}}
   \`\`\`
4. Set **Request Method** to **POST**, **Request Format** to **JSON** and **Request Body** to **All Fields**, then save.
5. Back here, click **Test Trigger**, then submit the form once.
`;

export const newSubmissionTrigger = createTrigger({
  name: 'new-submission',
  classification: 'READ',
  displayName: 'New Submission',
  auth: PieceAuth.None(),
  requireAuth: false,
  description: 'Triggers when a form receives a new submission',
  aiMetadata: {
    description:
      'Fires when a Gravity Forms form on the connected WordPress site receives a new submission, delivered via the form\'s configured webhook. Each event represents one completed form entry and carries the submitted field values as its payload.',
  },
  props: {
    md: Property.MarkDown({
      value: markdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return [context.payload];
  },
});

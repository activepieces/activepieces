import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';

const message = `
1. Log in to your [Poper Account](https://app.poper.ai/).
2. Click on the popup for which you want to set up a trigger.
3. On the left-side menu, click on Integrations and search for **Webhook**.
4. Enter an appropriate webhook name and paste the following URL:
  \`\`\`text
  {{webhookUrl}}
  \`\`\`
`;

export const newLead = createTrigger({
  name: 'newLead',
  displayName: 'New Lead',
  description: 'Triggers when a new lead is obtained from popup.',
  props: {
    markdown: Property.MarkDown({
      value: message,
    }),
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    return [context.payload.body];
  },
});

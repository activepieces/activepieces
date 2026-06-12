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
  aiMetadata: {
    description: 'Fires when a Poper popup captures a new lead, such as a visitor submitting their email or contact details through a popup form. The event represents a single newly collected lead and delivers the submitted form data from the popup.',
  },
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

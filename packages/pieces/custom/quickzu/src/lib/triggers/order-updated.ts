import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../';

const markdown = `
- Go to the **Settings->API and Webhooks** section.
- In the webhook settings, paste this URL: 
  \`{{webhookUrl}}\`
- Click on **Save**.
`;

const sampleData = {
  payload: {
    id: '65cc96cfcf7028f638e20b0c',
    data: { status: 'paid' },
  },
  resource: 'order',
  operation: 'update',
};

export const orderUpdatedTrigger = createTrigger({
  auth: quickzuAuth,
  name: 'quickzu_order_updated_trigger',
  displayName: 'Order Updated',
  description: 'Triggers when a order status is changed in store.',
  type: TriggerStrategy.WEBHOOK,
  sampleData: sampleData,
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
  },
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [context.payload.body];
  },
});

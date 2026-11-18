import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { newMessageTriggerOutputSchema } from '../output-schemas';

const markdown = `
**Connect this trigger to your LINE bot**

1. **Publish this flow first.** LINE checks the URL when you click **Verify**.
2. Open the [LINE Developers Console](https://developers.line.biz/console/), pick your Messaging API channel and go to the **Messaging API** tab.
3. Under **Webhook settings**, click **Edit** and paste this URL:

   \`\`\`text
   {{webhookUrl}}
   \`\`\`

4. Click **Verify**, then turn on **Use webhook**.

A channel has one webhook URL, so only the flow whose URL you paste receives messages.
`;

export const newMessage = createTrigger({
  name: 'new-message',
  classification: 'READ',
  displayName: 'New Message',
  auth: PieceAuth.None(),
  description: 'Starts the flow when your LINE bot receives a message.',
  aiMetadata: {
    description: 'Fires when the LINE bot receives an inbound message event from a user via the Messaging API webhook. Each emitted item represents one active message event, carrying the sender details and message content needed to react or reply.',
  },
  outputSchema: newMessageTriggerOutputSchema,
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  requireAuth: false,
  sampleData: {},
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    const { events } = context.payload.body as { events: unknown[] };
    if (!events) {
      return [];
    }
    return events.filter(
      (event: any) => event.mode === 'active' && event.type === 'message'
    );
  },
});

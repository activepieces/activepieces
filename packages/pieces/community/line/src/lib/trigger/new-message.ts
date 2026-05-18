import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `
- Create Line bot account from Developer Console
- Go to the "Messaging API" section.
- In the webhook settings, paste this URL: 
  \`{{webhookUrl}}\`
- Publish Activepieces flow first then click "Verify" button
`;

export const newMessage = createTrigger({
  name: 'new-message',
  displayName: 'New Message',
  auth: PieceAuth.None(),
  description: 'Triggers when a new message is received',
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
    const { events } = context.payload.body as { events: unknown[] };
    if (!events) {
      return [];
    }
    return events.filter(
      (event: any) => event.mode === 'active' && event.type === 'message'
    );
  },
});

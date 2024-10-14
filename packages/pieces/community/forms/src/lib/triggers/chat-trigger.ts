import {
  Property,
  TriggerStrategy,
  createTrigger
} from '@activepieces/pieces-framework';

const markdown = `
This trigger sets up a chat interface. Ensure that **Respond on UI (Markdown)** is the final step in your flow.

**Your Chat URL:**
\`\`\`text
{{chatUrl}}
\`\`\`

`;

export const onChatSubmission = createTrigger({
  name: 'chat_submission',
  displayName: 'Chat UI',
  description: 'Trigger the flow by sending a message',
  props: {
    about: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    chatId: "MOCK_CHAT_ID",
    message: "Hello, how are you?",
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(ctx) {
    const item = ctx.payload.body as { chatId?: string, message?: string };
    if (!item.chatId) {
      throw new Error('Chat ID is required');
    }
    if (!item.message) {
      throw new Error('Message is required');
    }
    const response = {
      chatId: item.chatId,
      message: item.message,
    }
    return [response];
  },
});

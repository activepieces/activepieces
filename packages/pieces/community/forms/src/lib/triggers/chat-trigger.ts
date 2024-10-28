import {
  Property,
  TriggerStrategy,
  createTrigger
} from '@activepieces/pieces-framework';
import { USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';

const markdown = `
This trigger sets up a chat interface. Ensure that **Respond on UI (Markdown)** is the final step in your flow.

**Published Chat URL:**
\`\`\`text
{{chatUrl}}
\`\`\`
Use this for production, views the published version of the chat flow.
<br>
<br>
**Draft Chat URL:**
\`\`\`text
{{chatUrl}}?${USE_DRAFT_QUERY_PARAM_NAME}=true
\`\`\`
Use this to generate sample data, views the draft version of the chat flow (the one you are editing now).
`;

export const onChatSubmission = createTrigger({
  name: 'chat_submission',
  displayName: 'Chat UI',
  description: 'Trigger the flow by sending a message',
  props: {
    about: Property.MarkDown({
      value: markdown,
    }),
    botName: Property.ShortText({
      displayName: 'Bot Name',
      description: 'The name of the chatbot',
      required: true,
      defaultValue: 'AI Bot',
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

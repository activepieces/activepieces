import {
  Property,
  TriggerStrategy,
  createTrigger
} from '@activepieces/pieces-framework';
import { Chat } from '@activepieces/shared';
import { getChat, sampleData, saveChat } from './utils';

const markdown = `**Chat URL for this flow:**
\`\`\`text
{{chatUrl}}
\`\`\`
`;

export const onChatSubmission = createTrigger({
  name: 'chat_submission',
  displayName: 'Chat Input',
  description: 'Trigger the flow by sending a message',
  props: {
    about: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(ctx) {
    const body = ctx.payload.body as { chatId?: string, message?: string };
    const chatId = body.chatId;

    if (!chatId) {
      throw new Error('Chat ID is required');
    }

    const message = body.message;

    if (!message) {
      throw new Error('Message is required');
    }

    const response = [{ chatId, message }];

    const chat = await getChat(ctx.store, chatId);
    if (!chat) {
      const newChat = {
        id: chatId,
        messages: message ? [{
          role: 'user',
          content: message,
        }] : [],
      } satisfies Chat;
      await saveChat(ctx.store, newChat);
      return response;
    }
    if (message) {
      chat.messages.push({
        role: 'user',
        content: message,
      });
      await saveChat(ctx.store, chat);
    }
    return response;
  },
});

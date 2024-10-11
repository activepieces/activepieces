import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';
import { getChat, sampleData, saveChat } from './utils';

export const returnChatResponse = createAction({
  name: 'return_chat_response',
  displayName: 'Return Chat Response',
  description: 'Return a chat as a response.',
  props: {
    chatId: Property.ShortText({
      displayName: 'Chat ID',
      required: true,
      description: "Use the `chatId` field from the chat trigger output."
    }),
    markdown: Property.LongText({
      displayName: 'Markdown',
      required: true,
    }),
  },

  async run({ propsValue, run, store }) {

    const chatId = propsValue.chatId;

    // This is so when this action is tested, it has a chat to respond to.
    const sampleChat = await getChat(store, sampleData.chatId) ?? await saveChat(store, {
      id: sampleData.chatId,
      messages: [{
        role: "user",
        content: sampleData.message,
      }],
    });

    const chat = await getChat(store, chatId) ?? sampleChat;

    chat.messages.push({
      role: 'bot',
      content: propsValue.markdown,
    });

    await saveChat(store, chat);

    const response = {
      status: StatusCodes.OK,
      body: chat,
      headers: {},
    };

    run.stop({
      response: response,
    });

    return response;
  },
});

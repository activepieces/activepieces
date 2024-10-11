import { Property, createAction } from '@activepieces/pieces-framework';
import { StatusCodes } from 'http-status-codes';
import { getChat, saveChat } from './utils';

export const returnChatResponse = createAction({
  name: 'return_chat_response',
  displayName: 'Return Chat Response',
  description: 'Return a chat as a response.',
  props: {
    markdown: Property.LongText({
      displayName: 'Markdown',
      required: true,
    }),
    chatId: Property.ShortText({
      displayName: 'Chat ID',
      required: true,
    }),
  },

  async run({ propsValue, run, store }) {

    const chatId = propsValue.chatId;
    const chat = await getChat(store, chatId);

    if (!chat) {
      throw new Error(`Chat not found for id: ${chatId}`);
    }

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

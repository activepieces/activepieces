import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { ringcentralAuth } from '../common/auth';
import { ringcentralApiCall } from '../common/client';
import { chatDropdown } from '../common/props';

export const postChatMessage = createAction({
  auth: ringcentralAuth,
  name: 'post_chat_message',
  displayName: 'Post Message',
  description: 'Post a text message to a Team Messaging chat, team, or direct message',
  props: {
    chatId: chatDropdown,
    text: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, text } = context.propsValue;

    return ringcentralApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/team-messaging/v1/chats/${chatId}/posts`,
      body: { text },
    });
  },
});

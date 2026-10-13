import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';
import { chatDropdown } from '../common/props';

export const sendTeamMessage = createAction({
  auth: ringcentralAuth,
  name: 'send_team_message',
  displayName: 'Send Team Messaging Post',
  description: 'Post a message to a RingCentral Team Messaging chat, group, or team.',
  props: {
    chatId: chatDropdown,
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text content of the post. Supports Markdown.',
      required: true,
    }),
  },
  async run(context) {
    const { chatId, text } = context.propsValue;

    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      resourcePath: `/team-messaging/v1/chats/${encodeURIComponent(chatId)}/posts`,
      body: { text },
    });
  },
});

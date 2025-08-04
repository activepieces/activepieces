import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const sendMessageAction = createAction({
  auth: googleChatAuth,
  name: 'send_message',
  displayName: 'Send a Message',
  description: 'Send a message to a Google Chat space',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to send the message to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        return getSpacesOptions(auth as OAuth2PropertyValue);
      },
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The text content of the message',
      required: true,
    }),
    threadKey: Property.ShortText({
      displayName: 'Thread Key',
      description: 'Optional thread key to reply to a specific thread',
      required: false,
    }),
  },
  async run(context) {
    const { space, text, threadKey } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    const messageData: Record<string, unknown> = {
      text,
    };

    if (threadKey) {
      messageData['thread'] = {
        threadKey,
      };
    }

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/messages`,
      token,
      'POST',
      messageData
    );
  },
}); 
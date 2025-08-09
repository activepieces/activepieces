import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const getMessageAction = createAction({
  auth: googleChatAuth,
  name: 'get_message',
  displayName: 'Get Message',
  description: 'Retrieve details of a specific message',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space containing the message',
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
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { space, messageId } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/messages/${messageId}`,
      token
    );
  },
}); 
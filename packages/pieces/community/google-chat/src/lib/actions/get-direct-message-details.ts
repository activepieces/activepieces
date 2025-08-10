import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getSpacesOptions, makeGoogleChatRequest } from '../common/utils';

export const getDirectMessageDetailsAction = createAction({
  auth: googleChatAuth,
  name: 'get_direct_message_details',
  displayName: 'Get Direct Message Details',
  description: 'Retrieve details of a specific direct message by ID',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to retrieve',
      required: true,
    }),
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
  },
  async run(context) {
    const { messageId, space } = context.propsValue;
    const token = (context.auth as OAuth2PropertyValue).access_token;

    return makeGoogleChatRequest(
      `https://chat.googleapis.com/v1/${space}/messages/${messageId}`,
      token
    );
  },
}); 
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from '../common/constants';
import { googleChatAPIService } from '../common/requests';

export const getMessage = createAction({
  auth: googleChatApiAuth,
  name: 'getMessage',
  displayName: 'Get Message',
  description: 'Retrieve details of message.',
  props: {
    messageResourceName: Property.ShortText({
      displayName: 'Message Resource Name',
      description:
        'The full resource name of the message, e.g. spaces/AAAAMpdlehY/messages/ABCDE12345',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { messageResourceName } = propsValue;

    const message = await googleChatAPIService.getMessage(
      auth.access_token,
      messageResourceName
    );

    return message;
  },
});

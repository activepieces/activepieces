import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { googleChatAPIService } from '../common/requests';

export const getMessageDetails = createAction({
  auth: googleChatApiAuth,
  name: 'getMessageDetails',
  displayName: 'Get Message Details',
  description: 'Retrieve details of a specific message by ID. Supports both system-generated and custom message IDs.',
  props: {
    name: Property.ShortText({
      displayName: 'Message Resource Name',
      description: 'The full resource name of the message. Format: spaces/{space}/messages/{message}',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.getMessageSchema);

    const { name } = propsValue;

    const message = await googleChatAPIService.getMessage(
      auth.access_token,
      name
    );

    return message;
  },
});

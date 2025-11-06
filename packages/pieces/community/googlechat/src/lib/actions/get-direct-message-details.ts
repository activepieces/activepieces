import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { googleChatApiAuth, googleChatCommon } from '../common';
import { directMessagesDropdown, spacesDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const getDirectMessageDetails = createAction({
  auth: googleChatApiAuth,
  name: 'getDirectMessageDetails',
  displayName: 'Get Direct Message Details',
  description: 'Retrieve details of a specific direct message by ID.',
  props: {
    directMessageId: directMessagesDropdown({ refreshers: ['auth'], required: true }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, googleChatCommon.getDirectMessageDetailsSchema);

    const { directMessageId } = propsValue;

    const response = await googleChatAPIService.getSpace({
      accessToken: auth.access_token,
      spaceId: directMessageId as string,
    });

    return response;
  },
});

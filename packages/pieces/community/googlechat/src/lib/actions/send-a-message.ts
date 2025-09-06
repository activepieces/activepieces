import { createAction, Property } from '@activepieces/pieces-framework';
import { googleChatApiAuth } from '../common/constants';
import { allSpacesDropdown, spacesDropdown } from '../common/props';
import { googleChatAPIService } from '../common/requests';

export const sendAMessage = createAction({
  auth: googleChatApiAuth,
  name: 'sendAMessage',
  displayName: 'Send a Message',
  description: 'Send a message to a space or direct conversation.',
  props: {
    spaceId: allSpacesDropdown({ refreshers: ['auth'], required: true }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The content of the message to send',
      required: true,
    }),
    thread: Property.ShortText({
      displayName: 'Thread Name or Key',
      description:
        'Optional. The thread to reply to (e.g. `spaces/AAQAmubSVP8/threads/nf_gGAFrveY`). If not provided, the message will be top-level.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { spaceId, text, thread } = propsValue;

    const response = await googleChatAPIService.sendMessage({
      accessToken: auth.access_token,
      spaceId: spaceId as string,
      text,
      thread,
    });

    return response;
  },
});

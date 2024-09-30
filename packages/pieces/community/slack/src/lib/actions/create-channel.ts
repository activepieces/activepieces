import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';

export const createChannelAction = createAction({
  auth: slackAuth,
  name: 'slack-create-channel',
  displayName: 'Create Channel',
  description: 'Creates a new channel.',
  props: {
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      required: true,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Is Private?',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(auth.access_token);
    return await client.conversations.create({
      name: propsValue.channelName,
      is_private: propsValue.isPrivate,
    });
  },
});

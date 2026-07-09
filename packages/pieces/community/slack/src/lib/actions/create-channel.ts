import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const createChannelAction = createAction({
  auth: slackAuth,
  name: 'slack-create-channel',
  displayName: 'Create Channel',
  description: 'Creates a new channel.',
  audience: 'both',
  aiMetadata: { description: 'Create a new public or private channel with the given name. Not idempotent: calling again with a name that already exists fails with a name-taken error rather than reusing the existing channel. Channel names are normalized by Slack (lowercased, spaces to hyphens).', idempotent: false },
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
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.create({
      name: propsValue.channelName,
      is_private: propsValue.isPrivate,
    });
  },
});

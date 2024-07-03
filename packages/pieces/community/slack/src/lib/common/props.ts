import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  ConversationsListResponse,
  UsersListResponse,
  WebClient,
} from '@slack/web-api';

export const slackInfo = Property.MarkDown({
  value: `
	Please make sure add the bot to the channel by following these steps:
	  1. Type /invite in the channel's chat.
	  2. Click on Add apps to this channel.
	  3. Search for and add the bot.
    
  Channels dropdown will fetch upto 2000 channels.If you can't find the desired channel, you can obtain the Channel ID by right-clicking on the channel in Slack, selecting **View Channel Details**, and copying the Channel ID.
  Then, press **(X)** to enter the Channel ID in the dropdown and paste it.`,
});
export const slackChannel = <R extends boolean>(required: R) =>
  Property.Dropdown<string, R>({
    displayName: 'Channel',
    description: 'Channel, private group, or IM channel to send message to.',
    required,
    refreshers: [],
    async options({ auth }) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect slack account',
          options: [],
        };
      }
      const authentication = auth as OAuth2PropertyValue;
      const accessToken = authentication['access_token'];
      const client = new WebClient(accessToken);
      const channels: { label: string; value: string }[] = [];
      const CHANNELS_LIMIT = 2000;

      let cursor;
      do {
        const response = await client.conversations.list({
          types: 'public_channel,private_channel',
          exclude_archived: true,
          limit: 1000,
          cursor,
        });

        if (response.channels) {
          channels.push(
            ...response.channels.map((channel) => {
              return { label: channel.name || '', value: channel.id || '' };
            })
          );
        }

        cursor = response.response_metadata?.next_cursor;
      } while (cursor && channels.length < CHANNELS_LIMIT);

      return {
        disabled: false,
        placeholder: 'Select channel',
        options: channels,
      };
    },
  });

export const username = Property.ShortText({
  displayName: 'Username',
  description: 'The username of the bot',
  required: false,
});

export const profilePicture = Property.ShortText({
  displayName: 'Profile Picture',
  description: 'The profile picture of the bot',
  required: false,
});

export const blocks = Property.Json({
  displayName: 'Block Kit blocks',
  description: 'See https://api.slack.com/block-kit for specs',
  required: false,
});

export const userId = Property.Dropdown<string>({
  displayName: 'User',
  description: 'Message receiver',
  required: true,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'connect slack account',
        options: [],
      };
    }

    const accessToken = (auth as OAuth2PropertyValue).access_token;

    const client = new WebClient(accessToken);
    const users: { label: string; value: string }[] = [];
    for await (const page of client.paginate('users.list', {
      limit: 1000, // Only limits page size, not total number of results
    })) {
      const response = page as UsersListResponse;
      if (response.members) {
        users.push(
          ...response.members
            .filter((member) => !member.deleted)
            .map((member) => {
              return { label: member.name || '', value: member.id || '' };
            })
        );
      }
    }
    return {
      disabled: false,
      placeholder: 'Select channel',
      options: users,
    };
  },
});

export const text = Property.LongText({
  displayName: 'Message',
  description: 'The text of your message',
  required: true,
});

export const actions = Property.Array({
  displayName: 'Action Buttons',
  required: true,
});

import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';

const slackChannelBotInstruction = `
	Please make sure add the bot to the channel by following these steps:
	  1. Type /invite in the channel's chat.
	  2. Click on Add apps to this channel.
	  3. Search for and add the bot.
  `;

export const multiSelectChannelInfo = Property.MarkDown({
  value:
    slackChannelBotInstruction +
    `\n**Note**: If you can't find the channel in the dropdown list (which fetches up to 2000 channels), please click on the **(F)** and type the channel ID directly in an array like this: \`{\`{ ['your_channel_id_1', 'your_channel_id_2', ...] \`}\`}`,
});

export const singleSelectChannelInfo = Property.MarkDown({
  value:
    slackChannelBotInstruction +
    `\n**Note**: If you can't find the channel in the dropdown list (which fetches up to 2000 channels), please click on the **(F)** and type the channel ID directly.
  `,
});

export const slackChannel = <R extends boolean>(required: R) =>
  Property.Dropdown<string, R>({
    displayName: 'Channel',
    description:
      "You can get the Channel ID by right-clicking on the channel and selecting 'View Channel Details.'",
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

      const channels = await getChannels(accessToken);

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

export const threadTs = Property.ShortText({
  displayName: 'Thread ts',
  description:
    'Provide the ts (timestamp) value of the **parent** message to make this message a reply. Do not use the ts value of the reply itself; use its parent instead. For example `1710304378.475129`.Alternatively, you can easily obtain the message link by clicking on the three dots next to the parent message and selecting the `Copy link` option.',
  required: false,
});

export const blocks = Property.Json({
  displayName: 'Block Kit blocks',
  description: 'See https://api.slack.com/block-kit for specs',
  required: false,
});

export const userId = Property.Dropdown<string>({
  displayName: 'User',
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
      placeholder: 'Select User',
      options: users,
    };
  },
});

export const text = Property.LongText({
  displayName: 'Message',
  required: true,
});

export const actions = Property.Array({
  displayName: 'Action Buttons',
  required: true,
  properties: {
    label: Property.ShortText({
      displayName: 'Label',
      required: true,
    }),
    style: Property.StaticDropdown({
      displayName: 'Style',
      required: false,
      defaultValue: null,
      options: {
        options: [
          { label: 'Default', value: null },
          { label: 'Primary', value: 'primary' },
          { label: 'Danger', value: 'danger' },
        ],
      },
    }),
  },
});

export async function getChannels(accessToken: string) {
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

  return channels;
}

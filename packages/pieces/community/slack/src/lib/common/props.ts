import { MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';
import { slackAuth } from '../auth';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
export const multiSelectChannelInfo = Property.MarkDown({
  value:
    "Can't find the channel? Invite the bot: type **/invite** in the channel, choose **Add apps** and pick the bot. Or click **ƒ** and paste IDs as `{`{ ['C012AB3CD', 'C045EF6GH'] `}`}.",
  variant: MarkdownVariant.INFO,
});

export const singleSelectChannelInfo = Property.MarkDown({
  value:
    "Can't find the channel? Invite the bot: type **/invite** in the channel, choose **Add apps** and pick the bot. Or click **ƒ** and paste the channel ID.",
  variant: MarkdownVariant.INFO,
});

export const appWebhookSetupInfo = Property.MarkDown({
  value:
    "This trigger needs Slack's App Webhook manually configured on self-hosted instances before it will receive events, see the [setup guide](https://www.activepieces.com/docs/install/configure-operate/setup-app-webhooks#slack).",
  variant: MarkdownVariant.INFO,
});

export const interactivitySetupInfo = Property.MarkDown({
  value:
    "This trigger needs Slack's Interactivity & Shortcuts Request URL manually configured on self-hosted instances before it will receive events, see the [setup guide](https://www.activepieces.com/docs/install/configure-operate/setup-app-webhooks#slack).",
  variant: MarkdownVariant.INFO,
});

export const slackChannel = <R extends boolean>(required: R) =>
  Property.Dropdown<string, R,typeof slackAuth>({
    auth: slackAuth,
    displayName: 'Channel',
    description: 'Private channels appear only after the bot is added to them.',
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
      const accessToken = getBotToken(auth as SlackAuthValue);

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
  description: "Overrides the bot's display name for this message.",
  required: false,
  advanced: true,
});

export const profilePicture = Property.ShortText({
  displayName: 'Profile Picture',
  description: "Image URL used as the sender's avatar.",
  placeholder: 'https://example.com/avatar.png',
  required: false,
  advanced: true,
});

export const iconEmoji = Property.ShortText({
  displayName: 'Icon Emoji',
  description: "Emoji used as the sender's avatar.",
  placeholder: ':robot_face:',
  required: false,
  advanced: true,
});

export const threadTs = Property.ShortText({
  displayName: 'Reply to Thread',
  description: 'Timestamp or link of the parent message to reply under.',
  placeholder: '1710304378.475129',
  required: false,
});

export const mentionOriginFlow = Property.Checkbox({
  displayName: 'Mention Origin Flow',
  description: 'Append a link to this flow at the end of the message.',
  required: false,
  defaultValue: false,
  advanced: true,
});

export const blocks = Property.Json({
  displayName: 'Block Kit Blocks',
  description: 'JSON array of blocks from the Block Kit Builder.',
  required: false,
  defaultValue: [],
  advanced: true,
});

export const userId = <R extends boolean>(required: R) =>
  Property.Dropdown<string, R, typeof slackAuth>({
    auth: slackAuth,
    displayName: 'User',
    description: 'Search by name or handle.',
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
      const accessToken = getBotToken(auth as SlackAuthValue);
      const users = await getUsers(accessToken);
      return {
        disabled: false,
        placeholder: 'Select User',
        options: users,
      };
    },
  });

export const userIds = Property.MultiSelectDropdown({
  auth: slackAuth,
  displayName: 'Users',
  description: 'Pick one or more members.',
  required: false,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'connect slack account',
        options: [],
      };
    }
    const accessToken = getBotToken(auth as SlackAuthValue);
    const users = await getUsers(accessToken);
    return {
      disabled: false,
      placeholder: 'Select Users',
      options: users,
    };
  },
});

export const usergroupIds = Property.MultiSelectDropdown({
  auth: slackAuth,
  displayName: 'User Groups',
  description: 'Pick one or more user groups.',
  required: false,
  refreshers: [],
  async options({ auth }) {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'connect slack account',
        options: [],
      };
    }
    const accessToken = getBotToken(auth as SlackAuthValue);
    const client = new WebClient(accessToken);
    const response = await client.usergroups.list();
    const usergroups = (response.usergroups ?? [])
      .filter((ug) => !ug.date_delete)
      .map((ug) => ({
        label: ug.handle || ug.name || '',
        value: ug.id || '',
      }));
    return {
      disabled: false,
      placeholder: 'Select User Groups',
      options: usergroups,
    };
  },
});

export const text = Property.LongText({
  displayName: 'Message',
  description: 'Slack mrkdwn formatting is supported.',
  required: true,
});

export const actions = Property.Array({
  displayName: 'Action Buttons',
  description: 'Each button becomes a choice the recipient can click.',
  required: true,
  properties: {
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Text shown on the button.',
      placeholder: 'Approve',
      required: true,
    }),
    style: Property.StaticDropdown({
      displayName: 'Style',
      description: 'Primary is green, Danger is red.',
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

async function getUsers(accessToken: string) {
  const client = new WebClient(accessToken);
  const users: { label: string; value: string }[] = [];
  for await (const page of client.paginate('users.list', {
    limit: 1000,
  })) {
    const response = page as UsersListResponse;
    if (response.members) {
      users.push(
        ...response.members
          .filter((member) => !member.deleted)
          .map((member) => {
            const handle = member.name ?? '';
            const realName = member.real_name ?? member.profile?.real_name;
            return {
              label: realName ? `${realName} (@${handle})` : `@${handle}`,
              value: member.id ?? '',
            };
          })
      );
    }
  }
  return users;
}

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

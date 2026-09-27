import { MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { UsersListResponse, WebClient } from '@slack/web-api';
import { slackAuth } from '../auth';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
export const multiSelectChannelInfo = Property.MarkDown({
  value:
    "The list shows the first 2000 channels. Can't find yours? Invite the bot: type **/invite** in the channel, choose **Add apps** and pick the bot. Or click **ƒ** and paste IDs as `{`{ ['C012AB3CD', 'C045EF6GH'] `}`}.",
  variant: MarkdownVariant.INFO,
});

export const singleSelectChannelInfo = Property.MarkDown({
  value:
    "The list shows the first 2000 channels. Can't find yours? Invite the bot: type **/invite** in the channel, choose **Add apps** and pick the bot. Or click **ƒ** and paste the channel ID.",
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

export type SlackChannelDropdownOptions = {
  botOnly?: boolean;
};

export const botOnlyChannels = Property.Checkbox({
  displayName: "Bot's Channels Only",
  description: 'List only channels that the bot is a member of.',
  required: false,
  defaultValue: false,
});

export function isSlackRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, any>;
  return (
    err['status'] === 429 ||
    err['statusCode'] === 429 ||
    err['code'] === 'slack_webapi_rate_limited_error' ||
    err['code'] === 'slack_client_rate_limited_error' ||
    (typeof err['message'] === 'string' &&
      (err['message'].toLowerCase().includes('ratelimit') ||
        err['message'].toLowerCase().includes('rate limit') ||
        err['message'].includes('429')))
  );
}

export function extractRetryAfterSeconds(error: unknown): number | string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const err = error as Record<string, any>;
  if (typeof err['retryAfter'] === 'number' || typeof err['retryAfter'] === 'string') {
    return err['retryAfter'];
  }
  const headers = err['headers'] || err['response']?.headers;
  if (headers && typeof headers === 'object') {
    return headers['retry-after'] || headers['Retry-After'];
  }
  return undefined;
}

export async function getChannelsDropdownState(
  accessToken: string,
  options?: { botOnly?: boolean; placeholder?: string }
) {
  try {
    const channels = await getChannels(accessToken, options?.botOnly ?? false);
    return {
      disabled: false,
      placeholder: options?.placeholder || 'Select channel',
      options: channels,
    };
  } catch (error: unknown) {
    if (isSlackRateLimitError(error)) {
      const retryAfter = extractRetryAfterSeconds(error);
      return {
        disabled: true,
        placeholder: retryAfter
          ? `Rate limited by Slack (retry after ${retryAfter}s)`
          : 'Rate limited by Slack (please retry later)',
        options: [],
      };
    }
    throw error;
  }
}

export const slackChannel = <R extends boolean>(
  required: R,
  options?: SlackChannelDropdownOptions | boolean
) => {
  const isBotOnlyParam = typeof options === 'boolean' ? options : options?.botOnly;

  return Property.Dropdown<string, R, typeof slackAuth>({
    auth: slackAuth,
    displayName: 'Channel',
    description: 'Private channels appear only after the bot is added to them.',
    required,
    refreshers: ['botOnly', 'botOnlyChannels', 'onlyBotChannels'],
    async options(propsValue) {
      const { auth } = propsValue;
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'connect slack account',
          options: [],
        };
      }
      const accessToken = getBotToken(auth as SlackAuthValue);
      const botOnly = Boolean(
        isBotOnlyParam ??
          propsValue['botOnly'] ??
          propsValue['botOnlyChannels'] ??
          propsValue['onlyBotChannels'] ??
          false
      );

      return await getChannelsDropdownState(accessToken, {
        botOnly,
        placeholder: 'Select channel',
      });
    },
  });
};

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
});

export const messageTs = Property.ShortText({
  displayName: 'Message Timestamp',
  description: 'Timestamp of the target message, from its link or a trigger output.',
  placeholder: '1710304378.475129',
  required: true,
});

export const replyBroadcast = Property.Checkbox({
  displayName: 'Also Post to Channel',
  description: 'When replying in a thread, also show the reply in the channel.',
  required: false,
  defaultValue: false,
  advanced: true,
});

export const unfurlLinks = Property.Checkbox({
  displayName: 'Unfurl Links',
  description: 'Show link previews in the message.',
  required: false,
  defaultValue: true,
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

export async function getUsers(accessToken: string) {
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

export async function getChannels(accessToken: string, botOnly = false) {
  const client = new WebClient(accessToken, {
    rejectRateLimitedCalls: true,
  });
  const channels: { label: string; value: string }[] = [];
  const CHANNELS_LIMIT = 2000;

  let cursor: string | undefined;
  do {
    if (botOnly) {
      const response = await client.users.conversations({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 1000,
        cursor,
      });

      if (response.channels) {
        channels.push(
          ...response.channels.map((channel) => ({
            label: channel.name || '',
            value: channel.id || '',
          }))
        );
      }

      cursor = response.response_metadata?.next_cursor;
    } else {
      const response = await client.conversations.list({
        types: 'public_channel,private_channel',
        exclude_archived: true,
        limit: 1000,
        cursor,
      });

      if (response.channels) {
        channels.push(
          ...response.channels.map((channel) => ({
            label: channel.name || '',
            value: channel.id || '',
          }))
        );
      }

      cursor = response.response_metadata?.next_cursor;
    }
  } while (cursor && channels.length < CHANNELS_LIMIT);

  return channels;
}

export const threadCursor = Property.ShortText({
  displayName: 'Continue From Cursor',
  description: 'Next Cursor from a previous run whose Has More was true.',
  required: false,
  advanced: true,
});

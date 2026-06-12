import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { getChannels, multiSelectChannelInfo, userIds, usergroupIds } from '../common/props';
import { slackAuth } from '../auth';
import { getBotToken, getTeamId, SlackAuthValue } from '../common/auth-helpers';

export const newMention = createTrigger({
  auth: slackAuth,
  name: 'new_mention',
  displayName: 'New Mention in Channel',
  description: 'Triggers when a user or user group is mentioned.',
  aiMetadata: {
    description:
      'Fires when a channel or group message @-mentions one of the configured users or user groups. Can be optionally filtered to specific channels, and bot messages can be ignored. When the remove-mention option is enabled, the event payload includes a clean_text field with the mention tokens stripped from the message text; otherwise the raw Slack message event is returned.',
  },
  props: {
    info: multiSelectChannelInfo,
    users: userIds,
    usergroups: usergroupIds,
    channels: Property.MultiSelectDropdown({
      auth: slackAuth,
      displayName: 'Channels',
      description:
        'If no channel is selected, the flow will be triggered for username mentions in all channels',
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
        const channels = await getChannels(accessToken);
        return {
          disabled: false,
          placeholder: 'Select channel',
          options: channels,
        };
      },
    }),
    ignoreBots: Property.Checkbox({
      displayName: 'Ignore Bot Messages ?',
      required: true,
      defaultValue: false,
    }),
    removeMention: Property.Checkbox({
      displayName: 'Remove Mention from Message',
      description: 'If enabled, provides a clean_text field with the user and user group mentions removed from the message.',
      required: true,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  onEnable: async (context) => {
    const teamId = await getTeamId(context.auth as SlackAuthValue);
    context.app.createListeners({
      events: ['message'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },

  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    const channels = (context.propsValue.channels as string[]) ?? [];
    const users = (context.propsValue.users as string[]) ?? [];
    const usergroups = (context.propsValue.usergroups as string[]) ?? [];

    // check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}

    if (channels.length > 0 && !channels.includes(payloadBody.event.channel)) {
      return [];
    }

    // check for bot messages
    if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
      return [];
    }

    const text = payloadBody.event.text ?? '';

    const userMentioned = users.some((uid) => text.includes(`<@${uid}>`));
    const usergroupMentioned = usergroups.some((gid) =>
      new RegExp(`<!subteam\\^${gid}(\\|[^>]*)?>`).test(text)
    );

    if (!userMentioned && !usergroupMentioned) {
      return [];
    }

    if (context.propsValue.removeMention) {
      let cleanText = text;
      for (const uid of users) {
        cleanText = cleanText.replace(new RegExp(`<@${uid}>`, 'g'), '');
      }
      for (const gid of usergroups) {
        cleanText = cleanText.replace(
          new RegExp(`<!subteam\\^${gid}(\\|[^>]*)?>`, 'g'),
          ''
        );
      }
      cleanText = cleanText.trim();
      return [{ ...payloadBody.event, clean_text: cleanText }];
    }

    return [payloadBody.event];
  },
});

type PayloadBody = {
  event: {
    channel: string;
    bot_id?: string;
    text?: string;
    channel_type:string
  };
};

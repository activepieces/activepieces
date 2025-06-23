import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { getChannels, multiSelectChannelInfo, userId } from '../common/props';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';
import { isNil } from '@activepieces/shared';
import { getFirstFiveOrAll } from '../common/utils';

const sampleData = {
  client_msg_id: '2767cf34-0651-44e0-b9c8-1b167ce9b7a9',
  type: 'message',
  text: 'heeeelllo\n<@U07BN652T52>',
  user: 'U037UG6FKPU',
  ts: '1678231735.586539',
  blocks: [
    {
      type: 'rich_text',
      block_id: 'jCFSh',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'heeeelllo\n',
            },
            {
              type: 'user',
              user_id: 'U07BN652T52',
            },
          ],
        },
      ],
    },
  ],
  team: 'T037MS4FGDC',
  channel: 'C037RTX2ZDM',
  event_ts: '1678231735.586539',
  channel_type: 'channel',
};

export const newMention = createTrigger({
  auth: slackAuth,
  name: 'new_mention',
  displayName: 'New Mention',
  description: 'Triggers when a username is mentioned.',
  props: {
    info: multiSelectChannelInfo,
    user: userId,
    channels: Property.MultiSelectDropdown({
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
        const authentication = auth as OAuth2PropertyValue;
        const accessToken = authentication['access_token'];
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
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId =
      context.auth.data['team_id'] ?? context.auth.data['team']['id'];
    context.app.createListeners({
      events: ['message'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },

  test: async (context) => {
    const channels = context.propsValue.channels as string[];

    if (!channels || (Array.isArray(channels) && channels.length === 0)) {
      return [sampleData];
    }
    const client = new WebClient(context.auth.access_token);
    const response = await client.conversations.history({
      channel: channels[0],
      limit: 100,
    });
    if (!response.messages) {
      return [];
    }
    const messages =  response.messages
    .filter((message) => !isNil(message.ts))
      .filter(
        (message) =>
          message.text && message.text.includes(`<@${context.propsValue.user}>`)
      )
      .filter((message) => !(context.propsValue.ignoreBots && message.bot_id))
      .map((message) => {
        return {
          ...message,
          channel: channels[0],
          event_ts: '1678231735.586539',
          channel_type: 'channel',
        };
      }).sort((a, b) => parseFloat(b.ts!) - parseFloat(a.ts!));

      return getFirstFiveOrAll(messages);
  },

  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    const channels = context.propsValue.channels as string[];

    if (channels.length === 0 || channels.includes(payloadBody.event.channel)) {
      // check for bot messages
      if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
        return [];
      }
      // check for mention
      if (
        context.propsValue.user &&
        payloadBody.event.text?.includes(`<@${context.propsValue.user}>`)
      ) {
        return [payloadBody.event];
      }
    }

    return [];
  },
});

type PayloadBody = {
  event: {
    channel: string;
    bot_id?: string;
    text?: string;
  };
};

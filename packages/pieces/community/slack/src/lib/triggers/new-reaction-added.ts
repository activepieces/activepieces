import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';

const sampleData = {
  client_msg_id: '2767cf34-0651-44e0-b9c8-1b167ce9b7a9',
  type: 'message',
  text: 'f',
  user: 'U037UG6FKPU',
  ts: '1678231735.586539',
  blocks: [
    {
      type: 'rich_text',
      block_id: '4CM',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'f',
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

export const newReactionAdded = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_added',
  displayName: 'New Reaction',
  description: 'Triggers when a new reaction is added to a message',
  props: {
    emojis: Property.Array({
      displayName: 'Emojis (E.g fire, smile)',
      description: 'Select emojis to trigger on',
      required: false,
    }),
    channel: slackChannel(false),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId =
      context.auth.data['team_id'] ?? context.auth.data['team']['id'];
    context.app.createListeners({
      events: ['reaction_added'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },

  test: async (context) => {
    const client = new WebClient(
      context.auth.data['authed_user']?.access_token
    );
    const response = await client.reactions.list({ limit: 10, full: true });
    if (!response.items) {
      return [];
    }
    return response.items
      .filter((item) => item.type === 'message')
      .map((item) => {
        return {
          type: 'reaction_added',
          user: item.message?.reactions?.[0].users?.[0],
          reaction: item.message?.reactions?.[0].name,
          item_user: item.message?.user,
          item: {
            type: 'message',
            channel: item.channel,
            ts: item.message?.ts,
          },
          event_ts: '1360782804.083113',
        };
      });
  },

  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    if (context.propsValue.emojis) {
      if (!context.propsValue.emojis.includes(payloadBody.event.reaction)) {
        return [];
      }
    }
    if (context.propsValue.channel) {
      if (payloadBody.event.item['channel'] !== context.propsValue.channel) {
        return [];
      }
    }
    return [payloadBody.event];
  },
});

type PayloadBody = {
  event: {
    reaction: string;
    item: {
      channel: string;
    };
  };
};

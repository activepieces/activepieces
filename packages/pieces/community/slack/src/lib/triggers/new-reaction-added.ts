import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { getChannels, multiSelectChannelInfo } from '../common/props';
import { getBotToken, getTeamId, SlackAuthValue } from '../common/auth-helpers';


export const newReactionAdded = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_added',
  displayName: 'New Reaction',
  description: 'Triggers when a new reaction is added to a message',
  props: {
    info: multiSelectChannelInfo,
    emojis: Property.Array({
      displayName: 'Emojis (E.g fire, smile)',
      description: 'Select emojis to trigger on',
      required: false,
    }),
    channels: Property.MultiSelectDropdown({
      auth: slackAuth,
      displayName: 'Channels',
      description:
        'If no channel is selected, the flow will be triggered for reactions in all channels the app has access to',
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
          placeholder: 'Select channels',
          options: channels,
        };
      },
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  onEnable: async (context) => {
    const teamId = await getTeamId(context.auth as SlackAuthValue);
    context.app.createListeners({
      events: ['reaction_added'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },



  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    const channels = (context.propsValue.channels as string[]) ?? [];

    // Filter by emoji if specified
    if (context.propsValue.emojis) {
      if (!context.propsValue.emojis.includes(payloadBody.event.reaction)) {
        return [];
      }
    }

    // Filter by channels - if no channels selected, trigger for all
    if (channels.length > 0 && !channels.includes(payloadBody.event.item.channel)) {
      return [];
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


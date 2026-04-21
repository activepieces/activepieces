import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getChannels, multiSelectChannelInfo, userId } from '../common/props';
import { getBotToken, getTeamId, SlackAuthValue } from '../common/auth-helpers';

export const newReactionRemoved = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_removed',
  displayName: 'Reaction Removed',
  description: 'Triggers when a reaction is removed from a message',
  props: {
    info: multiSelectChannelInfo,
    emojis: Property.Array({
      displayName: 'Emojis (E.g fire, smile)',
      description: 'Select emojis to trigger on',
      required: false,
    }),
    user: userId(false),
    channels: Property.MultiSelectDropdown({
      auth: slackAuth,
      displayName: 'Channels',
      description:
        'If no channel is selected, the flow will be triggered for reactions removed in all channels the app has access to',
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
      events: ['reaction_removed'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },
  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    const channels = (context.propsValue.channels as string[]) ?? [];
    const emojis = (context.propsValue.emojis as string[]) ?? [];

    if (context.propsValue.user && payloadBody.event.user !== context.propsValue.user) {
      return [];
    }

    if (emojis.length > 0 && !emojis.includes(payloadBody.event.reaction)) {
      return [];
    }

    if (channels.length > 0 && !channels.includes(payloadBody.event.item.channel)) {
      return [];
    }

    return [payloadBody.event];
  },
});

type PayloadBody = {
  event: {
    user: string;
    reaction: string;
    item: {
      channel: string;
    };
  };
};

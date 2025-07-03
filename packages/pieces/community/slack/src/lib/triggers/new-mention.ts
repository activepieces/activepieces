import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { getChannels, multiSelectChannelInfo, userId } from '../common/props';
import { slackAuth } from '../../';

export const newMention = createTrigger({
  auth: slackAuth,
  name: 'new_mention',
  displayName: 'New Mention in Channel',
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
  sampleData: undefined,
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

  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    const channels = (context.propsValue.channels as string[]) ?? [];

    // check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}


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
    channel_type:string
  };
};

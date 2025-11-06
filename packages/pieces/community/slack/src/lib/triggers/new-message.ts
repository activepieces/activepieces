import {
  Property,
  TriggerStrategy,
  createTrigger,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { getChannels } from '../common/props';

export const newMessageTrigger = createTrigger({
	auth: slackAuth,
	name: 'new-message',
	displayName: 'New message posted',
	description: 'Triggers when a new message is posted (optionally on one or more channels)',
	props: {
    channels: Property.MultiSelectDropdown({
      displayName: 'Channels',
      description:
        'If no channel is selected, the flow will be triggered for messages in all channels',
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
        const channels = await getChannels(authentication['access_token']);
        return {
          disabled: false,
          placeholder: 'Select channel(s)',
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
		const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id'];
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

		// check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}

    // check if the channel is among one of the requested ones
    if (context.propsValue.channels && !context.propsValue.channels.includes(payloadBody.event.channel)) {
      return []
    }

		// check for bot messages
		if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
			return [];
		}
		return [payloadBody.event];
	},
});

type PayloadBody = {
	event: {
		channel: string;
		bot_id?: string;
		channel_type:string
	};
};

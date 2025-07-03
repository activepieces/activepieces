import {
  OAuth2PropertyValue,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { getChannels, multiSelectChannelInfo, userId } from '../common/props';
import { slackAuth } from '../../';
import { parseCommand } from '../common/utils';

export const newCommand = createTrigger({
  auth: slackAuth,
  name: 'new_command',
  displayName: 'New Command in Channel',
  description:
    'Triggers when a specific command is sent to the bot (e.g., @bot command arg1 arg2)',
  props: {
    info: multiSelectChannelInfo,
    user: userId,
    commands: Property.Array({
      displayName: 'Commands',
      description:
        'List of valid commands that the bot should respond to (e.g., help, ocr, remind)',
      required: true,
      defaultValue: ['help'],
    }),
    channels: Property.MultiSelectDropdown({
      displayName: 'Channels',
      description:
        'If no channel is selected, the flow will be triggered for commands in all channels',
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
      defaultValue: true,
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
    const commands = (context.propsValue.commands as string[]) ?? [];
    const user = context.propsValue.user as string;

    
    // check if it's channel message
		if (!['channel','group'].includes(payloadBody.event.channel_type)) {
			return [];
		}

    // Check if we should process this channel
    if (
      !(channels.length === 0 || channels.includes(payloadBody.event.channel))
    ) {
      return [];
    }

    // Check for bot messages if configured to ignore them
    if (context.propsValue.ignoreBots && payloadBody.event.bot_id) {
      return [];
    }

    // Check for mention and parse command
    if (user && payloadBody.event.text) {
      const parsedCommand = parseCommand(
        payloadBody.event.text,
        user,
        commands
      );

      if (parsedCommand && commands.includes(parsedCommand.command)) {
        // Return event with parsed command
        return [
          {
            ...payloadBody.event,
            parsed_command: parsedCommand,
          },
        ];
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

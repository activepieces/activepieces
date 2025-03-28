import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { userId } from '../common/props';
import { slackAuth } from '../../';
import { parseCommand } from '../common/utils';

export const newCommandInDirectMessageTrigger = createTrigger({
  auth: slackAuth,
  name: 'new-command-in-direct-message',
  displayName: 'New Command in Direct Message',
  description:
    'Triggers when a specific command is sent to the bot (e.g., @bot command arg1 arg2) via Direct Message.',
  props: {
    user: userId,
    commands: Property.Array({
      displayName: 'Commands',
      description:
        'List of valid commands that the bot should respond to (e.g., help, ocr, remind)',
      required: true,
      defaultValue: ['help'],
    }),
    ignoreBots: Property.Checkbox({
      displayName: 'Ignore Bot Messages ?',
      required: true,
      defaultValue: true,
    }),
    ignoreSelfMessages: Property.Checkbox({
        displayName: 'Ignore Message from Yourself ?',
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
    const commands = (context.propsValue.commands as string[]) ?? [];
    const user = context.propsValue.user as string;
    const authUserId = context.auth.data['authed_user']?.id;


    if (payloadBody.event.channel_type !== 'im') {
        return [];
    }

    // Check for bot messages if configured to ignore them
		if (
			(context.propsValue.ignoreBots && payloadBody.event.bot_id) ||
			(context.propsValue.ignoreSelfMessages && payloadBody.event.user === authUserId)
		) {
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
    channel_type: string;
    user: string;
  };
};

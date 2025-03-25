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


export const newCommand = createTrigger({
  auth: slackAuth,
  name: 'new_command',
  displayName: 'New Command',
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

/**
 * Parse a message text to extract command and arguments
 */
function parseCommand(
  text: string,
  botUserId: string,
  validCommands: string[]
): { command: string; args: string[] } | null {
  if (!botUserId) {
    return null;
  }

  // Check if the message mentions the bot
  const mentionRegex = new RegExp(`<@${botUserId}>\\s+(.+)`, 's');
  const mentionMatch = text.match(mentionRegex);

  if (!mentionMatch) {
    return null;
  }

  // Extract the text after the mention
  const commandText = mentionMatch[1].trim();

  // Split into command and arguments (first word is command, rest are args)
  const parts = commandText.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Check if it's a valid command
  if (!validCommands.includes(command)) {
    return null;
  }

  return {
    command,
    args,
  };
}

type PayloadBody = {
  event: {
    channel: string;
    bot_id?: string;
    text?: string;
  };
};

import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { appWebhookSetupInfo, getChannels, multiSelectChannelInfo, userId } from '../common/props';
import { slackAuth } from '../auth';
import { parseCommand } from '../common/utils';
import { getBotToken, getTeamId, SlackAuthValue } from '../common/auth-helpers';
import { newCommandTriggerOutputSchema } from '../output-schemas';

export const newCommand = createTrigger({
  auth: slackAuth,
  name: 'new_command',
  classification: 'READ',
  displayName: 'New Command in Channel',
  description:
    'Triggers when a specific command is sent to the bot (e.g., @bot command arg1 arg2)',
  aiMetadata: {
    description:
      'Fires when a channel or group message addressed to the bot contains one of the configured commands (e.g., "@bot help" or "@bot ocr"). Can be optionally filtered to specific channels, and bot messages can be ignored. The event payload includes the original message plus a parsed_command object with the recognized command and its arguments.',
  },
  props: {
    webhookInfo: appWebhookSetupInfo,
    info: multiSelectChannelInfo,
    user: userId(true),
    commands: Property.Array({
      displayName: 'Commands',
      description: 'Words the bot responds to, such as help or remind.',
      required: true,
      defaultValue: ['help'],
    }),
    channels: Property.MultiSelectDropdown({
      auth: slackAuth,
      displayName: 'Channels',
      description: 'Empty means every channel the bot is in.',
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
      displayName: 'Ignore Bot Messages',
      description: 'Skip messages posted by bots and apps.',
      required: false,
      defaultValue: true,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  outputSchema: newCommandTriggerOutputSchema,
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

    if (user && payloadBody.event.text) {
      const parsedCommand = parseCommand(
        payloadBody.event.text,
        user,
        commands
      );

      if (parsedCommand) {
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

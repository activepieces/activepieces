import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { appWebhookSetupInfo, userId } from '../common/props';
import { slackAuth } from '../auth';
import { parseCommand } from '../common/utils';
import { getTeamId, getUserId, SlackAuthValue } from '../common/auth-helpers';
import { newCommandInDirectMessageTriggerOutputSchema } from '../output-schemas';

export const newCommandInDirectMessageTrigger = createTrigger({
  auth: slackAuth,
  name: 'new-command-in-direct-message',
  classification: 'READ',
  displayName: 'New Command in Direct Message',
  description:
    'Triggers when a specific command is sent to the bot (e.g., @bot command arg1 arg2) via Direct Message.',
  aiMetadata: {
    description:
      'Fires when a direct message (im channel) addressed to the bot contains one of the configured commands (e.g., "@bot help" or "@bot remind"). Only messages in DM channels matching the listed commands fire; bot messages and the user\'s own messages can be optionally ignored. The event payload includes the original message plus a parsed_command object with the recognized command and its arguments.',
  },
  props: {
    info: appWebhookSetupInfo,
    user: userId(true),
    commands: Property.Array({
      displayName: 'Commands',
      description: 'Words the bot responds to, such as help or remind.',
      required: true,
      defaultValue: ['help'],
    }),
    ignoreBots: Property.Checkbox({
      displayName: 'Ignore Bot Messages',
      description: 'Skip messages posted by bots and apps.',
      required: false,
      defaultValue: true,
    }),
    ignoreSelfMessages: Property.Checkbox({
      displayName: 'Ignore My Own Messages',
      description: 'Skip messages sent by the connected user.',
      required: false,
      defaultValue: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  outputSchema: newCommandInDirectMessageTriggerOutputSchema,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
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
    const commands = (context.propsValue.commands as string[]) ?? [];
    const user = context.propsValue.user as string;
    const authUserId = await getUserId(context.auth as SlackAuthValue)


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
    channel_type: string;
    user: string;
  };
};

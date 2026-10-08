import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { appWebhookSetupInfo, onlyBotChannels, slackChannels, multiSelectChannelInfo, userId } from '../common/props';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';
import { newReactionRemovedTriggerOutputSchema } from '../output-schemas';

export const newReactionRemoved = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_removed',
  classification: 'READ',
  displayName: 'Reaction Removed',
  description: 'Triggers when a reaction is removed from a message',
  aiMetadata: {
    description:
      'Fires when an emoji reaction is removed from a message in the Slack workspace. Can be optionally filtered to specific emojis, a specific user, or specific channels. The event payload identifies the user who removed the reaction, the emoji name, and the message item it was removed from.',
  },
  props: {
    webhookInfo: appWebhookSetupInfo,
    info: multiSelectChannelInfo,
    emojis: Property.Array({
      displayName: 'Emojis',
      description: 'Emoji names without colons. Empty means any emoji.',
      required: false,
    }),
    user: userId(false),
    onlyBotChannels,
    channels: slackChannels,
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  outputSchema: newReactionRemovedTriggerOutputSchema,
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

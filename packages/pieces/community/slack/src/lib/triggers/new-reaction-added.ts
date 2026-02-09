import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { slackChannel } from '../common/props';
import { WebClient } from '@slack/web-api';


export const newReactionAdded = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_added',
  displayName: 'New Reaction',
  description: 'Triggers when a new reaction is added to a message',
  props: {
    emojis: Property.Array({
      displayName: 'Emojis (E.g fire, smile)',
      description: 'Select emojis to trigger on',
      required: false,
    }),
    channel: slackChannel(false),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId =
      context.auth.data['team_id'] ?? context.auth.data['team']['id'];
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
    if (context.propsValue.emojis) {
      if (!context.propsValue.emojis.includes(payloadBody.event.reaction)) {
        return [];
      }
    }
    if (context.propsValue.channel) {
      if (payloadBody.event.item['channel'] !== context.propsValue.channel) {
        return [];
      }
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

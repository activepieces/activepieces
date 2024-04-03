import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackAuth } from '../../';

const sampleData = {
  client_msg_id: '2767cf34-0651-44e0-b9c8-1b167ce9b7a9',
  type: 'message',
  text: 'f',
  user: 'U037UG6FKPU',
  ts: '1678231735.586539',
  blocks: [
    {
      type: 'rich_text',
      block_id: '4CM',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'text',
              text: 'f',
            },
          ],
        },
      ],
    },
  ],
  team: 'T037MS4FGDC',
  channel: 'C037RTX2ZDM',
  event_ts: '1678231735.586539',
  channel_type: 'channel',
};

export const newReactionAdded = createTrigger({
  auth: slackAuth,
  name: 'new_reaction_added',
  displayName: 'New Reaction',
  description: 'Triggers when a new reaction is added to a message',
  props: {
    emoj: Property.Array({
      displayName: 'Emojis (E.g fire, smile)',
      description: 'Select emojs to trigger on',
      required: false,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId = context.auth.data['team_id'] ?? context.auth.data['team']['id']
    await context.app.createListeners({
      events: ['reaction_added'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },
  test: async (context) => {
    return [sampleData];
  },
  run: async (context) => {
    const payloadBody = context.payload.body as Record<string, unknown>;
    if (context.propsValue.emoj) {
      if (context.propsValue.emoj.includes(payloadBody.reaction)) {
        return [];
      }
    }
    return [payloadBody.event];
  },
});

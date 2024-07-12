import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../../';
import { WebClient } from '@slack/web-api';

const sampleData = {
  type: 'channel_created',
  channel: {
    id: 'C024BE91L',
    name: 'fun',
    created: 1360782804,
    creator: 'U024BE7LH',
  },
};

export const channelCreated = createTrigger({
  auth: slackAuth,
  name: 'channel_created',
  displayName: 'Channel created',
  description: 'Triggers when a channel is created',
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId =
      context.auth.data['team_id'] ?? context.auth.data['team']['id'];
    context.app.createListeners({
      events: ['channel_created'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },
  test: async (context) => {
    const client = new WebClient(context.auth.access_token);
    const response = await client.conversations.list({
      exclude_archived: true,
      limit: 10,
      types: 'public_channel,private_channel',
    });
    if (!response.channels) {
      return [];
    }
    return response.channels.map((channel) => {
      return {
        type: 'channel_created',
        channel: {
          id: channel.id,
          name: channel.name,
          created: channel.created,
          creator: channel.creator,
        },
      };
    });
  },

  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    return [payloadBody.event];
  },
});

type PayloadBody = {
  event: object;
};

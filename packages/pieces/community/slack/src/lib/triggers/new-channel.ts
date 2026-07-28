import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';

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
  aiMetadata: {
    description:
      'Fires when a new public or private channel is created in the connected Slack workspace. The event payload includes the new channel id, name, creation timestamp, and the id of the user who created it.',
  },
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    const teamId = await getTeamId(context.auth as SlackAuthValue);
    context.app.createListeners({
      events: ['channel_created'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },
  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    return [payloadBody.event];
  },
});

type PayloadBody = {
  event: object;
};

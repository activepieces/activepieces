import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getTeamId, SlackAuthValue } from '../common/auth-helpers';

export const channelCreated = createTrigger({
  auth: slackAuth,
  name: 'channel_created',
  displayName: 'Channel created',
  description:
    'Triggers when a new channel is created. This event only arrives after the connected Slack app is manually configured: turn on Event Subscriptions, set the Request URL to https://YOUR_AP_INSTANCE/api/v1/app-events/slack, subscribe to the channel_created event, keep Socket Mode off, and add the app Signing Secret to the AP_APP_WEBHOOK_SECRETS environment variable. Until then Slack sends no events, so testing this trigger waits for a real channel to be created.',
  aiMetadata: {
    description:
      'Fires when a new public or private channel is created in the connected Slack workspace. The event payload includes the new channel id, name, creation timestamp, and the id of the user who created it.',
  },
  props: {},
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: undefined,
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

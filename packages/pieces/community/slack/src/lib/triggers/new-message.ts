import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { slackChannel } from '../common/props';
import { slackAuth } from '../../';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

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

export const newMessage = createTrigger({
  auth: slackAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Triggers when a new message is received',
  props: {
    channel: slackChannel,
    info: Property.MarkDown({
      value: `
      To add the bot to the channel, please follow these steps:
        1. Type /invite in the channel's chat.
        2. Click on Add apps to this channel.
        3. Search for and add the Activepieces bot.`,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: sampleData,
  onEnable: async (context) => {
    // Older OAuth2 has team_id, newer has team.id
    const teamId =
      context.auth.data['team_id'] ?? context.auth.data['team']['id'];
    await context.app.createListeners({
      events: ['message'],
      identifierValue: teamId,
    });
  },
  onDisable: async (context) => {
    // Ignored
  },
  test: async (context) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://slack.com/api/conversations.history',
      queryParams: {
        channel: context.propsValue.channel,
        limit: '10',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };
    const response = await httpClient.sendRequest(request);

    return response.body.messages.map((message: any) => ({
      ...message,
      channel: context.propsValue.channel,
      event_ts: '1678231735.586539',
      channel_type: 'channel',
    }));
  },
  run: async (context) => {
    const payloadBody = context.payload.body as PayloadBody;
    if (payloadBody.event.channel === context.propsValue.channel) {
      return [payloadBody.event];
    }

    return [];
  },
});

type PayloadBody = {
  event: {
    channel: string;
  };
};

import { slackAuth } from '../../';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  HttpRequest,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  PiecePropValueSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const polling: Polling<
  PiecePropValueSchema<typeof slackAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    let cursor;
    const channels: any[] = [];
    do {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://slack.com/api/conversations.list',
        queryParams: {
          types: 'public_channel,private_channel',
          limit: '200',
          cursor: cursor ?? '',
        },

        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
      };

      const response = await httpClient.sendRequest<{
        channels: any[];
        response_metadata: { next_cursor: string };
      }>(request);

      channels.push(...response.body.channels);
      cursor = response.body.response_metadata.next_cursor;
    } while (cursor !== '' && channels.length < 600);

    return channels.map((channel: any) => ({
      epochMilliSeconds: channel.created * 1000,
      data: channel,
    }));
  },
};

export const newChannelTrigger = createTrigger({
  auth: slackAuth,
  name: 'slack-new-channel',
  displayName: 'New Channel',
  description: 'Triggers when a new channel is created.',
  type: TriggerStrategy.POLLING,
  props: {},
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async test(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.test(polling, { store, auth, propsValue });
  },
  async run(context) {
    const { store, auth, propsValue } = context;
    return await pollingHelper.poll(polling, { store, auth, propsValue });
  },
  sampleData: {},
});

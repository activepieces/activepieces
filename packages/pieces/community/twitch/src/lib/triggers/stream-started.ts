import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { twitchAuth } from '../../index';

const props = {
  streamers: Property.Array({
    displayName: 'Streamer Name(s)/URL(s)',
    description:
      'Add the usernames or URLs of the streamers you want to monitor (e.g., loltyler1 or https://twitch.tv/faker).',
    required: true,
  }),
};
const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twitchAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { streamers } = propsValue;

    const logins = (streamers as string[]).map((s) =>
      s.replace(/.*\//, '').trim().toLowerCase()
    );

    const queryString = logins
      .map((login) => `user_login=${encodeURIComponent(login)}`)
      .join('&');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.twitch.tv/helix/streams?${queryString}`,
      headers: {
        'Client-ID': auth.client_id,
        Authorization: `Bearer ${auth.access_token}`,
      },
    });

    const streams = response.body.data;

    return streams.map((s: any) => ({
      epochMs: dayjs(s.started_at).valueOf(),
      data: s,
    }));
  },
};

export const streamStarted = createTrigger({
  auth: twitchAuth,
  name: 'stream_started',
  displayName: 'Streamer(s) Go Live',
  description: 'Triggers when a stream from a list of streamers has started',
  props: props,
  sampleData: {
    id: '316465520862',
    user_id: '230609655',
    user_login: 'carnyjared',
    user_name: 'CarnyJared',
    game_id: '125264560',
    game_name: 'Clone Hero',
    type: 'live',
    title: '🚨CLONE HERO LEADERBOARD PTB🚨',
    viewer_count: 163,
    started_at: '2025-12-24T04:58:37Z',
    language: 'en',
    thumbnail_url:
      'https://static-cdn.jtvnw.net/previews-ttv/live_user_carnyjared-{width}x{height}.jpg',
    tag_ids: [],
    tags: ['English'],
    is_mature: false,
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

import {
  DedupeStrategy,
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
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon, TwitchStream } from '../common';

const props = {
  streamers: Property.Array({
    displayName: 'Streamer Name(s)/URL(s)',
    description:
      'Add the usernames or URLs of the streamers you want to monitor (e.g., loltyler1 or https://twitch.tv/faker). Blank or invalid entries are ignored; at least one valid entry is required.',
    required: true,
  }),
};
const polling: Polling<
  AppConnectionValueForAuthProperty<typeof twitchAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const logins = twitchCommon.normalizeLogins(propsValue.streamers ?? []);
    if (logins.length === 0) {
      throw new Error(
        'Add at least one valid Twitch username or channel URL (for example loltyler1 or https://twitch.tv/faker).'
      );
    }
    const batches = twitchCommon.chunk({ items: logins, size: twitchCommon.pageSize });
    const pages = await Promise.all(
      batches.map((batch) =>
        twitchCommon.request<HelixPage<TwitchStream>>({
          auth,
          method: HttpMethod.GET,
          path: '/streams',
          query: { user_login: batch, first: String(twitchCommon.pageSize) },
        })
      )
    );
    return pages
      .flatMap((page) => page.body.data ?? [])
      .map((stream) => ({
        epochMilliSeconds: dayjs(stream.started_at).valueOf(),
        data: twitchCommon.omitKeys({ item: stream, keys: ['tag_ids'] }),
      }));
  },
};

export const streamStarted = createTrigger({
  auth: twitchAuth,
  name: 'stream_started',
  classification: 'READ',
  displayName: 'Streamer(s) Go Live',
  description: 'Triggers when a stream from a list of streamers has started',
  aiMetadata: {
    description:
      'Fires when any of the monitored Twitch streamers goes live (transitions from offline to broadcasting). Polls the Twitch Helix streams API for the given user logins and emits one event per newly started stream. Each event represents an active live stream and includes the streamer (user_id, user_login, user_name), the game/category (game_id, game_name), stream title, current viewer_count, language, started_at timestamp, thumbnail_url, tags, and is_mature flag.',
  },
  props: props,
  outputSchema: { fields: twitchCommon.streamFields },
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
    tags: ['English'],
    is_mature: false,
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, isNil, Property, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { twitchAuth } from '../auth';
import { HelixPage, twitchCommon, TwitchAuthValue, TwitchStream } from '../common';

const props = {
  streamers: Property.Array({
    displayName: 'Streamer Name(s)/URL(s)',
    description:
      'Add the usernames or URLs of the streamers you want to monitor (e.g., loltyler1 or https://twitch.tv/faker). Blank or invalid entries are ignored; at least one valid entry is required.',
    required: true,
  }),
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

  async test({ auth, propsValue }) {
    const live = await fetchLiveStreams({ auth, streamers: propsValue.streamers });
    return live.slice(0, 5).map(toEvent);
  },

  async onEnable({ auth, propsValue, store, isRepublish }) {
    if (isRepublish && !isNil(await store.get<SeenStreams>(SEEN_KEY))) {
      return;
    }
    await seedSeenStreams({ store, auth, streamers: propsValue.streamers });
  },

  async onDisable({ store, isRepublish }) {
    if (isRepublish) {
      return;
    }
    await store.delete(SEEN_KEY);
  },

  async run({ auth, propsValue, store }) {
    const seen = await store.get<SeenStreams>(SEEN_KEY);
    if (isNil(seen)) {
      await seedSeenStreams({ store, auth, streamers: propsValue.streamers });
      return [];
    }
    const live = await fetchLiveStreams({ auth, streamers: propsValue.streamers });
    const started = live
      .filter((stream) => !(stream.id in seen))
      .sort((a, b) => dayjs(a.started_at).valueOf() - dayjs(b.started_at).valueOf());
    await store.put<SeenStreams>(SEEN_KEY, markSeen({ seen, streams: live, now: Date.now() }));
    return started.map(toEvent);
  },
});

const SEEN_KEY = 'seenStreams';
const LEGACY_LAST_POLL_KEY = 'lastPoll';
const SEEN_RETENTION_MS = 24 * 60 * 60 * 1000;

async function fetchLiveStreams({
  auth,
  streamers,
}: {
  auth: TwitchAuthValue;
  streamers: unknown[] | undefined;
}): Promise<TwitchStream[]> {
  const logins = twitchCommon.normalizeLogins(streamers ?? []);
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
  return pages.flatMap((page) => page.body.data ?? []);
}

function toEvent(stream: TwitchStream) {
  return twitchCommon.omitKeys({ item: stream, keys: ['tag_ids'] });
}

function markSeen({
  seen,
  streams,
  now,
}: {
  seen: SeenStreams;
  streams: TwitchStream[];
  now: number;
}): SeenStreams {
  const next: SeenStreams = {};
  for (const [id, lastSeen] of Object.entries(seen)) {
    if (now - lastSeen < SEEN_RETENTION_MS) {
      next[id] = lastSeen;
    }
  }
  for (const stream of streams) {
    next[stream.id] = now;
  }
  return next;
}

async function seedSeenStreams({
  store,
  auth,
  streamers,
}: {
  store: Store;
  auth: TwitchAuthValue;
  streamers: unknown[] | undefined;
}): Promise<void> {
  const live = await fetchLiveStreams({ auth, streamers });
  const legacyLastPoll = await store.get<number>(LEGACY_LAST_POLL_KEY);
  const alreadyHandled = isNil(legacyLastPoll)
    ? live
    : live.filter((stream) => dayjs(stream.started_at).valueOf() <= legacyLastPoll);
  await store.put<SeenStreams>(SEEN_KEY, markSeen({ seen: {}, streams: alreadyHandled, now: Date.now() }));
  await store.delete(LEGACY_LAST_POLL_KEY);
}

type SeenStreams = Record<string, number>;

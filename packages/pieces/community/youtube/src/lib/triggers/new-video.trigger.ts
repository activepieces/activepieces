import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  PieceAuth,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { channelIdentifier } from '../common/props';
import { newVideoTriggerOutputSchema } from '../output-schemas';
import { isNil, tryCatch } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { load as cheerioLoad } from 'cheerio';
import FeedParser from 'feedparser';

export const youtubeNewVideoTrigger = createTrigger({
  name: 'new-video',
  classification: 'READ',
  displayName: 'New Video In Channel',
  description: 'Runs when a new video is added to a YouTube channel.',
  aiMetadata: {
    description:
      'Fires when a new video is published on the specified YouTube channel. The event represents a single newly detected video from the channel RSS feed, including its title, link, video ID, publish date, author, and thumbnail.',
  },
  auth: PieceAuth.None(),
  requireAuth: false,
  outputSchema: newVideoTriggerOutputSchema,

  type: TriggerStrategy.POLLING,
  props: {
    channel_identifier: channelIdentifier,
  },
  sampleData: {
    title: 'Ap Flow Branching',
    description: null,
    summary: null,
    date: '2023-03-09T01:23:10.000Z',
    pubdate: '2023-03-01T21:31:36.000Z',
    pubDate: '2023-03-01T21:31:36.000Z',
    link: 'https://www.youtube.com/watch?v=C7MZkWxrtvM',
    guid: 'yt:video:C7MZkWxrtvM',
    author: 'Mohammad AbuAboud',
    comments: null,
    origlink: null,
    image: {
      url: 'https://i4.ytimg.com/vi/C7MZkWxrtvM/hqdefault.jpg',
    },
    source: {},
    categories: [],
    enclosures: [],
    'atom:@': {},
    'atom:id': {
      '@': {},
      '#': 'yt:video:C7MZkWxrtvM',
    },
    'yt:videoid': {
      '@': {},
      '#': 'C7MZkWxrtvM',
    },
    'yt:channelid': {
      '@': {},
      '#': 'UCgImnA993V_2IbQ9seYNEzA',
    },
    'atom:title': {
      '@': {},
      '#': 'Ap Flow Branching',
    },
    'atom:link': {
      '@': {
        rel: 'alternate',
        href: 'https://www.youtube.com/watch?v=C7MZkWxrtvM',
      },
    },
    'atom:author': {
      '@': {},
      name: {
        '@': {},
        '#': 'Mohammad AbuAboud',
      },
      uri: {
        '@': {},
        '#': 'https://www.youtube.com/channel/UCgImnA993V_2IbQ9seYNEzA',
      },
    },
    'atom:published': {
      '@': {},
      '#': '2023-03-01T21:31:36+00:00',
    },
    'atom:updated': {
      '@': {},
      '#': '2023-03-09T01:23:10+00:00',
    },
    'media:group': {
      '@': {},
      'media:title': {
        '@': {},
        '#': 'Ap Flow Branching',
      },
      'media:content': {
        '@': {
          url: 'https://www.youtube.com/v/C7MZkWxrtvM?version=3',
          type: 'application/x-shockwave-flash',
          width: '640',
          height: '390',
        },
      },
      'media:thumbnail': {
        '@': {
          url: 'https://i4.ytimg.com/vi/C7MZkWxrtvM/hqdefault.jpg',
          width: '480',
          height: '360',
        },
      },
      'media:description': {
        '@': {},
      },
      'media:community': {
        '@': {},
        'media:starrating': {
          '@': {
            count: '0',
            average: '0.00',
            min: '1',
            max: '5',
          },
        },
        'media:statistics': {
          '@': {
            views: '9',
          },
        },
      },
    },
    meta: {
      '#ns': [
        {
          'xmlns:yt': 'http://www.youtube.com/xml/schemas/2015',
        },
        {
          'xmlns:media': 'http://search.yahoo.com/mrss/',
        },
        {
          xmlns: 'http://www.w3.org/2005/Atom',
        },
      ],
      '@': [
        {
          'xmlns:yt': 'http://www.youtube.com/xml/schemas/2015',
        },
        {
          'xmlns:media': 'http://search.yahoo.com/mrss/',
        },
        {
          xmlns: 'http://www.w3.org/2005/Atom',
        },
      ],
      '#xml': {
        version: '1.0',
        encoding: 'UTF-8',
      },
      '#type': 'atom',
      '#version': '1.0',
      title: 'Mohammad AbuAboud',
      description: null,
      date: '2020-12-29T17:29:29.000Z',
      pubdate: '2020-12-29T17:29:29.000Z',
      pubDate: '2020-12-29T17:29:29.000Z',
      link: 'https://www.youtube.com/channel/UCgImnA993V_2IbQ9seYNEzA',
      xmlurl:
        'http://www.youtube.com/feeds/videos.xml?channel_id=UCgImnA993V_2IbQ9seYNEzA',
      xmlUrl:
        'http://www.youtube.com/feeds/videos.xml?channel_id=UCgImnA993V_2IbQ9seYNEzA',
      author: 'Mohammad AbuAboud',
      language: null,
      favicon: null,
      copyright: null,
      generator: null,
      cloud: {},
      image: {},
      categories: [],
      'atom:@': {
        'xmlns:yt': 'http://www.youtube.com/xml/schemas/2015',
        'xmlns:media': 'http://search.yahoo.com/mrss/',
        xmlns: 'http://www.w3.org/2005/Atom',
      },
      'atom:link': [
        {
          '@': {
            rel: 'self',
            href: 'http://www.youtube.com/feeds/videos.xml?channel_id=UCgImnA993V_2IbQ9seYNEzA',
          },
        },
        {
          '@': {
            rel: 'alternate',
            href: 'https://www.youtube.com/channel/UCgImnA993V_2IbQ9seYNEzA',
          },
        },
      ],
      'atom:id': {
        '@': {},
        '#': 'yt:channel:',
      },
      'yt:channelid': {
        '@': {},
      },
      'atom:title': {
        '@': {},
        '#': 'Mohammad AbuAboud',
      },
      'atom:author': {
        '@': {},
        name: {
          '@': {},
          '#': 'Mohammad AbuAboud',
        },
        uri: {
          '@': {},
          '#': 'https://www.youtube.com/channel/UCgImnA993V_2IbQ9seYNEzA',
        },
      },
      'atom:published': {
        '@': {},
        '#': '2020-12-29T17:29:29+00:00',
      },
    },
  },
  async test({ propsValue }): Promise<unknown[]> {
    const channelId = await getChannelId(propsValue.channel_identifier);
    const items = await getRssItems(channelId);
    return sortNewestFirst(items).slice(0, 5).reverse();
  },
  async onEnable({ propsValue, store, isRepublish }): Promise<void> {
    const seenIds = await store.get<string[]>(SEEN_IDS_KEY);
    const channel = await resolveChannel({
      store,
      identifier: propsValue.channel_identifier,
    });
    if (isRepublish && !isNil(seenIds) && !channel.changed) {
      await saveChannel({ store, channel });
      return;
    }
    const items = await getRssItems(channel.channelId);
    await store.put(SEEN_IDS_KEY, toSeenIds({ items, previous: [] }));
    await saveChannel({ store, channel });
  },
  async onDisable({ store, isRepublish }): Promise<void> {
    if (isRepublish) {
      return;
    }
    await store.delete(SEEN_IDS_KEY);
    await store.delete(CHANNEL_KEY);
    await store.delete(LEGACY_CHANNEL_ID_KEY);
  },
  async run({ propsValue, store }): Promise<unknown[]> {
    const channel = await resolveChannel({
      store,
      identifier: propsValue.channel_identifier,
    });
    const rawItems = await getRssItems(channel.channelId);
    const previousIds = await store.get<string[]>(SEEN_IDS_KEY);

    if (channel.changed || isNil(previousIds)) {
      await store.put(SEEN_IDS_KEY, toSeenIds({ items: rawItems, previous: [] }));
      await saveChannel({ store, channel });
      return [];
    }
    await saveChannel({ store, channel });

    const seenIds = new Set<string>(previousIds);
    const newItems = rawItems.filter((item) => !seenIds.has(getId(item)));

    if (rawItems.length > 0) {
      await store.put(
        SEEN_IDS_KEY,
        toSeenIds({ items: rawItems, previous: previousIds }),
      );
    }

    return sortNewestFirst(newItems).map((item) => withDedupeKey(item));
  },
});

const SEEN_IDS_KEY = '_seenVideoIds';
const CHANNEL_KEY = '_channel';
const LEGACY_CHANNEL_ID_KEY = 'channelId';
const MAX_SEEN_IDS = 300;
const REQUEST_TIMEOUT_MS = 20_000;

async function resolveChannel({
  store,
  identifier,
}: {
  store: Store;
  identifier: string;
}): Promise<ResolvedChannel> {
  const trimmed = identifier.trim();
  const stored = await store.get<StoredChannel>(CHANNEL_KEY);
  if (!isNil(stored) && stored.identifier === trimmed) {
    return { identifier: trimmed, channelId: stored.channelId, changed: false };
  }
  const previousChannelId =
    stored?.channelId ?? (await store.get<string>(LEGACY_CHANNEL_ID_KEY));
  const channelId = await getChannelId(trimmed);
  return {
    identifier: trimmed,
    channelId,
    changed: isNil(previousChannelId) || previousChannelId !== channelId,
  };
}

async function saveChannel({
  store,
  channel,
}: {
  store: Store;
  channel: ResolvedChannel;
}): Promise<void> {
  const stored = await store.get<StoredChannel>(CHANNEL_KEY);
  if (
    stored?.identifier !== channel.identifier ||
    stored?.channelId !== channel.channelId
  ) {
    await store.put<StoredChannel>(CHANNEL_KEY, {
      identifier: channel.identifier,
      channelId: channel.channelId,
    });
  }
  if (!isNil(await store.get<string>(LEGACY_CHANNEL_ID_KEY))) {
    await store.delete(LEGACY_CHANNEL_ID_KEY);
  }
}

function toSeenIds({
  items,
  previous,
}: {
  items: FeedEntry[];
  previous: string[];
}): string[] {
  const currentIds = sortNewestFirst(items).map((item) => getId(item));
  const current = new Set(currentIds);
  return [...currentIds, ...previous.filter((id) => !current.has(id))].slice(
    0,
    MAX_SEEN_IDS,
  );
}

function sortNewestFirst<T extends FeedEntry>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index, unix: publishedUnix(item) }))
    .sort((a, b) => {
      if (!isNil(a.unix) && !isNil(b.unix) && a.unix !== b.unix) {
        return b.unix - a.unix;
      }
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

function publishedUnix(item: FeedEntry): number | null {
  const value = item.pubdate ?? item.pubDate;
  if (isNil(value)) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.valueOf() : null;
}

function withDedupeKey(item: Record<string, unknown>) {
  const dedupeKey = typeof item.guid === 'string' ? item.guid : JSON.stringify(item);
  return {
    ...item,
    [DEDUPE_KEY_PROPERTY]: dedupeKey,
  };
}

function getId(item: { id?: string; guid?: string }) {
  if (item.guid) {
    return item.guid;
  }
  if (item.id) {
    return item.id;
  }
  return JSON.stringify(item);
}

async function getChannelId(urlOrId: string) {
  const trimmed = urlOrId.trim();
  const pageUrl = await toChannelPageUrl(trimmed);
  if (isNil(pageUrl)) {
    return trimmed;
  }
  const idInPath = new URL(pageUrl).pathname.match(/^\/channel\/([\w-]+)/);
  if (idInPath) {
    return idInPath[1];
  }
  const response = await httpClient.sendRequest<string>({
    method: HttpMethod.GET,
    url: pageUrl,
    timeout: REQUEST_TIMEOUT_MS,
  });
  const $ = cheerioLoad(response.body);

  // Check if the URL is a channel ID itself
  const channelUrl = $('link[rel="canonical"]').attr('href');
  if (channelUrl && channelUrl.includes('/channel/')) {
    return channelUrl.split('/channel/')[1];
  }

  throw new Error('Invalid YouTube channel URL');
}

async function toChannelPageUrl(value: string): Promise<string | null> {
  if (value.startsWith('@')) {
    return `https://www.youtube.com/${value}`;
  }
  if (!value.includes('://') && !value.includes('youtube.com/')) {
    return null;
  }
  const withScheme = value.includes('://') ? value : `https://${value}`;
  const { data: parsed } = await tryCatch(async () => new URL(withScheme));
  if (isNil(parsed) || !isYoutubeUrl(parsed)) {
    throw new Error('Invalid YouTube channel URL');
  }
  return `https://www.youtube.com${parsed.pathname}`;
}

function isYoutubeUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  const isWeb = url.protocol === 'https:' || url.protocol === 'http:';
  return isWeb && (host === 'youtube.com' || host.endsWith('.youtube.com'));
}

async function getRssItems(channelId: string): Promise<any[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await httpClient.sendRequest<Buffer>({
    method: HttpMethod.GET,
    url,
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT_MS,
  });

  return new Promise((resolve, reject) => {
    const feedparser = new FeedParser({
      addmeta: true,
    });
    const items: any[] = [];

    feedparser.on('readable', () => {
      let item = feedparser.read();
      while (item) {
        items.push(item);
        item = feedparser.read();
      }
    });

    feedparser.on('end', () => {
      resolve(items);
    });

    feedparser.on('error', (error: any) => {
      reject(error);
    });

    feedparser.write(response.body);
    feedparser.end();
  });
}

type FeedEntry = {
  id?: string;
  guid?: string;
  pubdate?: string | Date | null;
  pubDate?: string | Date | null;
};

type StoredChannel = {
  identifier: string;
  channelId: string;
};

type ResolvedChannel = StoredChannel & {
  changed: boolean;
};

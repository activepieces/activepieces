import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  PieceAuth,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { channelIdentifier } from '../common/props';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';
import { load as cheerioLoad } from 'cheerio';
import FeedParser from 'feedparser';
import axios from 'axios';

export const youtubeNewVideoTrigger = createTrigger({
  name: 'new-video',
  displayName: 'New Video In Channel',
  description: 'Runs when a new video is added to a YouTube channel',
  auth: PieceAuth.None(),
  requireAuth: false,
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
  async test({ auth, propsValue, store, files }): Promise<unknown[]> {
    return pollingHelper.test(polling, {
      auth,
      store,
      propsValue,
      files,
    });
  },
  async onEnable({ propsValue, store }): Promise<void> {
    let channelId = await store.get<string>('channelId');
    if (isNil(channelId)) {
      channelId = await getChannelId(propsValue.channel_identifier);
      await store.put('channelId', channelId);
    }
    const items = await getRssItems(channelId);
    if (items.length > 0) {
      await store.put('_seenVideoIds', items.map((item) => getId(item)));
    }
  },
  async onDisable({ store }): Promise<void> {
    await store.delete('_seenVideoIds');
    await store.delete('channelId');
  },
  async run({ propsValue, store }): Promise<unknown[]> {
    let channelId = await store.get<string>('channelId');
    if (isNil(channelId)) {
      channelId = await getChannelId(propsValue.channel_identifier);
      await store.put('channelId', channelId);
    }
    const rawItems = await getRssItems(channelId);

    const seenIds = new Set<string>(await store.get<string[]>('_seenVideoIds') ?? []);
    const newItems = rawItems.filter((item) => !seenIds.has(getId(item)));

    // Advance the seen-IDs set to the current feed so that if the anchor item
    // (e.g. a live stream) is later deleted and pollingHelper would otherwise
    // return all items, the previously-seen IDs are still excluded.
    // Skip the update on an empty feed response to avoid wiping the set and
    // causing false positives on the next successful poll.
    if (rawItems.length > 0) {
      await store.put('_seenVideoIds', rawItems.map((item) => getId(item)));
    }

    return newItems
      .sort((a, b) => {
        const aDate =
          (a as { pubdate?: string; pubDate?: string }).pubdate ??
          (a as { pubdate?: string; pubDate?: string }).pubDate;
        const bDate =
          (b as { pubdate?: string; pubDate?: string }).pubdate ??
          (b as { pubdate?: string; pubDate?: string }).pubDate;

        if (aDate && bDate) {
          const aUnix = dayjs(aDate).unix();
          const bUnix = dayjs(bDate).unix();
          if (aUnix === bUnix) {
            return newItems.indexOf(a) - newItems.indexOf(b);
          }
          return bUnix - aUnix;
        }

        return newItems.indexOf(a) - newItems.indexOf(b);
      })
      .map((item) => withDedupeKey(item as Record<string, unknown>));
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<undefined>,
  { channel_identifier: string }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({
    propsValue,
    store,
  }: {
    store: Store;
    propsValue: { channel_identifier: string };
  }) => {
    let channelId = await store.get<string>('channelId');
    if (isNil(channelId)) {
      channelId = await getChannelId(propsValue.channel_identifier);
      await store.put('channelId', channelId);
    }
    const items = await getRssItems(channelId);
    return items.map((item) => ({
      id: getId(item),
      data: item,
    }));
  },
};

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
  if (urlOrId.trim().startsWith('@')) {
    urlOrId = 'https://www.youtube.com/' + urlOrId;
  }
  if (!urlOrId.includes('https')) {
    return urlOrId;
  }
  const response = await httpClient.sendRequest<any>({
    method: HttpMethod.GET,
    url: urlOrId,
  });
  const $ = cheerioLoad(response.body);

  // Check if the URL is a channel ID itself
  const channelUrl = $('link[rel="canonical"]').attr('href');
  if (channelUrl && channelUrl.includes('/channel/')) {
    return channelUrl.split('/channel/')[1];
  }

  throw new Error('Invalid YouTube channel URL');
}

function getRssItems(channelId: string): Promise<any[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        responseType: 'stream',
      })
      .then((response) => {
        const feedparser = new FeedParser({
          addmeta: true,
        });
        response.data.pipe(feedparser);
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
      })
      .catch((error) => {
        reject(error);
      });
  });
}

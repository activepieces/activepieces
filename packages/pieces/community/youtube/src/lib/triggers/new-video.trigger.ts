import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { channelIdentifier } from '../common/props';
import dayjs from 'dayjs';
import cheerio from 'cheerio';
import FeedParser from 'feedparser';
import axios from 'axios';

export const youtubeNewVideoTrigger = createTrigger({
  name: 'new-video',
  displayName: 'New Video In Channel',
  description: 'Runs when a new video is added to a YouTube channel',
  type: TriggerStrategy.POLLING,
  requireAuth: false,
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
    if (!channelId) {
      return [];
    }
    return (await getRssItems(channelId)) || [];
  },
  async onEnable({ propsValue, store }): Promise<void> {
    const channelId = await getChannelId(propsValue.channel_identifier);

    if (!channelId) {
      throw new Error('Unable to get channel ID.');
    }

    await store.put('channelId', channelId);
    const items = (await getRssItems(channelId)) || [];
    await store.put('lastFetchedYoutubeVideo', items?.[0]?.guid);
    await store.put('lastUpdatedYoutubeVideo', getUpdateDate(items?.[0]));
    return;
  },

  async onDisable(): Promise<void> {
    return;
  },
  async run({ store }): Promise<unknown[]> {
    const channelId = await store.get<string>('channelId');

    if (!channelId) return [];

    const items = (await getRssItems(channelId)) || [];
    if (items.length === 0) {
      return [];
    }
    const lastItemId = await store.get('lastFetchedYoutubeVideo');
    const storedLastUpdated = await store.get<string>(
      'lastUpdatedYoutubeVideo'
    );

    /**
     * If the new latest item's date is before the last saved date
     * it means something got deleted, nothing else to do
     * this happens when a live stream ends, the live stream entry is deleted and later
     * is replaced by the stream's video.
     */
    if (
      storedLastUpdated &&
      dayjs(getUpdateDate(items?.[0])).isBefore(dayjs(storedLastUpdated))
    ) {
      return [];
    }

    const newItems = [];
    for (const item of items) {
      if (item.guid === lastItemId) break;
      if (
        storedLastUpdated &&
        dayjs(getUpdateDate(item)).isBefore(dayjs(storedLastUpdated))
      ) {
        continue;
      }
      newItems.push(item);
    }

    await store.put('lastFetchedYoutubeVideo', items?.[0]?.guid);
    await store.put('lastUpdatedYoutubeVideo', getUpdateDate(items?.[0]));

    return newItems;
  },
});

function getUpdateDate(item: any) {
  const updated = item['atom:updated'];
  if (updated == undefined) {
    return undefined;
  }
  return updated['#'];
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
  const $ = cheerio.load(response.body);

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
          resolve(items.reverse());
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

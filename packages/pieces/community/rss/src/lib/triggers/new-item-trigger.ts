import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PieceAuthProperty,
  PiecePropValueSchema,
  Store,
  StoreScope,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { rssFeedUrl } from '../common/props';
import FeedParser from 'feedparser';
import axios from 'axios';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

export const rssNewItemTrigger = createTrigger({
  name: 'new-item',
  displayName: 'New Item In Feed',
  description: 'Runs when a new item is added in the RSS feed',
  type: TriggerStrategy.POLLING,
  sampleData: {
    title: 'AWS Cloud Quest: Container Services',
    description:
      '<p>This is the DIY challenge of the Container Services in AWS Cloud Quest.</p>\n\n<p></ol>',
    summary:
      '<p>This is the DIY challenge of the Container Services in AWS Cloud Quest.</ol>',
    date: '2023-03-08T21:57:48.000Z',
    pubdate: '2023-03-08T21:57:48.000Z',
    pubDate: '2023-03-08T21:57:48.000Z',
    link: 'https://dev.to/arc/aws-cloud-quest-container-services-1hi7',
    guid: 'https://dev.to/arc/aws-cloud-quest-container-services-1hi7',
    author: 'architec',
    comments: null,
    origlink: null,
    image: {},
    source: {},
    categories: ['aws'],
    enclosures: [],
    'rss:@': {},
    'rss:title': {
      '@': {},
      '#': 'AWS Cloud Quest: Container Services',
    },
    'dc:creator': {
      '@': {},
      '#': 'architec',
    },
    'rss:pubdate': {
      '@': {},
      '#': 'Wed, 08 Mar 2023 21:57:48 +0000',
    },
    'rss:link': {
      '@': {},
      '#': 'https://dev.to/arc/aws-cloud-quest-container-services-1hi7',
    },
    permalink: 'https://dev.to/arc/aws-cloud-quest-container-services-1hi7',
    'rss:guid': {
      '@': {},
      '#': 'https://dev.to/arc/aws-cloud-quest-container-services-1hi7',
    },
    'rss:description': {
      '@': {},
      '#': '<p>This is the DIY challenge of the Container Services in AWS Cloud Quest.</p>\n\n<p><a href="https://res.cloudinary.com/practicaldev/image/fetch/s--pZTG6rga--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/993bebzvmiomak17lm98.png" class="article-body-image-wrapper"><img src="https://res.cloudinary.com/practicaldev/image/fetch/s--pZTG6rga--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_auto%2Cw_880/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/993bebzvmiomak17lm98.png" alt="Image description" width="880" height="419"></a></p>\n\n<h3>\n  \n  \n  DIY Steps:\n</h3>\n\n<ol>\n<li>Repeat step 28-42</li>\n</ol>',
    },
    'rss:category': {
      '@': {},
      '#': 'aws',
    },
    meta: {
      '#ns': [
        {
          'xmlns:atom': 'http://www.w3.org/2005/Atom',
        },
        {
          'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        },
      ],
      '@': [
        {
          'xmlns:atom': 'http://www.w3.org/2005/Atom',
        },
        {
          'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
        },
      ],
      '#xml': {
        version: '1.0',
        encoding: 'UTF-8',
      },
      '#type': 'rss',
      '#version': '2.0',
      title: 'DEV Community',
      description: 'The most recent home feed on DEV Community.',
      date: null,
      pubdate: null,
      pubDate: null,
      link: 'https://dev.to/',
      xmlurl: 'https://dev.to/feed/',
      xmlUrl: 'https://dev.to/feed/',
      author: null,
      language: 'en',
      favicon: null,
      copyright: null,
      generator: null,
      cloud: {},
      image: {},
      categories: [],
      'rss:@': {},
      'rss:title': {
        '@': {},
        '#': 'DEV Community',
      },
      'rss:description': {
        '@': {},
        '#': 'The most recent home feed on DEV Community.',
      },
      'rss:link': {
        '@': {},
        '#': 'https://dev.to/',
      },
      'atom:link': {
        '@': {
          rel: 'self',
          type: 'application/rss+xml',
          href: 'https://dev.to/feed/',
        },
      },
      'rss:language': {
        '@': {},
        '#': 'en',
      },
    },
  },
  props: {
    rss_feed_url: rssFeedUrl,
  },
  async test({ auth, propsValue, store }): Promise<unknown[]> {
    return await pollingHelper.test(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },
  async onEnable({ auth, propsValue, store }): Promise<void> {
    await pollingHelper.onEnable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },

  async onDisable({ auth, propsValue, store }): Promise<void> {
    const lastFetchDate = await store.get<number>('_lastRssPublishDate');
    if (!isNil(lastFetchDate)) {
      await store.delete('_lastRssPublishDate');
    }
    await pollingHelper.onDisable(polling, {
      auth,
      store: store,
      propsValue: propsValue,
    });
  },

  async run({ auth, propsValue, store }): Promise<unknown[]> {
    const lastFetchDate = await store.get<number>('_lastRssPublishDate');
    const newItems = (
      await pollingHelper.poll(polling, {
        auth,
        store: store,
        propsValue: propsValue,
      })
    ).filter((f) => {
      if (isNil(lastFetchDate)) {
        return true;
      }
      const newItem = f as { pubdate: string; pubDate: string };
      const newDate = newItem.pubdate ?? newItem.pubDate;
      if (isNil(newDate)) {
        return true;
      }
      return dayjs(newDate).unix() > lastFetchDate;
    });
    let newFetchDateUnix = lastFetchDate;
    for (const item of newItems) {
      const newItem = item as { pubdate: string; pubDate: string };
      const newDate = newItem.pubdate ?? newItem.pubDate;
      if (!isNil(newDate)) {
        const newDateUnix = dayjs(newDate).unix();
        if (isNil(newFetchDateUnix) || newDateUnix > newFetchDateUnix) {
          newFetchDateUnix = newDateUnix;
        }
      }
    }
    if (!isNil(newFetchDateUnix)) {
      await store.put('_lastRssPublishDate', newFetchDateUnix);
    }
    return newItems.sort((a, b) => {
      const aDate =
        (a as { pubdate: string; pubDate: string }).pubdate ??
        (a as { pubdate: string; pubDate: string }).pubDate;
      const bDate =
        (b as { pubdate: string; pubDate: string }).pubdate ??
        (b as { pubdate: string; pubDate: string }).pubDate;
      if (aDate && bDate) {
        const aUnix = dayjs(aDate).unix();
        const bUnix = dayjs(bDate).unix();
        if (aUnix === bUnix) {
          return newItems.indexOf(a) - newItems.indexOf(b);
        } else {
          return bUnix - aUnix;
        }
      } else {
        return newItems.indexOf(a) - newItems.indexOf(b);
      }
    });
  },
});

const polling: Polling<
  PiecePropValueSchema<PieceAuthProperty>,
  { rss_feed_url: string }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({
    propsValue,
  }: {
    store: Store;
    propsValue: { rss_feed_url: string };
  }) => {
    const items = await getRssItems(propsValue.rss_feed_url);
    return items.map((item) => ({
      id: getId(item),
      data: item,
    }));
  },
};

// Some RSS feeds use the id field, some use the guid field, and some use neither.
function getId(item: { id: string; guid: string }) {
  if (item === undefined) {
    return undefined;
  }
  if (item.guid) {
    return item.guid;
  }
  if (item.id) {
    return item.id;
  }
  return JSON.stringify(item);
}

function getRssItems(url: string): Promise<any[]> {
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

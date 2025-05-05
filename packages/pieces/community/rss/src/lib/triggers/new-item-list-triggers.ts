import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PieceAuthProperty,
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { rssFeedUrls } from '../common/props';
import FeedParser from 'feedparser';
import axios from 'axios';
import { isNil } from '@activepieces/shared';
import dayjs from 'dayjs';
import { getId } from '../common/getId';
import { sampleData } from '../common/sampleData';

type PollingProps = {
  rss_feed_urls: string[];
};

export const rssNewItemListTrigger = createTrigger({
  name: 'new-item-list',
  displayName: 'New Items in Multiple Feeds',
  description: 'Runs when a new item is added in one of the RSS feed',
  type: TriggerStrategy.POLLING,
  sampleData: sampleData,
  props: {
    rss_feed_urls: rssFeedUrls,
  },
  async test({ auth, propsValue, store, files }): Promise<unknown[]> {
    return await pollingHelper.test(polling, {
      auth,
      store: store,
      propsValue: propsValue as PollingProps,
      files: files,
    });
  },
  async onEnable({ auth, propsValue, store }): Promise<void> {
    await pollingHelper.onEnable(polling, {
      auth,
      store: store,
      propsValue: propsValue as PollingProps,
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
      propsValue: propsValue as PollingProps,
    });
  },

  async run({ auth, propsValue, store, files }): Promise<unknown[]> {
    const lastFetchDate = await store.get<number>('_lastRssPublishDate');
    const newItems = (
      await pollingHelper.poll(polling, {
        auth,
        store: store,
        propsValue: propsValue as PollingProps, 
        files: files,
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

async function getRssItemsFromMultipleUrls(urls: string[]): Promise<any[]> {
  const allItems: any[] = [];
  await Promise.all(
    urls.map(async ( url ) => {
      try {
        const items = await getRssItems(url);
        allItems.push(...items);
      } catch (error) {
        console.error(`Error fetching RSS feed from ${url}:`, error);
      }
    })
  );
  return allItems;
}

const polling: Polling<PiecePropValueSchema<PieceAuthProperty>, PollingProps> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ store, propsValue }) => {
    const items = await getRssItemsFromMultipleUrls(propsValue.rss_feed_urls);
    return items.map((item) => ({
      id: getId(item),
      data: item,
    }));
  },
};

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

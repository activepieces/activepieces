import { XMLParser } from 'fast-xml-parser';
import { createTrigger, TriggerStrategy, httpClient, HttpMethod } from '@activepieces/framework';
import { rssFeedUrl } from '../common/props';

export const rssNewItemTrigger = createTrigger({
    name: 'new-item',
    displayName: 'New Item In Feed',
    description: 'Runs when a new item is added in the RSS feed',
    type: TriggerStrategy.POLLING,

    sampleData: {
        title: "The DOJ will brief lawmakers on the classified documents recovered from Trump and Biden",
        description: "The DOJ has resisted calls from lawmakers to access the documents themselves because they're critical to ongoing investigations into Trump and Biden.",
        link: "https://www.businessinsider.com/doj-brief-gang-of-8-trump-biden-classified-documents-2023-2",
        guid: "152c32b1ea5c85e6bf0e883e12d0b880",
        "dc:creator": "Sonam Sheth",
        pubDate: "Wed, 15 Feb 2023 18:33:12 GMT",
        "media:content": ""
    },

    props: {
        rss_feed_url: rssFeedUrl,
    },

    async onEnable({ propsValue, store }): Promise<void> {
        const data = await getRss(propsValue.rss_feed_url);
        const items = data?.rss?.channel?.item || data.feed?.entry || [];
        store.put('lastFetchedRssItem', getId(items?.[0]));
        return;
    },

    async onDisable(): Promise<void> {
        return;
    },

    async run({ propsValue, store }): Promise<unknown[]> {
        const { rss_feed_url } = propsValue;
        const data = await getRss(rss_feed_url);
        const lastItemId = await store.get('lastFetchedRssItem');

        // Most RSS feeds observed return this XML schema and are usually sorted by date descending.
        // Relying on that to get the latest published item and determining if there are new items in the feed.
        // Support both RSS and Atom feeds.
        const items = data?.rss?.channel?.item || data.feed?.entry || [];
        store.put('lastFetchedRssItem', getId(items?.[0]));

        const newItems = [];
        for (const item of items) {
            if (getId(item) === lastItemId) break;
            newItems.push(item);
        }

        return newItems;
    },
});

// Some RSS feeds use the id field, some use the guid field, and some use neither.
function getId(item: { id: string, guid: string }) {
    if (item === undefined) {
        return undefined;
    }
    if (item.guid) {
        return item.guid
    }
    if (item.id) {
        return item.id;
    }
    return JSON.stringify(item);
}

async function getRss(url: string) {
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
    });

    if (!(response?.status === 200)) {
        return [];
    }

    // RSS feeds should normally return an XML response
    if (typeof response.body !== 'string') {
        return [];
    }

    return new XMLParser().parse(response.body);
}

import { XMLParser } from 'fast-xml-parser';
import { createTrigger, TriggerStrategy, httpClient, HttpMethod } from '@activepieces/framework';
import { youtubeFeedUrl } from '../common/props';
import dayjs from 'dayjs';

export const youtubeNewVideoTrigger = createTrigger({
    name: 'new-item',
    displayName: 'New Item In Feed',
    description: 'Runs when a new video is added to a YouTube channel',
    type: TriggerStrategy.POLLING,

    props: {
        youtube_feed_url: youtubeFeedUrl,
    },

    async onEnable({ propsValue, store }): Promise<void> {
        const data = await getRss(propsValue.youtube_feed_url);
        const items = data.feed?.entry || [];

        store.put('lastFetchedYoutubeVideo', getId(items?.[0]));
        store.put('lastPublishedYoutubeVideo', items?.[0].published);
        return;
    },

    async onDisable(): Promise<void> {
        return;
    },
    async run({ propsValue, store }): Promise<unknown[]> {
        const { youtube_feed_url } = propsValue;
        const data = await getRss(youtube_feed_url);
        const lastItemId = await store.get('lastFetchedYoutubeVideo');
        const storedLastPublished = await store.get<string>('lastPublishedYoutubeVideo');

        const items = data.feed?.entry || [];
        store.put('lastFetchedYoutubeVideo', getId(items?.[0]));
        store.put('lastPublishedYoutubeVideo', items?.[0].published);

        /**
         * If the new latest item's date is before the last saved date
         * it means something got deleted, nothing else to do
         * this happens when a live stream ends, the live stream entry is deleted and later
         * is replaced by the stream's video.
         */
        if (dayjs(items?.[0].published).isBefore(dayjs(storedLastPublished))) {
            return [];
        }

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

    if (typeof response.body !== 'string') {
        return [];
    }

    return new XMLParser().parse(response.body);
}
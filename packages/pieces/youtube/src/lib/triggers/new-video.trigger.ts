import { createTrigger, TriggerStrategy, httpClient, HttpMethod } from '@activepieces/framework';
import { channelIdentifier } from '../common/props';
import dayjs from 'dayjs';
import cheerio from "cheerio";
import FeedParser from 'feedparser';
import axios from 'axios';

export const youtubeNewVideoTrigger = createTrigger({
    name: 'new-video',
    displayName: 'New Video In Channel',
    description: 'Runs when a new video is added to a YouTube channel',
    type: TriggerStrategy.POLLING,

    props: {
        channel_identifier: channelIdentifier,
    },
    sampleData: {
        "title": "Ap Flow Branching",
        "description": null,
        "summary": null,
        "date": "2023-03-02T19:16:26.000Z",
        "pubdate": "2023-03-01T21:31:36.000Z",
        "pubDate": "2023-03-01T21:31:36.000Z",
        "link": "https://www.youtube.com/watch?v=C7MZkWxrtvM",
        "guid": "yt:video:C7MZkWxrtvM",
        "author": "Mohammad AbuAboud",
        "comments": null,
        "origlink": null,
        "image": {
            "url": "https://i4.ytimg.com/vi/C7MZkWxrtvM/hqdefault.jpg"
        },
        "source": {},
        "categories": [],
        "enclosures": [],
        "atom:@": {},
        "atom:id": {
            "@": {},
            "#": "yt:video:C7MZkWxrtvM"
        },
        "yt:videoid": {
            "@": {},
            "#": "C7MZkWxrtvM"
        },
        "yt:channelid": {
            "@": {},
            "#": "UCgImnA993V_2IbQ9seYNEzA"
        },
        "atom:title": {
            "@": {},
            "#": "Ap Flow Branching"
        },
        "atom:link": {
            "@": {
                "rel": "alternate",
                "href": "https://www.youtube.com/watch?v=C7MZkWxrtvM"
            }
        },
        "atom:author": {
            "@": {},
            "name": {
                "@": {},
                "#": "Mohammad AbuAboud"
            },
            "uri": {
                "@": {},
                "#": "https://www.youtube.com/channel/UCgImnA993V_2IbQ9seYNEzA"
            }
        },
        "atom:published": {
            "@": {},
            "#": "2023-03-01T21:31:36+00:00"
        }
    },
    async onEnable({ propsValue, store }): Promise<void> {
        const channelId = await getChannelId(propsValue.channel_identifier);

        if (!channelId) {
            throw new Error('Unable to get channel ID.');
        }

        await store.put('channelId', channelId);
        const items = (await getRssItems(channelId)) || [];

        await store.put('lastFetchedYoutubeVideo', items?.[0]?.guid);
        await store.put('lastPublishedYoutubeVideo', items?.[0].pubDate);
        return;
    },

    async onDisable(): Promise<void> {
        return;
    },
    async run({ store }): Promise<unknown[]> {
        const channelId = await store.get<string>('channelId');

        if (!channelId) return [];

        const items = (await getRssItems(channelId)) || [];
        const lastItemId = await store.get('lastFetchedYoutubeVideo');
        const storedLastPublished = await store.get<string>('lastPublishedYoutubeVideo');

        await store.put('lastFetchedYoutubeVideo', items?.[0]?.guid);
        await store.put('lastPublishedYoutubeVideo', items?.[0].pubDate);

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
            if (item.id === lastItemId) break;
            newItems.push(item);
        }

        return newItems;
    },
});

async function getChannelId(urlOrId: string) {
    if (urlOrId.trim().startsWith("@")) {
        urlOrId = "https://www.youtube.com/" + urlOrId;
    }
    if (!urlOrId.includes("https")) {
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
        axios.get(url, {
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
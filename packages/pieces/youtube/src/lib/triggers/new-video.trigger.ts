import { XMLParser } from 'fast-xml-parser';
import { createTrigger, TriggerStrategy, httpClient, HttpMethod } from '@activepieces/framework';
import { channelIdentifier } from '../common/props';
import dayjs from 'dayjs';

export const youtubeNewVideoTrigger = createTrigger({
    name: 'new-video',
    displayName: 'New Video In Channel',
    description: 'Runs when a new video is added to a YouTube channel',
    type: TriggerStrategy.POLLING,

    props: {
        channel_identifier: channelIdentifier,
    },
    sampleData: {
        "id": "yt:video:hVz5GAcysoE",
        "yt:videoId": "hVz5GAcysoE",
        "yt:channelId": "UCq-Fj5jknLsUf-MWSy4_brA",
        "title": "Bhool Bhulaiyaa 2 Scene #5 \"Shanti Mil Chuki Hai\" | Kartik Aaryan, Kiara Advani & Tabu | Bhushan K",
        "link": "",
        "author": {
            "name": "T-Series",
            "uri": "https://www.youtube.com/channel/UCq-Fj5jknLsUf-MWSy4_brA"
        },
        "published": "2023-03-08T13:30:13+00:00",
        "updated": "2023-03-08T13:30:14+00:00",
        "media:group": {
            "media:title": "Bhool Bhulaiyaa 2 Scene #5 \"Shanti Mil Chuki Hai\" | Kartik Aaryan, Kiara Advani & Tabu | Bhushan K",
            "media:content": "",
            "media:thumbnail": "",
            "media:description": "Presenting Bhool Bhulaiyaa 2 Scene #5 \"Shanti Mil Chuki Hai\"\n\nGulshan Kumar & T-Series presents \"Bhool Bhulaiyaa 2\" produced by Bhushan Kumar, Murad Khetani, and Krishan Kumar under the banner of T-Series and Cine1 Studios, starring Kartik Aaryan, Kiara Advani and Tabu, directed by Anees Bazmee, screenplay by Akash Kaushik and dialogues by Farhad Samji and Akash Kaushik. \n\n___________________________________\nEnjoy & stay connected with us!\n👉 Subscribe to T-Series: http://bit.ly/TSeriesYouTube\n👉 Like us on Facebook: https://www.facebook.com/tseriesmusic\n👉 Follow us on Twitter: https://twitter.com/tseries\n👉 Follow us on Instagram: http://bit.ly/InstagramTseries",
            "media:community": {
                "media:starRating": "",
                "media:statistics": ""
            }
        }
    },
    async onEnable({ propsValue, store }): Promise<void> {
        const channelId = await parseChannelIdentifier(propsValue.channel_identifier);

        if (!channelId) {
            throw new Error('Unable to get channel ID.');
        }

        await store.put('channelId', channelId);
        const data = await getRss(channelId);
        const items = data.feed?.entry || [];

        await store.put('lastFetchedYoutubeVideo', items?.[0]?.id);
        await store.put('lastPublishedYoutubeVideo', items?.[0].published);
        return;
    },

    async onDisable(): Promise<void> {
        return;
    },
    async run({ store }): Promise<unknown[]> {
        const channelId = await store.get<string>('channelId');

        if (!channelId) return [];

        const data = await getRss(channelId);
        const lastItemId = await store.get('lastFetchedYoutubeVideo');
        const storedLastPublished = await store.get<string>('lastPublishedYoutubeVideo');

        const items = data.feed?.entry || [];
        await store.put('lastFetchedYoutubeVideo', items?.[0]?.id);
        await store.put('lastPublishedYoutubeVideo', items?.[0].published);

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

const ChannelParsingRegex = {
    CHANNEL_ID: /^UC[a-zA-Z0-9_-]{22}$/,
    HANDLE: /(@[A-Za-z0-9\-_\.]{1,})(?:\?.*)?$/,
    URL_WITH_CHANNEL_ID: /^(?:http(?:s)?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/)([A-Za-z0-9\-_\.]{1,})(?:\?.*)?$/,
};

async function parseChannelIdentifier(channelIdentifier: string) {
    let match: string;

    match = ChannelParsingRegex.CHANNEL_ID.exec(channelIdentifier)?.[1] ?? '';
    if (match) return match;

    match = ChannelParsingRegex.URL_WITH_CHANNEL_ID.exec(channelIdentifier)?.[1] ?? '';
    if (match) return match;

    match = ChannelParsingRegex.HANDLE.exec(channelIdentifier)?.[1] ?? '';
    if (match) {
        return await fetchChannelIdByHandle(match);
    }

    return null;
}

async function fetchChannelIdByHandle(channelHandle: string) {
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://www.youtube.com/${channelHandle}`
    })
    const pageSource = response.body;

    if (typeof pageSource !== 'string') {
        return null;
    }

    // Extract the channel ID from the page source using a regular expression
    const channelIdRegex = /"channelId":"(.*?)"/;
    return channelIdRegex.exec(pageSource)?.[1] ?? null;
}

async function getRss(channel_id: string) {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel_id}`;
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
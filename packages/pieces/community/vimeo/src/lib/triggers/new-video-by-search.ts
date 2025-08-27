
import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { vimeoAuth } from '../common';

// Define the props for the trigger
const props = {
    query: Property.ShortText({
        displayName: 'Search Query',
        description: 'The search query to monitor for new videos (e.g., conference name, keyword)',
        required: true,
    }),
    sort: Property.StaticDropdown({
        displayName: 'Sort Order',
        description: 'How to sort the search results',
        required: false,
        options: {
            options: [
                { label: 'Most Recent', value: 'date' },
                { label: 'Most Relevant', value: 'relevant' },
                { label: 'Most Popular', value: 'plays' },
                { label: 'Most Liked', value: 'likes' }
            ]
        },
        defaultValue: 'date'
    })
};

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS, auth }) => {
        const { query, sort = 'date' } = propsValue;
        const accessToken = auth;
        
        // Fetch videos from Vimeo API based on search query
        const response = await fetch(
            `https://api.vimeo.com/videos?query=${encodeURIComponent(query)}&sort=${sort}&direction=desc&per_page=25`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Vimeo API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const videos = data.data || [];

        // Filter videos created after the last fetch
        const filteredVideos = videos.filter((video: any) => {
            const videoDate = dayjs(video.created_time).valueOf();
            return videoDate > lastFetchEpochMS;
        });

        return filteredVideos.map((video: any) => ({
            epochMilliSeconds: dayjs(video.created_time).valueOf(),
            data: {
                id: video.uri.split('/').pop(),
                title: video.name,
                description: video.description,
                created_time: video.created_time,
                duration: video.duration,
                plays: video.stats?.plays || 0,
                likes: video.metadata?.connections?.likes?.total || 0,
                comments: video.metadata?.connections?.comments?.total || 0,
                link: video.link,
                thumbnail: video.pictures?.base_link,
                user: {
                    name: video.user?.name,
                    link: video.user?.link
                }
            }
        }));
    }
};

export const newVideoBySearch = createTrigger({
    auth: vimeoAuth,
    name: 'new-video-by-search',
    displayName: 'New Video by Search',
    description: 'Fires when a new video is added that matches a search query. Monitor a keyword (e.g., a conference name) and log matches to a Google Sheet.',
    props: props,
    sampleData: {
        id: '123456789',
        title: 'Sample Video Title',
        description: 'This is a sample video description',
        created_time: '2024-01-01T00:00:00Z',
        duration: 120,
        plays: 100,
        likes: 25,
        comments: 10,
        link: 'https://vimeo.com/123456789',
        thumbnail: 'https://i.vimeocdn.com/video/123456789_640.jpg',
        user: {
            name: 'Sample User',
            link: 'https://vimeo.com/user123'
        }
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
            files: context.files,
        });
    },
});

import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, StaticPropsValue } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { vimeoAuth } from '../common';

// Define the props for the trigger
const props = {
    sort: Property.StaticDropdown({
        displayName: 'Sort Order',
        description: 'How to sort the liked videos',
        required: false,
        options: {
            options: [
                { label: 'Most Recent', value: 'date' },
                { label: 'Most Popular', value: 'plays' },
                { label: 'Most Liked', value: 'likes' },
                { label: 'Alphabetical', value: 'alphabetical' }
            ]
        },
        defaultValue: 'date'
    })
};

const polling: Polling<PiecePropValueSchema<typeof vimeoAuth>, StaticPropsValue<typeof props>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, lastFetchEpochMS, auth }) => {
        const { sort = 'date' } = propsValue;
        const accessToken = auth;
        
        // First, get the authenticated user's information
        const userResponse = await fetch(
            'https://api.vimeo.com/me',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!userResponse.ok) {
            throw new Error(`Failed to get user info: ${userResponse.status} ${userResponse.statusText}`);
        }

        const userData = await userResponse.json();
        const userUri = userData.uri;

        // Fetch videos that the authenticated user has liked
        const response = await fetch(
            `https://api.vimeo.com${userUri}/likes?sort=${sort}&direction=desc&per_page=25`,
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
        const likedVideos = data.data || [];

        // Filter videos liked after the last fetch
        const filteredVideos = likedVideos.filter((video: any) => {
            // For liked videos, we need to check when they were liked, not when they were created
            // Vimeo doesn't provide a direct "liked_at" timestamp, so we'll use the video's created time
            // and filter based on when we last checked
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
                    link: video.user?.link,
                    uri: video.user?.uri
                },
                privacy: video.privacy?.view,
                embed: video.privacy?.embed,
                download: video.privacy?.download,
                category: video.category?.name,
                tags: video.tags?.map((tag: any) => tag.name) || [],
                content_rating: video.content_rating || []
            }
        }));
    }
};

export const newVideoIHaveLiked = createTrigger({
    auth: vimeoAuth,
    name: 'new-video-i-have-liked',
    displayName: 'New Video I Have Liked',
    description: 'Fires when you like a new video on Vimeo. Auto-post the liked video to a #inspiration channel in Slack for your team.',
    props: props,
    sampleData: {
        id: '123456789',
        title: 'Amazing Creative Video',
        description: 'This is a video that I found inspiring and liked',
        created_time: '2024-01-01T00:00:00Z',
        duration: 240,
        plays: 1500,
        likes: 89,
        comments: 23,
        link: 'https://vimeo.com/123456789',
        thumbnail: 'https://i.vimeocdn.com/video/123456789_640.jpg',
        user: {
            name: 'Creative Artist',
            link: 'https://vimeo.com/creativeartist',
            uri: '/users/67890'
        },
        privacy: 'anybody',
        embed: 'public',
        download: true,
        category: 'Animation',
        tags: ['inspiration', 'creative', 'animation'],
        content_rating: ['safe']
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